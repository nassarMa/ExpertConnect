"""
Models for the Admin Dashboard.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _

class AdminSetting(models.Model):
    """
    Model to store admin settings and configurations.
    """
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True)
    is_sensitive = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.key}: {self.value if not self.is_sensitive else '******'}"

class PaymentGatewayConfig(models.Model):
    """
    Model to store payment gateway configurations.
    """
    GATEWAY_TYPES = (
        ('paypal', 'PayPal'),
        ('stripe', 'Stripe'),
        ('credit_card', 'Credit Card'),
    )
    
    gateway_type = models.CharField(max_length=20, choices=GATEWAY_TYPES)
    is_active = models.BooleanField(default=False)
    api_key = models.CharField(max_length=255)
    api_secret = models.CharField(max_length=255)
    sandbox_mode = models.BooleanField(default=True)
    additional_config = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('gateway_type',)
    
    def __str__(self):
        return f"{self.get_gateway_type_display()} - {'Active' if self.is_active else 'Inactive'}"

class AdminLog(models.Model):
    """
    Model to track admin actions for auditing purposes.
    """
    ACTION_TYPES = (
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('view', 'View'),
        ('refund', 'Refund'),
        ('config', 'Configuration'),
        ('other', 'Other'),
    )
    
    admin_user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='admin_logs')
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    entity_type = models.CharField(max_length=50)
    entity_id = models.IntegerField(null=True, blank=True)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.admin_user.username} - {self.action_type} - {self.entity_type} - {self.created_at}"
