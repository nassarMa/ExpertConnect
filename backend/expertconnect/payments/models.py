from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import stripe
import json
import logging
from django.conf import settings

User = get_user_model()
logger = logging.getLogger(__name__)

class PaymentGateway(models.Model):
    """
    Model to store payment gateway configurations
    """
    GATEWAY_TYPES = (
        ('stripe', 'Stripe'),
        ('paypal', 'PayPal'),
        ('bank_transfer', 'Bank Transfer'),
    )
    
    name = models.CharField(max_length=100)
    gateway_type = models.CharField(max_length=20, choices=GATEWAY_TYPES)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    configuration = models.JSONField(default=dict, blank=True)
    test_mode = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_default', 'name']
    
    def __str__(self):
        mode = "Test" if self.test_mode else "Live"
        return f"{self.name} ({mode})"
    
    def save(self, *args, **kwargs):
        # If this is being set as default, unset any other default gateways
        if self.is_default:
            PaymentGateway.objects.filter(
                is_default=True
            ).update(is_default=False)
        super().save(*args, **kwargs)
    
    @property
    def api_keys(self):
        """Get API keys based on test mode"""
        if self.gateway_type == 'stripe':
            if self.test_mode:
                return {
                    'publishable_key': self.configuration.get('test_publishable_key', ''),
                    'secret_key': self.configuration.get('test_secret_key', '')
                }
            else:
                return {
                    'publishable_key': self.configuration.get('live_publishable_key', ''),
                    'secret_key': self.configuration.get('live_secret_key', '')
                }
        elif self.gateway_type == 'paypal':
            if self.test_mode:
                return {
                    'client_id': self.configuration.get('test_client_id', ''),
                    'client_secret': self.configuration.get('test_client_secret', '')
                }
            else:
                return {
                    'client_id': self.configuration.get('live_client_id', ''),
                    'client_secret': self.configuration.get('live_client_secret', '')
                }
        return {}


class PaymentProcessor:
    """
    Service class for processing payments through different gateways
    """
    @staticmethod
    def get_default_gateway():
        """Get the default payment gateway"""
        try:
            return PaymentGateway.objects.filter(is_active=True, is_default=True).first()
        except Exception as e:
            logger.error(f"Error getting default gateway: {str(e)}")
            return None
    
    @staticmethod
    def process_stripe_payment(payment, token, gateway=None):
        """
        Process a payment through Stripe
        
        Args:
            payment: Payment object
            token: Stripe token from frontend
            gateway: Optional PaymentGateway object, uses default if not provided
            
        Returns:
            tuple: (success, transaction_id or error_message)
        """
        if not gateway:
            gateway = PaymentProcessor.get_default_gateway()
            if not gateway or gateway.gateway_type != 'stripe':
                return False, "No valid Stripe gateway configured"
        
        try:
            # Set the API key
            stripe.api_key = gateway.api_keys.get('secret_key')
            
            # Create a charge
            charge = stripe.Charge.create(
                amount=int(payment.amount * 100),  # Convert to cents
                currency="usd",
                source=token,
                description=f"Credit purchase: {payment.credits_purchased} credits",
                metadata={
                    "user_id": payment.user.id,
                    "payment_id": payment.id,
                    "credits": payment.credits_purchased
                }
            )
            
            # Update payment with transaction details
            payment.transaction_id = charge.id
            payment.payment_details = {
                "charge_id": charge.id,
                "card_last4": charge.payment_method_details.card.last4,
                "card_brand": charge.payment_method_details.card.brand,
                "payment_method": "stripe"
            }
            payment.mark_as_completed(charge.id)
            
            return True, charge.id
            
        except stripe.error.CardError as e:
            # Card was declined
            body = e.json_body
            err = body.get('error', {})
            payment.mark_as_failed(err.get('message'))
            return False, err.get('message')
            
        except Exception as e:
            logger.error(f"Stripe payment error: {str(e)}")
            payment.mark_as_failed(str(e))
            return False, str(e)
    
    @staticmethod
    def process_paypal_payment(payment, paypal_data, gateway=None):
        """
        Process a payment through PayPal
        
        Args:
            payment: Payment object
            paypal_data: PayPal payment data from frontend
            gateway: Optional PaymentGateway object, uses default if not provided
            
        Returns:
            tuple: (success, transaction_id or error_message)
        """
        if not gateway:
            gateway = PaymentProcessor.get_default_gateway()
            if not gateway or gateway.gateway_type != 'paypal':
                return False, "No valid PayPal gateway configured"
        
        try:
            # Verify the payment with PayPal
            # In a real implementation, this would make API calls to PayPal
            # to verify the payment was completed
            
            # For now, we'll just use the data provided
            transaction_id = paypal_data.get('transaction_id')
            if not transaction_id:
                return False, "No transaction ID provided"
            
            # Update payment with transaction details
            payment.transaction_id = transaction_id
            payment.payment_details = {
                "payer_id": paypal_data.get('payer_id'),
                "payer_email": paypal_data.get('payer_email'),
                "payment_method": "paypal"
            }
            payment.mark_as_completed(transaction_id)
            
            return True, transaction_id
            
        except Exception as e:
            logger.error(f"PayPal payment error: {str(e)}")
            payment.mark_as_failed(str(e))
            return False, str(e)
    
    @staticmethod
    def create_payment_intent(amount, currency="usd", gateway=None):
        """
        Create a payment intent for Stripe
        
        Args:
            amount: Amount in dollars
            currency: Currency code
            gateway: Optional PaymentGateway object, uses default if not provided
            
        Returns:
            tuple: (success, client_secret or error_message)
        """
        if not gateway:
            gateway = PaymentProcessor.get_default_gateway()
            if not gateway or gateway.gateway_type != 'stripe':
                return False, "No valid Stripe gateway configured"
        
        try:
            # Set the API key
            stripe.api_key = gateway.api_keys.get('secret_key')
            
            # Create a payment intent
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to cents
                currency=currency,
            )
            
            return True, intent.client_secret
            
        except Exception as e:
            logger.error(f"Stripe payment intent error: {str(e)}")
            return False, str(e)
    
    @staticmethod
    def verify_webhook_event(payload, signature, gateway=None):
        """
        Verify a webhook event from Stripe
        
        Args:
            payload: Raw request body
            signature: Stripe signature header
            gateway: Optional PaymentGateway object, uses default if not provided
            
        Returns:
            tuple: (success, event or error_message)
        """
        if not gateway:
            gateway = PaymentProcessor.get_default_gateway()
            if not gateway or gateway.gateway_type != 'stripe':
                return False, "No valid Stripe gateway configured"
        
        try:
            # Set the API key
            stripe.api_key = gateway.api_keys.get('secret_key')
            
            # Get webhook secret from gateway configuration
            webhook_secret = gateway.configuration.get('webhook_secret')
            if not webhook_secret:
                return False, "No webhook secret configured"
            
            # Verify the event
            event = stripe.Webhook.construct_event(
                payload, signature, webhook_secret
            )
            
            return True, event
            
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Stripe webhook signature error: {str(e)}")
            return False, "Invalid signature"
            
        except Exception as e:
            logger.error(f"Stripe webhook error: {str(e)}")
            return False, str(e)


