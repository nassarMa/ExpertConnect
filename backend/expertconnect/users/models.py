"""
User models for the ExpertConnect platform.
"""
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    """
    Custom User model for ExpertConnect platform.
    Extends Django's AbstractUser to add profile-related fields.
    """
    # User role choices
    ROLE_CONSUMER = 'consumer'
    ROLE_PROVIDER = 'provider'
    ROLE_BOTH = 'both'
    
    ROLE_CHOICES = (
        (ROLE_CONSUMER, _('Consumer')),
        (ROLE_PROVIDER, _('Provider')),
        (ROLE_BOTH, _('Both')),
    )
    
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    bio = models.TextField(blank=True)
    headline = models.CharField(max_length=100, blank=True)
    is_verified = models.BooleanField(default=False)
    
    # New fields for role-based access
    role = models.CharField(
        max_length=10, 
        choices=ROLE_CHOICES, 
        default=ROLE_CONSUMER,
        help_text=_('User role determines access and capabilities')
    )
    
    # Provider-specific fields
    hourly_rate = models.PositiveIntegerField(
        default=0, 
        help_text=_('Hourly rate in credits (only for providers)')
    )
    is_available_for_hire = models.BooleanField(
        default=False,
        help_text=_('Whether the provider is currently accepting new clients')
    )
    
    # Verification fields
    email_verified = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=20, blank=True)
    phone_verified = models.BooleanField(default=False)
    
    def __str__(self):
        return self.username
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def credit_balance(self):
        """Get the user's current credit balance"""
        try:
            return self.credits.balance
        except:
            return 0
    
    @property
    def is_consumer(self):
        """Check if user has consumer role"""
        return self.role in [self.ROLE_CONSUMER, self.ROLE_BOTH]
    
    @property
    def is_provider(self):
        """Check if user has provider role"""
        return self.role in [self.ROLE_PROVIDER, self.ROLE_BOTH]


class UserSkill(models.Model):
    """
    Model to store user skills and expertise levels.
    """
    SKILL_LEVELS = (
        ('Beginner', 'Beginner'),
        ('Intermediate', 'Intermediate'),
        ('Advanced', 'Advanced'),
        ('Expert', 'Expert'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skills')
    skill_name = models.CharField(max_length=100)
    skill_level = models.CharField(max_length=20, choices=SKILL_LEVELS)
    years_experience = models.PositiveIntegerField(default=0)
    
    class Meta:
        unique_together = ('user', 'skill_name')
        
    def __str__(self):
        return f"{self.user.username} - {self.skill_name} ({self.skill_level})"


class Category(models.Model):
    """
    Model to store expertise categories.
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True)
    
    class Meta:
        verbose_name_plural = "Categories"
        
    def __str__(self):
        return self.name


class UserAvailability(models.Model):
    """
    Model to store user availability for scheduling meetings.
    """
    DAYS_OF_WEEK = (
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='availability')
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('user', 'day_of_week', 'start_time', 'end_time')
        verbose_name_plural = "User Availabilities"
        
    def __str__(self):
        return f"{self.user.username} - {self.get_day_of_week_display()} ({self.start_time} - {self.end_time})"
