"""
URLs for the Admin Dashboard.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.AdminUserViewSet)
router.register(r'transactions', views.AdminCreditTransactionViewSet)
router.register(r'payment-gateways', views.PaymentGatewayConfigViewSet)
router.register(r'settings', views.AdminSettingViewSet)
router.register(r'logs', views.AdminLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
]
