"""
API URLs for the expertconnect project.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from expertconnect.users.views import UserViewSet, UserSkillViewSet, CategoryViewSet, UserAvailabilityViewSet
from expertconnect.credits.views import CreditViewSet, CreditTransactionViewSet, PaymentViewSet
from expertconnect.meetings.views import MeetingViewSet, ReviewViewSet
from expertconnect.messaging.views import MessageViewSet, NotificationViewSet

router = DefaultRouter()
# Register viewsets
router.register(r'users', UserViewSet)
router.register(r'user-skills', UserSkillViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'user-availability', UserAvailabilityViewSet)
router.register(r'credits', CreditViewSet)
router.register(r'credit-transactions', CreditTransactionViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'meetings', MeetingViewSet)
router.register(r'reviews', ReviewViewSet)
router.register(r'messages', MessageViewSet)
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
