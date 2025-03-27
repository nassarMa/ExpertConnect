from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta

from expertconnect.users.models import User, UserSkill, Category
from expertconnect.credits.models import Credit, CreditTransaction
from expertconnect.meetings.models import Meeting, Review
from .models import AdminSetting, PaymentGatewayConfig, AdminLog
from .serializers import (
    AdminUserSerializer,
    AdminUserSkillSerializer,
    AdminCategorySerializer,
    AdminCreditSerializer,
    AdminCreditTransactionSerializer,
    AdminMeetingSerializer,
    AdminReviewSerializer,
    AdminSettingSerializer,
    PaymentGatewayConfigSerializer,
    AdminLogSerializer,
    DashboardStatsSerializer
)
from .permissions import IsAdminUser


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing users with admin privileges.
    """
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'date_joined', 'is_active']
    ordering = ['-date_joined']

    def perform_create(self, serializer):
        user = serializer.save()
        AdminLog.objects.create(
            admin_user=self.request.user,
            action_type='create',
            entity_type='user',
            entity_id=user.id,
            description=f"Created user: {user.username}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

    def perform_update(self, serializer):
        user = serializer.save()
        AdminLog.objects.create(
            admin_user=self.request.user,
            action_type='update',
            entity_type='user',
            entity_id=user.id,
            description=f"Updated user: {user.username}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

    def perform_destroy(self, instance):
        username = instance.username
        user_id = instance.id
        instance.delete()
        AdminLog.objects.create(
            admin_user=self.request.user,
            action_type='delete',
            entity_type='user',
            entity_id=user_id,
            description=f"Deleted user: {username}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )


class AdminCreditTransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing credit transactions with admin privileges.
    """
    queryset = CreditTransaction.objects.all().order_by('-created_at')
    serializer_class = AdminCreditTransactionSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'transaction_type', 'description']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']

    @action(detail=False, methods=['post'])
    def refund(self, request):
        """
        Process a refund for a credit transaction.
        """
        transaction_id = request.data.get('transaction_id')
        reason = request.data.get('reason')
        
        if not transaction_id or not reason:
            return Response(
                {"detail": "Transaction ID and reason are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            transaction = CreditTransaction.objects.get(id=transaction_id)
            
            if transaction.transaction_type != 'purchased':
                return Response(
                    {"detail": "Only purchased credits can be refunded."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create a refund transaction
            refund = CreditTransaction.objects.create(
                user=transaction.user,
                amount=-transaction.amount,
                transaction_type='refunded',
                description=f"Refund for transaction #{transaction.id}. Reason: {reason}",
                reference_id=transaction.id
            )
            
            # Update user's credit balance
            credit = Credit.objects.get(user=transaction.user)
            credit.balance -= transaction.amount
            credit.save()
            
            # Log the admin action
            AdminLog.objects.create(
                admin_user=request.user,
                action_type='update',
                entity_type='credit',
                entity_id=refund.id,
                description=(
                    f"Processed refund for transaction #{transaction.id}. "
                    f"Amount: {transaction.amount}"
                ),
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            return Response({
                "detail": "Refund processed successfully.",
                "transaction": AdminCreditTransactionSerializer(refund).data
            })
            
        except CreditTransaction.DoesNotExist:
            return Response(
                {"detail": "Transaction not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Credit.DoesNotExist:
            return Response(
                {"detail": "User credit record not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PaymentGatewayConfigViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing payment gateway configurations.
    """
    queryset = PaymentGatewayConfig.objects.all()
    serializer_class = PaymentGatewayConfigSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        config = serializer.save()
        AdminLog.objects.create(
            admin_user=self.request.user,
            action_type='create',
            entity_type='payment',
            entity_id=config.id,
            description=(
                f"Created payment gateway config: "
                f"{config.get_gateway_type_display()}"
            ),
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

    def perform_update(self, serializer):
        config = serializer.save()
        AdminLog.objects.create(
            admin_user=self.request.user,
            action_type='update',
            entity_type='payment',
            entity_id=config.id,
            description=(
                f"Updated payment gateway config: "
                f"{config.get_gateway_type_display()}"
            ),
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        config = self.get_object()
        config.is_active = not config.is_active
        config.save()
        
        status_text = 'Activated' if config.is_active else 'Deactivated'
        gateway_name = config.get_gateway_type_display()
        
        AdminLog.objects.create(
            admin_user=request.user,
            action_type='update',
            entity_type='payment',
            entity_id=config.id,
            description=f"{status_text} payment gateway: {gateway_name}",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        active_status = 'active' if config.is_active else 'inactive'
        return Response({
            "detail": f"Payment gateway {gateway_name} is now {active_status}."
        })


class AdminSettingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing admin settings.
    """
    queryset = AdminSetting.objects.all()
    serializer_class = AdminSettingSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['key', 'description']

    def perform_create(self, serializer):
        setting = serializer.save()
        AdminLog.objects.create(
            admin_user=self.request.user,
            action_type='create',
            entity_type='setting',
            entity_id=setting.id,
            description=f"Created setting: {setting.key}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

    def perform_update(self, serializer):
        setting = serializer.save()
        AdminLog.objects.create(
            admin_user=self.request.user,
            action_type='update',
            entity_type='setting',
            entity_id=setting.id,
            description=f"Updated setting: {setting.key}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )


class AdminLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing admin logs.
    """
    queryset = AdminLog.objects.all().order_by('-created_at')
    serializer_class = AdminLogSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'admin_user__username', 'action_type', 'entity_type', 'description'
    ]
    ordering = ['-created_at']


class DashboardStatsView(APIView):
    """
    View for retrieving dashboard statistics.
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # User stats
        total_users = User.objects.count()
        active_users = User.objects.filter(last_login__gte=start_date).count()
        
        # Credit stats
        credit_purchases = CreditTransaction.objects.filter(
            transaction_type='purchased',
            created_at__gte=start_date
        )
        total_credits_purchased = (
            credit_purchases.aggregate(Sum('amount'))['amount__sum'] or 0
        )
        
        # Revenue calculation (simplified)
        # Assuming 1 credit = $0.10
        total_revenue = total_credits_purchased * 0.1
        
        # Meeting stats
        total_meetings = Meeting.objects.filter(
            created_at__gte=start_date
        ).count()
        completed_meetings = Meeting.objects.filter(
            status='completed',
            created_at__gte=start_date
        ).count()
        
        # Rating stats
        reviews = Review.objects.filter(created_at__gte=start_date)
        average_rating = 0
        if reviews.exists():
            total_rating = sum(review.rating for review in reviews)
            average_rating = total_rating / reviews.count()
        
        stats = {
            'total_users': total_users,
            'active_users': active_users,
            'total_revenue': total_revenue,
            'total_credits_purchased': total_credits_purchased,
            'total_meetings': total_meetings,
            'completed_meetings': completed_meetings,
            'average_rating': average_rating
        }
        
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)
