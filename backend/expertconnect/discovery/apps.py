from django.apps import AppConfig


class DiscoveryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'expertconnect.discovery'
    verbose_name = 'Expert Discovery'

    def ready(self):
        # Import signals
        import expertconnect.discovery.signals
