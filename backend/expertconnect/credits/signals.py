from django.db.models.signals import post_save
from django.dispatch import receiver
from expertconnect.users.models import User
from .models import Credit, CreditTransaction

@receiver(post_save, sender=User)
def create_user_credit(sender, instance, created, **kwargs):
    """
    Signal to create initial credit for new users.
    """
    if created:
        # Create credit balance with 1 free credit
        credit, created = Credit.objects.get_or_create(user=instance)
        
        # Record the initial credit transaction
        if created:
            CreditTransaction.objects.create(
                user=instance,
                transaction_type='bonus',
                amount=1,
                description='Initial free credit for new user'
            )
