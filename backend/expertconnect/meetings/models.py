"""
Meeting models for the ExpertConnect platform.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from expertconnect.users.models import User, Category

class Meeting(models.Model):
    """
    Model to store meeting information.
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    )
    
    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requested_meetings')
    expert = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expert_meetings')
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='meetings')
    scheduled_start = models.DateTimeField()
    scheduled_end = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    meeting_link = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        constraints = [
            models.CheckConstraint(
                check=~models.Q(requester=models.F('expert')),
                name='requester_not_expert'
            )
        ]
    
    def __str__(self):
        return f"{self.title} - {self.requester.username} with {self.expert.username}"
    
    @property
    def duration_minutes(self):
        """Calculate meeting duration in minutes"""
        delta = self.scheduled_end - self.scheduled_start
        return delta.total_seconds() / 60

class Review(models.Model):
    """
    Model to store meeting reviews.
    """
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_reviews')
    reviewee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_reviews')
    rating = models.IntegerField()
    feedback = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('meeting', 'reviewer')
    
    def __str__(self):
        return f"Review by {self.reviewer.username} for {self.reviewee.username} - {self.rating}/5"
