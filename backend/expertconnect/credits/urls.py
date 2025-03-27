from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'packages', views.CreditPackageViewSet, basename='credit-package')
router.register(r'user-credits', views.UserCreditViewSet, basename='user-credit')
router.register(r'transactions', views.CreditTransactionViewSet, basename='credit-transaction')
router.register(r'payments', views.PaymentViewSet, basename='payment')
router.register(r'payment-methods', views.PaymentMethodViewSet, basename='payment-method')

urlpatterns = [
    path('', include(router.urls)),
    path('purchase/', views.PurchaseCreditsView.as_view(), name='purchase-credits'),
    path('stats/', views.CreditStatsView.as_view(), name='credit-stats'),
]
