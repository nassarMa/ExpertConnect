from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PaymentGatewayViewSet, SubscriptionPlanViewSet, SubscriptionViewSet,
    PaymentMethodViewSet, CreditPackageViewSet, PaymentViewSet, UserCreditViewSet
)

router = DefaultRouter()
router.register(r'gateways', PaymentGatewayViewSet)
router.register(r'subscription-plans', SubscriptionPlanViewSet)
router.register(r'subscriptions', SubscriptionViewSet)
router.register(r'payment-methods', PaymentMethodViewSet)
router.register(r'credit-packages', CreditPackageViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'user-credits', UserCreditViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
