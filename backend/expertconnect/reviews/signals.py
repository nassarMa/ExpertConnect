from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import ExpertProfile

User = get_user_model()

@receiver(post_save, sender=User)
def create_expert_profile(sender, instance, created, **kwargs):
    """
    Create an ExpertProfile for users when they are created.
    This ensures every user has an expert profile for rating purposes.
    """
    if created and instance.role == 'expert':
        ExpertProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_expert_profile(sender, instance, **kwargs):
    """
    Update the expert profile when the user is updated.
    """
    if instance.role == 'expert':
        try:
            if hasattr(instance, 'expertprofile'):
                instance.expertprofile.save()
            else:
                ExpertProfile.objects.create(user=instance)
        except ExpertProfile.DoesNotExist:
            ExpertProfile.objects.create(user=instance)
