from rest_framework import serializers
from .models import PaymentGateway, SubscriptionPlan, Subscription, SubscriptionEvent
from expertconnect.credits.models import Payment, PaymentMethod, CreditPackage, UserCredit, CreditTransaction
from django.contrib.auth import get_user_model

User = get_user_model()

class PaymentGatewaySerializer(serializers.ModelSerializer):
    """Serializer for payment gateways"""
    class Meta:
        model = PaymentGateway
        fields = [
            'id', 'name', 'gateway_type', 'is_active', 'is_default',
            'test_mode', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        """Remove sensitive data from representation"""
        ret = super().to_representation(instance)
        # Add public keys for frontend
        if instance.gateway_type == 'stripe':
            ret['publishable_key'] = instance.api_keys.get('publishable_key', '')
        elif instance.gateway_type == 'paypal':
            ret['client_id'] = instance.api_keys.get('client_id', '')
        return ret


class PaymentGatewayAdminSerializer(serializers.ModelSerializer):
    """Admin serializer for payment gateways with configuration"""
    class Meta:
        model = PaymentGateway
        fields = [
            'id', 'name', 'gateway_type', 'is_active', 'is_default',
            'configuration', 'test_mode', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Serializer for subscription plans"""
    price_per_credit = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'description', 'price', 'credits_per_month',
            'duration_months', 'is_active', 'is_featured', 'features',
            'price_per_credit', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'price_per_credit']


class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for subscriptions"""
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'user', 'plan', 'plan_name', 'status', 'start_date',
            'end_date', 'auto_renew', 'payment_method', 'subscription_id',
            'days_remaining', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'start_date', 'end_date', 'subscription_id',
            'created_at', 'updated_at', 'days_remaining', 'is_active'
        ]


class SubscriptionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating subscriptions"""
    class Meta:
        model = Subscription
        fields = ['plan', 'payment_method', 'auto_renew']
    
    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        
        # Create subscription
        subscription = Subscription.objects.create(**validated_data)
        
        # Add initial credits to user
        user_credit, created = UserCredit.objects.get_or_create(user=user)
        user_credit.add_credits(
            subscription.plan.credits_per_month,
            description=f"Initial subscription credits: {subscription.plan.name}"
        )
        
        # Add creation event
        SubscriptionEvent.objects.create(
            subscription=subscription,
            event_type='creation',
            description=f"Subscription created: {subscription.plan.name}"
        )
        
        return subscription


class SubscriptionEventSerializer(serializers.ModelSerializer):
    """Serializer for subscription events"""
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    
    class Meta:
        model = SubscriptionEvent
        fields = [
            'id', 'subscription', 'event_type', 'event_type_display',
            'description', 'metadata', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PaymentMethodSerializer(serializers.ModelSerializer):
    """Serializer for payment methods"""
    method_type_display = serializers.CharField(source='get_method_type_display', read_only=True)
    card_type_display = serializers.CharField(source='get_card_type_display', read_only=True)
    
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'user', 'method_type', 'method_type_display', 'is_default',
            'card_type', 'card_type_display', 'last_four', 'expiry_month', 'expiry_year',
            'paypal_email', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Set user to current user if not provided
        if 'user' not in validated_data:
            validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class PaymentMethodCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating payment methods"""
    token = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = PaymentMethod
        fields = [
            'method_type', 'is_default', 'card_type', 'last_four',
            'expiry_month', 'expiry_year', 'paypal_email', 'token'
        ]
    
    def create(self, validated_data):
        user = self.context['request'].user
        token = validated_data.pop('token', None)
        
        # Store token if provided
        if token:
            validated_data['payment_token'] = token
        
        # Create payment method
        payment_method = PaymentMethod.objects.create(user=user, **validated_data)
        return payment_method


class CreditPackageSerializer(serializers.ModelSerializer):
    """Serializer for credit packages"""
    discounted_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    price_per_credit = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    
    class Meta:
        model = CreditPackage
        fields = [
            'id', 'name', 'description', 'credit_amount', 'price',
            'is_active', 'is_featured', 'discount_percentage',
            'discounted_price', 'price_per_credit', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'discounted_price', 'price_per_credit']


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for payments"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    package_name = serializers.CharField(source='credit_package.name', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'user_name', 'credit_package', 'package_name',
            'amount', 'credits_purchased', 'payment_method', 'payment_method_display',
            'status', 'status_display', 'transaction_id', 'payment_details',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user_name', 'package_name', 'payment_method_display',
            'status_display', 'transaction_id', 'payment_details',
            'created_at', 'updated_at'
        ]


class PaymentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating payments"""
    payment_token = serializers.CharField(write_only=True, required=False)
    paypal_data = serializers.JSONField(write_only=True, required=False)
    gateway_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Payment
        fields = [
            'credit_package', 'payment_method', 'payment_token',
            'paypal_data', 'gateway_id'
        ]
    
    def create(self, validated_data):
        user = self.context['request'].user
        credit_package = validated_data.get('credit_package')
        payment_method = validated_data.get('payment_method')
        payment_token = validated_data.pop('payment_token', None)
        paypal_data = validated_data.pop('paypal_data', None)
        gateway_id = validated_data.pop('gateway_id', None)
        
        # Get gateway if provided
        from .models import PaymentProcessor, PaymentGateway
        gateway = None
        if gateway_id:
            try:
                gateway = PaymentGateway.objects.get(id=gateway_id, is_active=True)
            except PaymentGateway.DoesNotExist:
                raise serializers.ValidationError("Invalid payment gateway")
        
        # Create payment
        payment = Payment.objects.create(
            user=user,
            credit_package=credit_package,
            amount=credit_package.discounted_price,
            credits_purchased=credit_package.credit_amount,
            payment_method=payment_method.method_type if payment_method else 'credit_card',
            status='pending'
        )
        
        # Process payment based on method
        if payment_method and payment_method.method_type == 'paypal' and paypal_data:
            success, message = PaymentProcessor.process_paypal_payment(
                payment, paypal_data, gateway
            )
        elif payment_token:
            success, message = PaymentProcessor.process_stripe_payment(
                payment, payment_token, gateway
            )
        else:
            payment.mark_as_failed("No payment details provided")
            raise serializers.ValidationError("Payment details are required")
        
        if not success:
            raise serializers.ValidationError(message)
        
        return payment


class UserCreditSerializer(serializers.ModelSerializer):
    """Serializer for user credits"""
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserCredit
        fields = [
            'id', 'user', 'username', 'balance', 'lifetime_earned',
            'lifetime_spent', 'last_updated'
        ]
        read_only_fields = [
            'id', 'username', 'balance', 'lifetime_earned',
            'lifetime_spent', 'last_updated'
        ]


class CreditTransactionSerializer(serializers.ModelSerializer):
    """Serializer for credit transactions"""
    username = serializers.CharField(source='user.username', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = CreditTransaction
        fields = [
            'id', 'user', 'username', 'amount', 'type', 'type_display',
            'balance_after', 'description', 'reference_id', 'created_at'
        ]
        read_only_fields = [
            'id', 'username', 'type_display', 'created_at'
        ]


class PaymentIntentSerializer(serializers.Serializer):
    """Serializer for creating payment intents"""
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField(default='usd')
    gateway_id = serializers.IntegerField(required=False)
    
    def create(self, validated_data):
        from .models import PaymentProcessor, PaymentGateway
        
        amount = validated_data.get('amount')
        currency = validated_data.get('currency', 'usd')
        gateway_id = validated_data.get('gateway_id')
        
        # Get gateway if provided
        gateway = None
        if gateway_id:
            try:
                gateway = PaymentGateway.objects.get(id=gateway_id, is_active=True)
            except PaymentGateway.DoesNotExist:
                raise serializers.ValidationError("Invalid payment gateway")
        
        # Create payment intent
        success, result = PaymentProcessor.create_payment_intent(
            amount, currency, gateway
        )
        
        if not success:
            raise serializers.ValidationError(result)
        
        return {'client_secret': result}
