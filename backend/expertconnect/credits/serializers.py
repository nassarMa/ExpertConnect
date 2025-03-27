from rest_framework import serializers
from .models import CreditPackage, UserCredit, CreditTransaction, Payment, PaymentMethod
from django.contrib.auth import get_user_model

User = get_user_model()

class CreditPackageSerializer(serializers.ModelSerializer):
    """Serializer for credit packages"""
    discounted_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    price_per_credit = serializers.DecimalField(max_digits=10, decimal_places=4, read_only=True)
    
    class Meta:
        model = CreditPackage
        fields = (
            'id', 'name', 'description', 'credit_amount', 'price',
            'is_active', 'is_featured', 'discount_percentage',
            'discounted_price', 'price_per_credit', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

class UserCreditSerializer(serializers.ModelSerializer):
    """Serializer for user credit balances"""
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserCredit
        fields = (
            'id', 'user', 'username', 'balance', 'lifetime_earned',
            'lifetime_spent', 'last_updated'
        )
        read_only_fields = fields

class CreditTransactionSerializer(serializers.ModelSerializer):
    """Serializer for credit transactions"""
    username = serializers.CharField(source='user.username', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = CreditTransaction
        fields = (
            'id', 'user', 'username', 'amount', 'type', 'type_display',
            'balance_after', 'description', 'reference_id', 'created_at'
        )
        read_only_fields = fields

class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for payments"""
    username = serializers.CharField(source='user.username', read_only=True)
    package_name = serializers.CharField(source='credit_package.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = (
            'id', 'user', 'username', 'credit_package', 'package_name',
            'amount', 'credits_purchased', 'payment_method', 'payment_method_display',
            'status', 'status_display', 'transaction_id', 'payment_details',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'status', 'transaction_id')
    
    def create(self, validated_data):
        # Set user to current user if not provided
        if 'user' not in validated_data:
            request = self.context.get('request')
            validated_data['user'] = request.user
        
        # Set credits_purchased from credit_package if not provided
        if 'credits_purchased' not in validated_data and 'credit_package' in validated_data:
            credit_package = validated_data['credit_package']
            validated_data['credits_purchased'] = credit_package.credit_amount
            
            # Set amount from credit_package if not provided
            if 'amount' not in validated_data:
                validated_data['amount'] = credit_package.discounted_price
        
        return super().create(validated_data)

class PaymentMethodSerializer(serializers.ModelSerializer):
    """Serializer for payment methods"""
    method_type_display = serializers.CharField(source='get_method_type_display', read_only=True)
    card_type_display = serializers.CharField(source='get_card_type_display', read_only=True)
    
    class Meta:
        model = PaymentMethod
        fields = (
            'id', 'user', 'method_type', 'method_type_display', 'is_default',
            'card_type', 'card_type_display', 'last_four', 'expiry_month', 'expiry_year',
            'paypal_email', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
        extra_kwargs = {
            'payment_token': {'write_only': True}
        }
    
    def validate(self, attrs):
        method_type = attrs.get('method_type')
        
        # Validate credit card fields
        if method_type == 'credit_card':
            if not attrs.get('card_type'):
                raise serializers.ValidationError({"card_type": "Card type is required for credit cards."})
            if not attrs.get('last_four'):
                raise serializers.ValidationError({"last_four": "Last four digits are required for credit cards."})
            if not attrs.get('expiry_month'):
                raise serializers.ValidationError({"expiry_month": "Expiry month is required for credit cards."})
            if not attrs.get('expiry_year'):
                raise serializers.ValidationError({"expiry_year": "Expiry year is required for credit cards."})
        
        # Validate PayPal fields
        elif method_type == 'paypal':
            if not attrs.get('paypal_email'):
                raise serializers.ValidationError({"paypal_email": "PayPal email is required for PayPal payments."})
        
        return attrs
    
    def create(self, validated_data):
        # Set user to current user if not provided
        if 'user' not in validated_data:
            request = self.context.get('request')
            validated_data['user'] = request.user
        
        return super().create(validated_data)

class PurchaseCreditsSerializer(serializers.Serializer):
    """Serializer for purchasing credits"""
    credit_package = serializers.PrimaryKeyRelatedField(queryset=CreditPackage.objects.filter(is_active=True))
    payment_method = serializers.PrimaryKeyRelatedField(queryset=PaymentMethod.objects.all())
    
    def validate_payment_method(self, value):
        request = self.context.get('request')
        if value.user != request.user:
            raise serializers.ValidationError("You can only use your own payment methods.")
        return value
    
    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user
        credit_package = validated_data['credit_package']
        payment_method = validated_data['payment_method']
        
        # Create payment record
        payment = Payment.objects.create(
            user=user,
            credit_package=credit_package,
            amount=credit_package.discounted_price,
            credits_purchased=credit_package.credit_amount,
            payment_method=payment_method.method_type,
            payment_details={
                'payment_method_id': payment_method.id
            }
        )
        
        return payment
