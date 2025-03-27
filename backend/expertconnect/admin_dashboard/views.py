"""
Views for the Admin Dashboard.
"""
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Avg, Sum, Q
from django.utils import timezone
from datetime import timedelta

from expertconnect.users.models import User, UserSkill
from expertconnect.credits.models import Credit, CreditTransaction, PaymentInformation
from expertconnect.meetings.models import Meeting, Review
from .models import AdminSetting, PaymentGatewayConfig, AdminLog
from .serializers import (
    AdminUserSerializer, AdminUserSkillSerializer, AdminCreditSerializer,
    AdminCreditTransactionSerializer, AdminPaymentInformationSerializer,
    AdminMeetingSerializer, AdminReviewSerializer, AdminSettingSerializer,
    PaymentGatewayConfigSerializer, AdminLogSerializer, DashboardStatsSerializer
)
from .permissions import IsAdminUser

class AdminUserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing users in the admin dashboard.
    """
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'date_joined', 'last_login']
    
    def perform_create(self, serializer):
        user = serializer.save()
        # Log the admin action
        AdminLog.objects.create(
            admin_user=self.request.user,
            action_type='create',
            entity_type='User',
            entity_id=user.id,
            description=f"Created user: {user.username}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
    
    def perform_update(self, serializer):
        user = serializer.save()
        # Log the admin action
        AdminLog.objects.create(
            admin_user=self.request.user,
            action_type='update',
            entity_type='User',
            entity_id=user.id,
            description=f"Updated user: {user.username}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
    
    def perform_destroy(self, instance):
        username = instance.username
        instance.delete()
        # Log the admin action
        AdminLog.objects.create(
            admin_user=self.request.user,
            action_type='delete',
            entity_type='User',
            description=f"Deleted user: {username}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
    
    @action(detail=True, methods=['get'])
    def skills(self, request, pk=None):
        """Get skills for a specific user"""
        user = self.get_object()
        skills = UserSkill.objects.filter(user=user)
        serializer = AdminUserSkillSerializer(skills, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def credits(self, request, pk=None):
        """Get credit information for a specific user"""
        user = self.get_object()
        try:
            credit = Credit.objects.get(user=user)
            serializer = AdminCreditSerializer(credit)
            return Response(serializer.data)
        except Credit.DoesNotExist:
            return Response({"detail": "Credit record not found for this user."}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        """Get credit transactions for a specific user"""
        user = self.get_object()
        transactions = CreditTransaction.objects.filter(user=user).order_by('-created_at')
        serializer = AdminCreditTransactionSerializer(transactions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def meetings(self, request, pk=None):
        """Get meetings for a specific user"""
        user = self.get_object()
        meetings = Meeting.objects.filter(Q(requester=user) | Q(expert=user)).order_by('-created_at')
        serializer = AdminMeetingSerializer(meetings, many=True)
        return Response(serializer.data)

class AdminCreditTransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing credit transactions in the admin dashboard.
    """
    queryset = CreditTransaction.objects.all().order_by('-created_at')
    serializer_class = AdminCreditTransactionSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'transaction_type', 'description']
    ordering_fields = ['created_at', 'amount', 'transaction_type']
    
    @action(detail=False, methods=['post'])
    def refund(self, request):
        """Process a refund for a credit transaction"""
        transaction_id = request.data.get('transaction_id')
        reason = request.data.get('reason', 'Admin refund')
        
        try:
            transaction = CreditTransaction.objects.get(id=transaction_id)
            
            # Only purchased transactions can be refunded
            if transaction.transaction_type != 'purchased':
                return Response(
                    {"detail": "Only purchased credits can be refunded."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create a refund transaction
            refund = CreditTransaction.objects.create(
                user=transaction.user,
                transaction_type='refunded',
                amount=-transaction.amount,  # Negative amount for refund
                description=f"Refund for transaction #{transaction.id}. Reason: {reason}"
            )
            
            # Update user's credit balance
            credit, created = Credit.objects.get_or_create(user=transaction.user)
            credit.balance -= transaction.amount
            credit.save()
            
            # Log the admin action
            AdminLog.objects.create(
                admin_user=request.user,
                action_type='refund',
                entity_type='CreditTransaction',
                entity_id=transaction.id,
                description=f"Refunded transaction #{transaction.id} for user {transaction.user.username}. Reason: {reason}",
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            return Response({
                "detail": "Refund processed successfully.",
                "refund_transaction": AdminCreditTransactionSerializer(refund).data
            })
            
        except CreditTransaction.DoesNotExist:
            return Response({"detail": "Transaction not found."}, status=status.HTTP_404_NOT_FOUND)

class PaymentGatewayConfigViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing payment gateway configurations in the admin dashboard.
    """
    queryset = PaymentGatewayConfig.objects.all()
    serializer_class = PaymentGatewayConfigSerializer
    permission_classes = [IsAdminUser]
    
    def perform_create(self, serializer):
        config = serializer.save()
        # Log the admin action
        AdminLog.objects.create(
            admin_user=self.request.user,
            action_type='create',
            entity_type='PaymentGatewayConfig',
            entity_id=config.id,
            description=f"Created payment gateway config: {config.get_gateway_type_display()}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
    
    def perform_update(self, serializer):
        config = serializer.save()
        # Log the admin action
        AdminLog.objects.create(
            admin_user=self.request.user,
            action_type='update',
            entity_type='PaymentGatewayConfig',
            entity_id=config.id,
            description=f"Updated payment gateway config: {config.get_gateway_type_display()}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle the active status of a payment gateway"""
        config = self.get_object()
        config.is_active = not config.is_active
        config.save()
        
        # Log the admin action
        AdminLog.objects.create(
            admin_user=request.user,
            action_type='update',
            entity_type='PaymentGatewayConfig',
            entity_id=config.id,
            description=f"{'Activated' if config.is_active else 'Deactivated'} payment gateway: {config.get_gateway_type_display()}",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response({
            "detail": f"Payment gateway {config.get_gateway_type_display()} is now {'active' if config.is_active else 'inactive'}."
        })

class AdminSettingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing admin settings in the admin dashboard.
    """
    queryset = AdminSetting.objects.all()
    serializer_class = AdminSettingSerializer
    permission_classes = [IsAdminUser]
    
    def perform_create(self, serializer):
        setting = serializer.save()
        # Log the admin action
        AdminLog.objects.create(
            admin_user=self.request.user,
            action_type='create',
            entity_type='AdminSetting',
            entity_id=setting.id,
            description=f"Created admin setting: {setting.key}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
    
    def perform_update(self, serializer):
        setting = serializer.save()
        # Log the admin action
        AdminLog.objects.create(
            admin_user=self.request.user,
            action_type='update',
            entity_type='AdminSetting',
            entity_id=setting.id,
            description=f"Updated admin setting: {setting.key}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

class AdminLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing admin logs in the admin dashboard.
    """
    queryset = AdminLog.objects.all().order_by('-created_at')
    serializer_class = AdminLogSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['admin_user__username', 'action_type', 'entity_type', 'description']
    ordering_fields = ['created_at', 'action_type', 'entity_type']

class DashboardStatsView(APIView):
    """
    View for retrieving dashboard statistics.
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request, format=None):
        # Get time period from query params (default to 30 days)
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # Calculate statistics
        total_users = User.objects.count()
        active_users = User.objects.filter(last_login__gte=start_date).count()
        
        # Credit and revenue stats
        credit_purchases = CreditTransaction.objects.filter(
            transaction_type='purchased',
            created_at__gte=start_date
        )
        total_credits_purchased = credit_purchases.aggregate(Sum('amount'))['amount__sum'] or 0
        
        payments = PaymentInformation.objects.filter(
            status='completed',
            created_at__gte=start_date
        )
        total_revenue = payments.aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Meeting stats
        total_meetings = Meeting.objects.filter(created_at__gte=start_date).count()
        completed_meetings = Meeting.objects.filter(
            status='completed',
            scheduled_end__gte=start_date
        ).count()
        
        # Rating stats
        reviews = Review.objects.filter(created_at__gte=start_date)
        average_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        
        # Prepare response data
        stats = {
            'total_users': total_users,
            'active_users': active_users,
            'total_credits_purchased': total_credits_purchased,
            'total_revenue': total_revenue,
            'total_meetings': total_meetings,
            'completed_meetings': completed_meetings,
            'average_rating': round(average_rating, 2)
        }
        
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)
