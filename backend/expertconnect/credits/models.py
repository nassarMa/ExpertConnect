from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator

User = get_user_model()

class CreditPackage(models.Model):
    """
    Model to store credit packages that users can purchase
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    credit_amount = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    discount_percentage = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.credit_amount} credits for ${self.price}"
    
    @property
    def discounted_price(self):
        """Calculate the discounted price if a discount is applied"""
        if self.discount_percentage > 0:
            discount = (self.price * self.discount_percentage) / 100
            return self.price - discount
        return self.price
    
    @property
    def price_per_credit(self):
        """Calculate the price per credit"""
        if self.credit_amount > 0:
            return self.price / self.credit_amount
        return 0


class UserCredit(models.Model):
    """
    Model to store user credit balances
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='credits')
    balance = models.PositiveIntegerField(default=0)
    lifetime_earned = models.PositiveIntegerField(default=0)
    lifetime_spent = models.PositiveIntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s credits: {self.balance}"
    
    def add_credits(self, amount):
        """Add credits to user balance"""
        if amount <= 0:
            raise ValueError("Credit amount must be positive")
        
        self.balance += amount
        self.lifetime_earned += amount
        self.save()
        
        # Create transaction record
        CreditTransaction.objects.create(
            user=self.user,
            amount=amount,
            type='purchase',
            balance_after=self.balance,
            description=f"Added {amount} credits"
        )
        
        return self.balance
    
    def use_credits(self, amount, description="Used credits"):
        """Use credits from user balance"""
        if amount <= 0:
            raise ValueError("Credit amount must be positive")
        
        if amount > self.balance:
            raise ValueError("Insufficient credits")
        
        self.balance -= amount
        self.lifetime_spent += amount
        self.save()
        
        # Create transaction record
        CreditTransaction.objects.create(
            user=self.user,
            amount=-amount,
            type='booking',
            balance_after=self.balance,
            description=description
        )
        
        return self.balance
    
    def refund_credits(self, amount, description="Refunded credits"):
        """Refund credits to user balance"""
        if amount <= 0:
            raise ValueError("Refund amount must be positive")
        
        self.balance += amount
        self.lifetime_spent -= min(amount, self.lifetime_spent)
        self.save()
        
        # Create transaction record
        CreditTransaction.objects.create(
            user=self.user,
            amount=amount,
            type='refund',
            balance_after=self.balance,
            description=description
        )
        
        return self.balance


class CreditTransaction(models.Model):
    """
    Model to store credit transactions
    """
    TRANSACTION_TYPES = (
        ('purchase', 'Purchase'),
        ('booking', 'Booking'),
        ('refund', 'Refund'),
        ('bonus', 'Bonus'),
        ('transfer', 'Transfer'),
        ('adjustment', 'Adjustment'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='credit_transactions')
    amount = models.IntegerField()  # Positive for additions, negative for deductions
    type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    balance_after = models.PositiveIntegerField()
    description = models.CharField(max_length=255)
    reference_id = models.CharField(max_length=100, blank=True, help_text="Reference ID for external systems")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.type}: {self.amount} credits"


class Payment(models.Model):
    """
    Model to store payment information
    """
    PAYMENT_STATUS = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )
    
    PAYMENT_METHODS = (
        ('credit_card', 'Credit Card'),
        ('paypal', 'PayPal'),
        ('bank_transfer', 'Bank Transfer'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    credit_package = models.ForeignKey(CreditPackage, on_delete=models.SET_NULL, null=True, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    credits_purchased = models.PositiveIntegerField()
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    transaction_id = models.CharField(max_length=100, blank=True)
    payment_details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.amount} - {self.status}"
    
    def mark_as_completed(self, transaction_id):
        """Mark payment as completed and add credits to user"""
        if self.status == 'completed':
            return False
        
        self.status = 'completed'
        self.transaction_id = transaction_id
        self.save()
        
        # Add credits to user
        user_credit, created = UserCredit.objects.get_or_create(user=self.user)
        user_credit.add_credits(self.credits_purchased)
        
        return True
    
    def mark_as_failed(self, reason=None):
        """Mark payment as failed"""
        self.status = 'failed'
        if reason:
            self.payment_details['failure_reason'] = reason
        self.save()
        
        return True
    
    def refund(self, reason=None):
        """Refund payment and deduct credits from user"""
        if self.status != 'completed':
            return False
        
        self.status = 'refunded'
        if reason:
            self.payment_details['refund_reason'] = reason
        self.save()
        
        # Deduct credits from user if they still have enough
        try:
            user_credit = UserCredit.objects.get(user=self.user)
            if user_credit.balance >= self.credits_purchased:
                user_credit.use_credits(
                    self.credits_purchased, 
                    f"Refund for payment #{self.id}"
                )
        except (UserCredit.DoesNotExist, ValueError):
            # If user doesn't have enough credits, just mark as refunded without deducting
            pass
        
        return True


class PaymentMethod(models.Model):
    """
    Model to store user payment methods
    """
    CARD_TYPES = (
        ('visa', 'Visa'),
        ('mastercard', 'Mastercard'),
        ('amex', 'American Express'),
        ('discover', 'Discover'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_methods')
    method_type = models.CharField(max_length=20, choices=Payment.PAYMENT_METHODS)
    is_default = models.BooleanField(default=False)
    
    # Credit card specific fields
    card_type = models.CharField(max_length=20, choices=CARD_TYPES, blank=True)
    last_four = models.CharField(max_length=4, blank=True)
    expiry_month = models.CharField(max_length=2, blank=True)
    expiry_year = models.CharField(max_length=4, blank=True)
    
    # PayPal specific fields
    paypal_email = models.EmailField(blank=True)
    
    # Token for payment processor
    payment_token = models.CharField(max_length=255, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_default', '-created_at']
    
    def __str__(self):
        if self.method_type == 'credit_card':
            return f"{self.get_card_type_display()} ending in {self.last_four}"
        elif self.method_type == 'paypal':
            return f"PayPal - {self.paypal_email}"
        return f"{self.get_method_type_display()}"
    
    def save(self, *args, **kwargs):
        # If this is being set as default, unset any other default methods
        if self.is_default:
            PaymentMethod.objects.filter(
                user=self.user, 
                method_type=self.method_type,
                is_default=True
            ).update(is_default=False)
        super().save(*args, **kwargs)
