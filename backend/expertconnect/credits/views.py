from rest_framework import viewsets, permissions, status, generics, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Sum, Count, Q
from django.db import transaction
from django.contrib.auth import get_user_model
from .models import CreditPackage, UserCredit, CreditTransaction, Payment, PaymentMethod
from .serializers import (
    CreditPackageSerializer,
    UserCreditSerializer,
    CreditTransactionSerializer,
    PaymentSerializer,
    PaymentMethodSerializer,
    PurchaseCreditsSerializer
)
from expertconnect.users.permissions import IsOwnerOrAdmin
import stripe
from django.conf import settings
import paypalrestsdk
from datetime import datetime

# Configure payment gateways
stripe.api_key = settings.STRIPE_SECRET_KEY

paypalrestsdk.configure({
    "mode": settings.PAYPAL_MODE,  # "sandbox" or "live"
    "client_id": settings.PAYPAL_CLIENT_ID,
    "client_secret": settings.PAYPAL_CLIENT_SECRET
})

User = get_user_model()

class CreditPackageViewSet(viewsets.ModelViewSet):
    """
    API viewset for credit packages
    """
    serializer_class = CreditPackageSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        # By default, only show active packages
        queryset = CreditPackage.objects.filter(is_active=True)
        
        # Admin users can see all packages
        if self.request.user.is_authenticated and (self.request.user.is_staff or self.request.user.is_superuser):
            show_all = self.request.query_params.get('show_all', 'false').lower() == 'true'
            if show_all:
                queryset = CreditPackage.objects.all()
        
        # Filter by featured status
        featured = self.request.query_params.get('featured', None)
        if featured is not None:
            featured = featured.lower() == 'true'
            queryset = queryset.filter(is_featured=featured)
        
        # Order by credit amount
        return queryset.order_by('credit_amount')
    
    def get_permissions(self):
        """
        Custom permissions:
        - Anyone can view credit packages
        - Only admin users can create/update/delete packages
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return super().get_permissions()

class UserCreditViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API viewset for user credit balances
    """
    serializer_class = UserCreditSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Regular users can only see their own credit balance
        if self.request.user.is_staff or self.request.user.is_superuser:
            return UserCredit.objects.all()
        return UserCredit.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_balance(self, request):
        """Get current user's credit balance"""
        user_credit, created = UserCredit.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(user_credit)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_credits(self, request, pk=None):
        """Admin-only endpoint to manually add credits to a user"""
        if not request.user.is_staff and not request.user.is_superuser:
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_credit = self.get_object()
        amount = request.data.get('amount', None)
        description = request.data.get('description', 'Manual credit addition by admin')
        
        try:
            amount = int(amount)
            if amount <= 0:
                return Response(
                    {"detail": "Amount must be a positive integer."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (TypeError, ValueError):
            return Response(
                {"detail": "Amount must be a valid integer."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_credit.add_credits(amount)
        
        # Create an adjustment transaction
        CreditTransaction.objects.create(
            user=user_credit.user,
            amount=amount,
            type='adjustment',
            balance_after=user_credit.balance,
            description=description
        )
        
        serializer = self.get_serializer(user_credit)
        return Response(serializer.data)

class CreditTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API viewset for credit transactions
    """
    serializer_class = CreditTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Regular users can only see their own transactions
        if self.request.user.is_staff or self.request.user.is_superuser:
            return CreditTransaction.objects.all()
        return CreditTransaction.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_transactions(self, request):
        """Get current user's transactions"""
        transactions = CreditTransaction.objects.filter(user=request.user)
        
        # Filter by transaction type
        transaction_type = request.query_params.get('type', None)
        if transaction_type:
            transactions = transactions.filter(type=transaction_type)
        
        # Filter by date range
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        
        if start_date:
            transactions = transactions.filter(created_at__gte=start_date)
        if end_date:
            transactions = transactions.filter(created_at__lte=end_date)
        
        page = self.paginate_queryset(transactions)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(transactions, many=True)
        return Response(serializer.data)

class PaymentViewSet(viewsets.ModelViewSet):
    """
    API viewset for payments
    """
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Regular users can only see their own payments
        if self.request.user.is_staff or self.request.user.is_superuser:
            return Payment.objects.all()
        return Payment.objects.filter(user=self.request.user)
    
    def get_permissions(self):
        """
        Custom permissions:
        - Users can view and create their own payments
        - Only admin users can update/delete payments
        """
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return super().get_permissions()
    
    @action(detail=False, methods=['get'])
    def my_payments(self, request):
        """Get current user's payments"""
        payments = Payment.objects.filter(user=request.user)
        
        # Filter by payment status
        status_param = request.query_params.get('status', None)
        if status_param:
            payments = payments.filter(status=status_param)
        
        # Filter by date range
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        
        if start_date:
            payments = payments.filter(created_at__gte=start_date)
        if end_date:
            payments = payments.filter(created_at__lte=end_date)
        
        page = self.paginate_queryset(payments)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def process_stripe(self, request, pk=None):
        """Process a payment with Stripe"""
        payment = self.get_object()
        
        # Only the payment owner can process it
        if request.user != payment.user:
            return Response(
                {"detail": "You can only process your own payments."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only pending payments can be processed
        if payment.status != 'pending':
            return Response(
                {"detail": f"Cannot process payment with status '{payment.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get payment token from request
        payment_token = request.data.get('payment_token', None)
        if not payment_token:
            return Response(
                {"detail": "Payment token is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create Stripe charge
            charge = stripe.Charge.create(
                amount=int(payment.amount * 100),  # Convert to cents
                currency="usd",
                source=payment_token,
                description=f"Credit purchase: {payment.credits_purchased} credits",
                metadata={
                    "payment_id": payment.id,
                    "user_id": payment.user.id,
                    "username": payment.user.username
                }
            )
            
            # Mark payment as completed
            payment.mark_as_completed(charge.id)
            
            serializer = self.get_serializer(payment)
            return Response(serializer.data)
        
        except stripe.error.CardError as e:
            # Card was declined
            payment.mark_as_failed(str(e))
            return Response(
                {"detail": f"Card error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        except Exception as e:
            # Other error
            payment.mark_as_failed(str(e))
            return Response(
                {"detail": f"Payment processing error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def process_paypal(self, request, pk=None):
        """Process a payment with PayPal"""
        payment = self.get_object()
        
        # Only the payment owner can process it
        if request.user != payment.user:
            return Response(
                {"detail": "You can only process your own payments."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only pending payments can be processed
        if payment.status != 'pending':
            return Response(
                {"detail": f"Cannot process payment with status '{payment.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get PayPal payment ID and payer ID from request
        paypal_payment_id = request.data.get('paypal_payment_id', None)
        payer_id = request.data.get('payer_id', None)
        
        if not paypal_payment_id or not payer_id:
            return Response(
                {"detail": "PayPal payment ID and payer ID are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Execute PayPal payment
            paypal_payment = paypalrestsdk.Payment.find(paypal_payment_id)
            if paypal_payment.execute({"payer_id": payer_id}):
                # Mark payment as completed
                payment.mark_as_completed(paypal_payment_id)
                
                serializer = self.get_serializer(payment)
                return Response(serializer.data)
            else:
                # Payment execution failed
                payment.mark_as_failed(paypal_payment.error)
                return Response(
                    {"detail": f"PayPal error: {paypal_payment.error}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        except Exception as e:
            # Other error
            payment.mark_as_failed(str(e))
            return Response(
                {"detail": f"Payment processing error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        """Refund a payment"""
        payment = self.get_object()
        
        # Only admin users can refund payments
        if not request.user.is_staff and not request.user.is_superuser:
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only completed payments can be refunded
        if payment.status != 'completed':
            return Response(
                {"detail": f"Cannot refund payment with status '{payment.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reason = request.data.get('reason', 'Refunded by admin')
        
        # Process refund
        if payment.refund(reason):
            serializer = self.get_serializer(payment)
            return Response(serializer.data)
        else:
            return Response(
                {"detail": "Failed to process refund."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PaymentMethodViewSet(viewsets.ModelViewSet):
    """
    API viewset for payment methods
    """
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    
    def get_queryset(self):
        # Regular users can only see their own payment methods
        if self.request.user.is_staff or self.request.user.is_superuser:
            user_id = self.request.query_params.get('user', None)
            if user_id:
                return PaymentMethod.objects.filter(user_id=user_id)
            return PaymentMethod.objects.all()
        return PaymentMethod.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_payment_methods(self, request):
        """Get current user's payment methods"""
        payment_methods = PaymentMethod.objects.filter(user=request.user)
        serializer = self.get_serializer(payment_methods, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set a payment method as default"""
        payment_method = self.get_object()
        
        # Only the payment method owner can set it as default
        if request.user != payment_method.user:
            return Response(
                {"detail": "You can only modify your own payment methods."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Set as default
        payment_method.is_default = True
        payment_method.save()
        
        serializer = self.get_serializer(payment_method)
        return Response(serializer.data)

class PurchaseCreditsView(generics.CreateAPIView):
    """
    API view for purchasing credits
    """
    serializer_class = PurchaseCreditsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()
        
        # Return payment details
        payment_serializer = PaymentSerializer(payment)
        return Response(payment_serializer.data, status=status.HTTP_201_CREATED)

class CreditStatsView(generics.RetrieveAPIView):
    """
    API view for credit system statistics (admin only)
    """
    permission_classes = [permissions.IsAdminUser]
    
    def retrieve(self, request, *args, **kwargs):
        # Get total credits in circulation
        total_credits = UserCredit.objects.aggregate(Sum('balance'))['balance__sum'] or 0
        
        # Get total credits earned and spent
        total_earned = UserCredit.objects.aggregate(Sum('lifetime_earned'))['lifetime_earned__sum'] or 0
        total_spent = UserCredit.objects.aggregate(Sum('lifetime_spent'))['lifetime_spent__sum'] or 0
        
        # Get transaction counts by type
        transaction_counts = CreditTransaction.objects.values('type').annotate(count=Count('id'))
        transaction_stats = {item['type']: item['count'] for item in transaction_counts}
        
        # Get payment stats
        payment_counts = Payment.objects.values('status').annotate(count=Count('id'))
        payment_stats = {item['status']: item['count'] for item in payment_counts}
        
        total_revenue = Payment.objects.filter(status='completed').aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Get recent activity
        recent_transactions = CreditTransaction.objects.order_by('-created_at')[:10]
        recent_payments = Payment.objects.order_by('-created_at')[:10]
        
        return Response({
            'total_credits_in_circulation': total_credits,
            'total_credits_earned': total_earned,
            'total_credits_spent': total_spent,
            'transaction_stats': transaction_stats,
            'payment_stats': payment_stats,
            'total_revenue': total_revenue,
            'recent_transactions': CreditTransactionSerializer(recent_transactions, many=True).data,
            'recent_payments': PaymentSerializer(recent_payments, many=True).data,
        })
