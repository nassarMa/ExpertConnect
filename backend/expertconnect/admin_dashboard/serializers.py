from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Avg

from expertconnect.users.models import User, UserSkill, Category
from expertconnect.credits.models import Credit, CreditTransaction
from expertconnect.meetings.models import Meeting, Review
from .models import AdminSetting, PaymentGatewayConfig, AdminLog

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model with admin privileges.
    """
    credit_balance = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'is_active', 'is_verified', 'is_staff', 'is_superuser', 'date_joined',
            'credit_balance', 'bio', 'profile_picture'
        ]
    
    def get_credit_balance(self, obj):
        try:
            credit = Credit.objects.get(user=obj)
            return credit.balance
        except Credit.DoesNotExist:
            return 0


class AdminUserSkillSerializer(serializers.ModelSerializer):
    """
    Serializer for UserSkill model with admin privileges.
    """
    category_name = serializers.ReadOnlyField(source='category.name')
    
    class Meta:
        model = UserSkill
        fields = '__all__'


class AdminCategorySerializer(serializers.ModelSerializer):
    """
    Serializer for Category model with admin privileges.
    """
    class Meta:
        model = Category
        fields = '__all__'


class AdminCreditSerializer(serializers.ModelSerializer):
    """
    Serializer for Credit model with admin privileges.
    """
    username = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = Credit
        fields = '__all__'


class AdminCreditTransactionSerializer(serializers.ModelSerializer):
    """
    Serializer for CreditTransaction model with admin privileges.
    """
    username = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = CreditTransaction
        fields = '__all__'


class AdminMeetingSerializer(serializers.ModelSerializer):
    """
    Serializer for Meeting model with admin privileges.
    """
    client_name = serializers.ReadOnlyField(source='client.username')
    expert_name = serializers.ReadOnlyField(source='expert.username')
    
    class Meta:
        model = Meeting
        fields = '__all__'


class AdminReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for Review model with admin privileges.
    """
    reviewer_name = serializers.ReadOnlyField(source='reviewer.username')
    reviewee_name = serializers.ReadOnlyField(source='reviewee.username')
    
    class Meta:
        model = Review
        fields = '__all__'


class AdminSettingSerializer(serializers.ModelSerializer):
    """
    Serializer for AdminSetting model.
    """
    class Meta:
        model = AdminSetting
        fields = '__all__'
        extra_kwargs = {
            'value': {'write_only': False}
        }
    
    def get_extra_kwargs(self):
        extra_kwargs = super().get_extra_kwargs()
        # Only apply this logic for a single instance, not a list
        if hasattr(self, 'instance') and self.instance and not isinstance(self.instance, list):
            if self.instance.is_sensitive:
                extra_kwargs.setdefault('value', {})['write_only'] = True
        return extra_kwargs


class PaymentGatewayConfigSerializer(serializers.ModelSerializer):
    """
    Serializer for PaymentGatewayConfig model.
    """
    class Meta:
        model = PaymentGatewayConfig
        fields = '__all__'
        extra_kwargs = {
            'api_secret': {'write_only': True}
        }


class AdminLogSerializer(serializers.ModelSerializer):
    """
    Serializer for AdminLog model.
    """
    admin_username = serializers.ReadOnlyField(source='admin_user.username')
    
    class Meta:
        model = AdminLog
        fields = '__all__'


class DashboardStatsSerializer(serializers.Serializer):
    """
    Serializer for dashboard statistics.
    """
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_credits_purchased = serializers.IntegerField()
    total_meetings = serializers.IntegerField()
    completed_meetings = serializers.IntegerField()
    average_rating = serializers.FloatField()
