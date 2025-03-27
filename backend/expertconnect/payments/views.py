from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.conf import settings
import stripe
import json
import logging

from .models import (
    PaymentGateway, PaymentProcessor, SubscriptionPlan, 
    Subscription, SubscriptionEvent
)
from .serializers import (
    PaymentGatewaySerializer, PaymentGatewayAdminSerializer,
    SubscriptionPlanSerializer, SubscriptionSerializer,
    SubscriptionCreateSerializer, SubscriptionEventSerializer,
    PaymentMethodSerializer, PaymentMethodCreateSerializer,
    CreditPackageSerializer, PaymentSerializer,
    PaymentCreateSerializer, UserCreditSerializer,
    CreditTransactionSerializer, PaymentIntentSerializer
)
from expertconnect.credits.models import (
    Payment, PaymentMethod, CreditPackage, 
    UserCredit, CreditTransaction
)

User = get_user_model()
logger = logging.getLogger(__name__)

class PaymentGatewayViewSet(viewsets.ModelViewSet):
    """
    API endpoint for payment gateways.
    """
    queryset = PaymentGateway.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.user.is_staff or self.request.user.is_superuser:
            return PaymentGatewayAdminSerializer
        return PaymentGatewaySerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def default(self, request):
        """Get the default payment gateway"""
        gateway = PaymentGateway.objects.filter(is_active=True, is_default=True).first()
        if not gateway:
            return Response(
                {"detail": "No default payment gateway configured."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(gateway)
        return Response(serializer.data)


class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """
    API endpoint for subscription plans.
    """
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['price', 'credits_per_month', 'duration_months']
    ordering = ['price']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        # Only show active plans to non-admin users
        if not self.request.user.is_staff and not self.request.user.is_superuser:
            return SubscriptionPlan.objects.filter(is_active=True)
        return SubscriptionPlan.objects.all()
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured subscription plans"""
        plans = SubscriptionPlan.objects.filter(is_active=True, is_featured=True)
        serializer = self.get_serializer(plans, many=True)
        return Response(serializer.data)


class SubscriptionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for subscriptions.
    """
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SubscriptionCreateSerializer
        return SubscriptionSerializer
    
    def get_queryset(self):
        # For non-admin users, only show their own subscriptions
        if not self.request.user.is_staff and not self.request.user.is_superuser:
            return Subscription.objects.filter(user=self.request.user)
        return Subscription.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a subscription"""
        subscription = self.get_object()
        
        # Ensure user can only cancel their own subscriptions
        if subscription.user != request.user and not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to cancel this subscription."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        subscription.cancel()
        return Response({"detail": "Subscription canceled successfully."})
    
    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        """Manually renew a subscription"""
        subscription = self.get_object()
        
        # Ensure user can only renew their own subscriptions
        if subscription.user != request.user and not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to renew this subscription."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if subscription.renew():
            return Response({"detail": "Subscription renewed successfully."})
        
        return Response(
            {"detail": "Unable to renew subscription."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['get'])
    def events(self, request, pk=None):
        """Get events for a subscription"""
        subscription = self.get_object()
        
        # Ensure user can only view their own subscription events
        if subscription.user != request.user and not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to view these events."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        events = subscription.events.all()
        serializer = SubscriptionEventSerializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get user's active subscription"""
        subscription = Subscription.objects.filter(
            user=request.user,
            status='active',
            end_date__gt=timezone.now()
        ).first()
        
        if not subscription:
            return Response(
                {"detail": "No active subscription found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(subscription)
        return Response(serializer.data)


class PaymentMethodViewSet(viewsets.ModelViewSet):
    """
    API endpoint for payment methods.
    """
    queryset = PaymentMethod.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentMethodCreateSerializer
        return PaymentMethodSerializer
    
    def get_queryset(self):
        # For non-admin users, only show their own payment methods
        if not self.request.user.is_staff and not self.request.user.is_superuser:
            return PaymentMethod.objects.filter(user=self.request.user)
        return PaymentMethod.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set a payment method as default"""
        payment_method = self.get_object()
        
        # Ensure user can only modify their own payment methods
        if payment_method.user != request.user and not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to modify this payment method."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        payment_method.is_default = True
        payment_method.save()
        
        return Response({"detail": "Payment method set as default."})


class CreditPackageViewSet(viewsets.ModelViewSet):
    """
    API endpoint for credit packages.
    """
    queryset = CreditPackage.objects.all()
    serializer_class = CreditPackageSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['price', 'credit_amount', 'price_per_credit']
    ordering = ['price']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        # Only show active packages to non-admin users
        if not self.request.user.is_staff and not self.request.user.is_superuser:
            return CreditPackage.objects.filter(is_active=True)
        return CreditPackage.objects.all()
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured credit packages"""
        packages = CreditPackage.objects.filter(is_active=True, is_featured=True)
        serializer = self.get_serializer(packages, many=True)
        return Response(serializer.data)


class PaymentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for payments.
    """
    queryset = Payment.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'amount', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentCreateSerializer
        return PaymentSerializer
    
    def get_queryset(self):
        # For non-admin users, only show their own payments
        if not self.request.user.is_staff and not self.request.user.is_superuser:
            return Payment.objects.filter(user=self.request.user)
        return Payment.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        """Refund a payment"""
        payment = self.get_object()
        
        # Ensure only admins can refund payments
        if not request.user.is_staff and not request.user.is_superuser:
            return Response(
                {"detail": "You do not have permission to refund payments."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reason = request.data.get('reason', 'Admin initiated refund')
        
        if payment.refund(reason):
            return Response({"detail": "Payment refunded successfully."})
        
        return Response(
            {"detail": "Unable to refund payment."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['post'])
    def create_intent(self, request):
        """Create a payment intent for Stripe"""
        serializer = PaymentIntentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        
        return Response(result)
    
    @action(detail=False, methods=['post'])
    def webhook(self, request):
        """Handle webhook events from payment processors"""
        # Get the webhook signature
        signature = request.META.get('HTTP_STRIPE_SIGNATURE')
        
        if not signature:
            return Response(
                {"detail": "No signature provided."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the payload
        payload = request.body
        
        # Verify the webhook event
        success, event = PaymentProcessor.verify_webhook_event(payload, signature)
        
        if not success:
            return Response(
                {"detail": "Invalid webhook signature."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process the event
        event_type = event['type']
        
        if event_type == 'payment_intent.succeeded':
            # Handle successful payment
            payment_intent = event['data']['object']
            transaction_id = payment_intent['id']
            
            # Find the payment and mark as completed
            try:
                payment = Payment.objects.get(transaction_id=transaction_id)
                payment.mark_as_completed(transaction_id)
                logger.info(f"Payment {payment.id} marked as completed via webhook")
            except Payment.DoesNotExist:
                logger.warning(f"Payment with transaction ID {transaction_id} not found")
        
        elif event_type == 'payment_intent.payment_failed':
            # Handle failed payment
            payment_intent = event['data']['object']
            transaction_id = payment_intent['id']
            
            # Find the payment and mark as failed
            try:
                payment = Payment.objects.get(transaction_id=transaction_id)
                payment.mark_as_failed("Payment failed via webhook")
                logger.info(f"Payment {payment.id} marked as failed via webhook")
            except Payment.DoesNotExist:
                logger.warning(f"Payment with transaction ID {transaction_id} not found")
        
        return Response({"detail": "Webhook processed successfully."})


class UserCreditViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for user credits.
    """
    queryset = UserCredit.objects.all()
    serializer_class = UserCreditSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # For non-admin users, only show their own credits
        if not self.request.user.is_staff and not self.request.user.is_superuser:
            return UserCredit.objects.filter(user=self.request.user)
        return UserCredit.objects.all()
    
    @action(detail=False, methods=['get'])
    def my_balance(self, request):
        """Get current user's credit balance"""
        user_credit, created = UserCredit.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(user_credit)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def transactions(self, request):
        """Get current user's credit transactions"""
        transactions = CreditTransaction.objects.filter(user=request.user)
        
        # Apply filters
        transaction_type = request.query_params.get('type', None)
        if transaction_type:
            transactions = transactions.filter(type=transaction_type)
        
        # Apply date range
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        
        if start_date:
            transactions = transactions.filter(created_at__gte=start_date)
        
        if end_date:
            transactions = transactions.filter(created_at__lte=end_date)
        
        # Apply ordering
        ordering = request.query_params.get('ordering', '-created_at')
        transactions = transactions.order_by(ordering)
        
        # Paginate results
        page = self.paginate_queryset(transactions)
        if page is not None:
            serializer = CreditTransactionSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = CreditTransactionSerializer(transactions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get credit usage statistics for current user"""
        user = request.user
        
        # Get user credit
        user_credit, created = UserCredit.objects.get_or_create(user=user)
        
        # Get transaction statistics
        transactions = CreditTransaction.objects.filter(user=user)
        
        # Calculate statistics by transaction type
        stats_by_type = transactions.values('type').annotate(
            count=Count('id'),
            total=Sum('amount')
        )
        
        # Calculate monthly usage
        current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month = (current_month - timezone.timedelta(days=1)).replace(day=1)
        
        current_month_usage = transactions.filter(
            created_at__gte=current_month,
            type='booking'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        last_month_usage = transactions.filter(
            created_at__gte=last_month,
            created_at__lt=current_month,
            type='booking'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Calculate usage trend
        usage_trend = "stable"
        if current_month_usage > last_month_usage:
            usage_trend = "up"
        elif current_month_usage < last_month_usage:
            usage_trend = "down"
        
        return Response({
            'current_balance': user_credit.balance,
            'lifetime_earned': user_credit.lifetime_earned,
            'lifetime_spent': user_credit.lifetime_spent,
            'stats_by_type': stats_by_type,
            'current_month_usage': abs(current_month_usage),
            'last_month_usage': abs(last_month_usage),
            'usage_trend': usage_trend
        })
