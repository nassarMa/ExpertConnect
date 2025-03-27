from django.apps import AppConfig


class ReviewsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'expertconnect.reviews'
    
    def ready(self):
        # Import signals when the app is ready
        import expertconnect.reviews.signals
