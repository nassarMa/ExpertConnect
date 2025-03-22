"""
ASGI config for expertconnect project.
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import expertconnect.messaging.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expertconnect.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            expertconnect.messaging.routing.websocket_urlpatterns
        )
    ),
})
