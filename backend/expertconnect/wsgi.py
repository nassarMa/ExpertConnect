"""
WSGI config for expertconnect project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expertconnect.settings')

application = get_wsgi_application()
