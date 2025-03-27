from django.apps import AppConfig


class PaymentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'expertconnect.payments'
    verbose_name = 'Payment Processing'

    def ready(self):
        # Import signals
        import expertconnect.payments.signals