class SubscriptionPlan(models.Model):
    """
    Model for subscription plans
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    credits_per_month = models.PositiveIntegerField()
    duration_months = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    features = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - ${self.price}/month"
    
    @property
    def price_per_credit(self):
        """Calculate the price per credit"""
        if self.credits_per_month > 0:
            return self.price / self.credits_per_month
        return 0


class Subscription(models.Model):
    """
    Model for user subscriptions
    """
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('canceled', 'Canceled'),
        ('expired', 'Expired'),
        ('trial', 'Trial'),
        ('past_due', 'Past Due'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, related_name='subscriptions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField()
    auto_renew = models.BooleanField(default=True)
    payment_method = models.ForeignKey('credits.PaymentMethod', on_delete=models.SET_NULL, null=True, related_name='subscriptions')
    subscription_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.plan.name} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        # Set end date if not provided
        if not self.end_date:
            self.end_date = self.start_date + timezone.timedelta(days=30 * self.plan.duration_months)
        super().save(*args, **kwargs)
    
    def cancel(self):
        """Cancel the subscription"""
        self.status = 'canceled'
        self.auto_renew = False
        self.save()
        
        # Add cancellation record
        SubscriptionEvent.objects.create(
            subscription=self,
            event_type='cancellation',
            description=f"Subscription canceled"
        )
        
        return True
    
    def renew(self):
        """Renew the subscription"""
        if not self.auto_renew:
            return False
        
        # Calculate new dates
        new_start = self.end_date
        new_end = new_start + timezone.timedelta(days=30 * self.plan.duration_months)
        
        self.start_date = new_start
        self.end_date = new_end
        self.status = 'active'
        self.save()
        
        # Add renewal record
        SubscriptionEvent.objects.create(
            subscription=self,
            event_type='renewal',
            description=f"Subscription renewed"
        )
        
        # Add credits to user
        user_credit, created = UserCredit.objects.get_or_create(user=self.user)
        user_credit.add_credits(
            self.plan.credits_per_month,
            description=f"Monthly subscription credits: {self.plan.name}"
        )
        
        return True
    
    @property
    def is_active(self):
        """Check if subscription is active"""
        return self.status == 'active' and self.end_date > timezone.now()
    
    @property
    def days_remaining(self):
        """Calculate days remaining in subscription"""
        if not self.is_active:
            return 0
        
        delta = self.end_date - timezone.now()
        return max(0, delta.days)


class SubscriptionEvent(models.Model):
    """
    Model for subscription events
    """
    EVENT_TYPES = (
        ('creation', 'Creation'),
        ('renewal', 'Renewal'),
        ('cancellation', 'Cancellation'),
        ('payment_failure', 'Payment Failure'),
        ('plan_change', 'Plan Change'),
    )
    
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='events')
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    description = models.CharField(max_length=255)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.subscription.user.username} - {self.get_event_type_display()}"
