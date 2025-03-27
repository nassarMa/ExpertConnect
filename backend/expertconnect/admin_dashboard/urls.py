from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AdminUserViewSet,
    AdminCreditTransactionViewSet,
    PaymentGatewayConfigViewSet,
    AdminSettingViewSet,
    AdminLogViewSet,
    DashboardStatsView
)

router = DefaultRouter()
router.register(r'users', AdminUserViewSet, basename='admin-users')
router.register(
    r'transactions', 
    AdminCreditTransactionViewSet, 
    basename='admin-transactions'
)
router.register(
    r'payment-gateways', 
    PaymentGatewayConfigViewSet, 
    basename='admin-payment-gateways'
)
router.register(
    r'settings', 
    AdminSettingViewSet, 
    basename='admin-settings'
)
router.register(r'logs', AdminLogViewSet, basename='admin-logs')

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', DashboardStatsView.as_view(), name='admin-stats'),
]
