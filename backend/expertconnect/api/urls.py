"""
API URLs for the expertconnect project.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from expertconnect.users.views import UserViewSet, UserSkillViewSet, CategoryViewSet, UserAvailabilityViewSet
from expertconnect.credits.views import CreditViewSet, CreditTransactionViewSet, PaymentInformationViewSet
from expertconnect.meetings.views import MeetingViewSet
from expertconnect.messaging.views import MessageViewSet, NotificationViewSet
from expertconnect.reviews.views import ReviewViewSet, ReviewVoteViewSet, ExpertProfileViewSet

router = DefaultRouter()
# Register viewsets
router.register(r'users', UserViewSet , basename = 'users')
router.register(r'user-skills', UserSkillViewSet , basename = 'user-skills')
router.register(r'categories', CategoryViewSet , basename = 'categories')
router.register(r'user-availability', UserAvailabilityViewSet , basename = 'user-availability')
router.register(r'credits', CreditViewSet, basename='credits')
router.register(r'credit-transactions', CreditTransactionViewSet , basename = 'credit-transaction')
router.register(r'payments', PaymentInformationViewSet, basename = 'payments' )
router.register(r'meetings', MeetingViewSet , basename = 'meetings' )
router.register(r'reviews', ReviewViewSet , basename = 'reviews')
router.register(r'review-votes', ReviewVoteViewSet , basename = 'review-votes')
router.register(r'expert-profiles', ExpertProfileViewSet , basename = 'expert-profiles')
router.register(r'messages', MessageViewSet , basename = 'messages')
router.register(r'notifications', NotificationViewSet , basename = 'notifications')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/', include('expertconnect.admin_dashboard.urls')),  # Admin dashboard URLs
    path('reviews/', include('expertconnect.reviews.urls')),  # Reviews app URLs
    path('discovery/', include('expertconnect.discovery.urls')),  # Discovery app URLs
    path('payments/', include('expertconnect.payments.urls')),  # Payments app URLs
]
