from django.apps import AppConfig


class CreditsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'expertconnect.credits'

    def ready(self):
        import expertconnect.credits.signals  # noqa
