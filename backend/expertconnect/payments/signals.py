from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from expertconnect.credits.models import UserCredit

User = get_user_model()

@receiver(post_save, sender=User)
def create_user_credit(sender, instance, created, **kwargs):
    """
    Create a UserCredit instance for new users.
    """
    if created:
        UserCredit.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_credit(sender, instance, **kwargs):
    """
    Save the UserCredit instance when the user is updated.
    """
    if hasattr(instance, 'credits'):
        instance.credits.save()
    else:
        UserCredit.objects.create(user=instance)
