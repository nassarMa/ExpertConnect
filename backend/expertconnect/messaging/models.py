"""
Messaging models for the ExpertConnect platform.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from expertconnect.users.models import User
from expertconnect.meetings.models import Meeting

class Message(models.Model):
    """
    Model to store messages between users.
    """
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    message_content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    related_meeting = models.ForeignKey(Meeting, on_delete=models.SET_NULL, null=True, blank=True, related_name='messages')
    
    def __str__(self):
        return f"Message from {self.sender.username} to {self.receiver.username}"

class Notification(models.Model):
    """
    Model to store user notifications.
    """
    NOTIFICATION_TYPES = (
        ('meeting_request', 'Meeting Request'),
        ('meeting_confirmed', 'Meeting Confirmed'),
        ('meeting_cancelled', 'Meeting Cancelled'),
        ('meeting_reminder', 'Meeting Reminder'),
        ('new_message', 'New Message'),
        ('review_reminder', 'Review Reminder'),
        ('credit_update', 'Credit Update'),
        ('system', 'System Notification'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    related_id = models.IntegerField(null=True, blank=True)
    related_type = models.CharField(max_length=50, blank=True)
    
    def __str__(self):
        return f"{self.notification_type} for {self.user.username}"
