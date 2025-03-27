from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import ExpertSpecialization

User = get_user_model()

@receiver(post_save, sender=User)
def create_default_specialization(sender, instance, created, **kwargs):
    """
    Create a default specialization for new expert users based on their skills.
    """
    if created and instance.role == 'expert':
        # Wait for skills to be added first
        from django.db.models.signals import m2m_changed
        from expertconnect.users.models import UserSkill
        
        @receiver(post_save, sender=UserSkill)
        def create_specialization_from_skill(sender, instance, created, **kwargs):
            if created and instance.user == instance:
                # Get or create a category based on the skill
                from expertconnect.users.models import Category
                category, _ = Category.objects.get_or_create(
                    name=instance.skill_name,
                    defaults={'description': f'Category for {instance.skill_name}'}
                )
                
                # Create specialization
                ExpertSpecialization.objects.get_or_create(
                    expert=instance.user,
                    category=category,
                    defaults={
                        'description': f'Specializes in {instance.skill_name}',
                        'years_experience': instance.years_experience,
                        'is_primary': True
                    }
                )
