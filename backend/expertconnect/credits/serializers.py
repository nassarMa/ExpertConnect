from rest_framework import serializers
from .models import Credit, CreditTransaction, PaymentInformation

class CreditSerializer(serializers.ModelSerializer):
    class Meta:
        model = Credit
        fields = ['id', 'user', 'balance', 'updated_at']
        read_only_fields = ['id', 'user', 'updated_at']

class CreditTransactionSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    
    class Meta:
        model = CreditTransaction
        fields = ['id', 'user', 'username', 'transaction_type', 'amount', 'description', 
                  'related_meeting_id', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_username(self, obj):
        return obj.user.username

class PaymentInformationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentInformation
        fields = ['id', 'user', 'payment_method', 'amount', 'currency', 'status', 
                  'credits_purchased', 'transaction_id', 'created_at']
        read_only_fields = ['id', 'created_at']
        
    def create(self, validated_data):
        # Create payment information
        payment = PaymentInformation.objects.create(**validated_data)
        
        # If payment is completed, add credits to user's balance
        if payment.status == 'completed':
            user = payment.user
            credit, created = Credit.objects.get_or_create(user=user)
            credit.balance += payment.credits_purchased
            credit.save()
            
            # Create transaction record
            CreditTransaction.objects.create(
                user=user,
                transaction_type='purchased',
                amount=payment.credits_purchased,
                description=f'Purchased {payment.credits_purchased} credits for {payment.amount} {payment.currency}'
            )
            
        return payment
