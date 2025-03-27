from django.db import models
from django.conf import settings
from django.utils import timezone

class AdminSetting(models.Model):
    """
    Model for storing admin settings and configurations.
    """
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True)
    is_sensitive = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.key


class PaymentGatewayConfig(models.Model):
    """
    Model for storing payment gateway configurations.
    """
    GATEWAY_TYPES = (
        ('paypal', 'PayPal'),
        ('stripe', 'Stripe'),
        ('credit_card', 'Credit Card'),
    )
    
    gateway_type = models.CharField(max_length=20, choices=GATEWAY_TYPES)
    api_key = models.CharField(max_length=255)
    api_secret = models.CharField(max_length=255)
    is_active = models.BooleanField(default=False)
    sandbox_mode = models.BooleanField(default=True)
    additional_config = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('gateway_type',)

    def __str__(self):
        return f"{self.get_gateway_type_display()} ({'Active' if self.is_active else 'Inactive'})"


class AdminLog(models.Model):
    """
    Model for tracking admin actions for audit purposes.
    """
    ACTION_TYPES = (
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('view', 'View'),
        ('other', 'Other'),
    )
    
    ENTITY_TYPES = (
        ('user', 'User'),
        ('credit', 'Credit'),
        ('payment', 'Payment'),
        ('meeting', 'Meeting'),
        ('setting', 'Setting'),
        ('other', 'Other'),
    )
    
    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='admin_logs'
    )
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    entity_type = models.CharField(max_length=20, choices=ENTITY_TYPES)
    entity_id = models.IntegerField(null=True, blank=True)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.admin_user} - {self.action_type} {self.entity_type} - {self.created_at}"
