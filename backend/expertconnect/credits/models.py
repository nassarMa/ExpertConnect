"""
Credit models for the ExpertConnect platform.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from expertconnect.users.models import User

class Credit(models.Model):
    """
    Model to store user credit balances.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='credits')
    balance = models.IntegerField(default=1)  # New users get 1 free credit
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.balance} credits"

class CreditTransaction(models.Model):
    """
    Model to track all credit transactions.
    """
    TRANSACTION_TYPES = (
        ('earned', 'Earned'),
        ('spent', 'Spent'),
        ('purchased', 'Purchased'),
        ('refunded', 'Refunded'),
        ('bonus', 'Bonus'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.IntegerField()
    description = models.TextField(blank=True)
    related_meeting_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.transaction_type} {self.amount} credits"

class PaymentInformation(models.Model):
    """
    Model to store payment information for credit purchases.
    """
    PAYMENT_STATUS = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    payment_method = models.CharField(max_length=50)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS)
    credits_purchased = models.IntegerField()
    transaction_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.credits_purchased} credits for {self.amount} {self.currency}"
