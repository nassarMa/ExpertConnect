"""
Admin Dashboard app configuration.
"""
from django.apps import AppConfig

class AdminDashboardConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'expertconnect.admin_dashboard'
    verbose_name = 'Admin Dashboard'
    
    def ready(self):
        """
        Import signals when the app is ready.
        """
        pass  # Import any signals here if needed
