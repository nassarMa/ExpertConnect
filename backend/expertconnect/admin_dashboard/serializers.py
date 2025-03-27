"""
Serializers for the Admin Dashboard.
"""
from rest_framework import serializers
from expertconnect.users.models import User, UserSkill
from expertconnect.credits.models import Credit, CreditTransaction, PaymentInformation
from expertconnect.meetings.models import Meeting, Review
from .models import AdminSetting, PaymentGatewayConfig, AdminLog

class AdminUserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model with admin-specific fields.
    """
    credit_balance = serializers.IntegerField(read_only=True)
    total_meetings = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'profile_picture', 'bio', 'headline', 'is_verified', 
            'is_admin', 'date_joined', 'last_login', 'credit_balance',
            'total_meetings'
        ]
    
    def get_total_meetings(self, obj):
        """Get total meetings count for the user"""
        requested = obj.requested_meetings.count()
        expert = obj.expert_meetings.count()
        return requested + expert

class AdminUserSkillSerializer(serializers.ModelSerializer):
    """
    Serializer for UserSkill model.
    """
    class Meta:
        model = UserSkill
        fields = '__all__'

class AdminCreditSerializer(serializers.ModelSerializer):
    """
    Serializer for Credit model.
    """
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Credit
        fields = ['id', 'user', 'username', 'balance', 'updated_at']

class AdminCreditTransactionSerializer(serializers.ModelSerializer):
    """
    Serializer for CreditTransaction model.
    """
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = CreditTransaction
        fields = '__all__'

class AdminPaymentInformationSerializer(serializers.ModelSerializer):
    """
    Serializer for PaymentInformation model.
    """
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = PaymentInformation
        fields = '__all__'

class AdminMeetingSerializer(serializers.ModelSerializer):
    """
    Serializer for Meeting model.
    """
    requester_name = serializers.CharField(source='requester.username', read_only=True)
    expert_name = serializers.CharField(source='expert.username', read_only=True)
    
    class Meta:
        model = Meeting
        fields = '__all__'

class AdminReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for Review model.
    """
    reviewer_name = serializers.CharField(source='reviewer.username', read_only=True)
    reviewee_name = serializers.CharField(source='reviewee.username', read_only=True)
    
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
        
    def get_extra_kwargs(self):
        extra_kwargs = super().get_extra_kwargs()
        if self.instance and self.instance.is_sensitive:
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
            'api_key': {'write_only': True},
            'api_secret': {'write_only': True},
        }

class AdminLogSerializer(serializers.ModelSerializer):
    """
    Serializer for AdminLog model.
    """
    admin_username = serializers.CharField(source='admin_user.username', read_only=True)
    
    class Meta:
        model = AdminLog
        fields = '__all__'
        read_only_fields = ['admin_user', 'ip_address', 'created_at']

class DashboardStatsSerializer(serializers.Serializer):
    """
    Serializer for dashboard statistics.
    """
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    total_credits_purchased = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_meetings = serializers.IntegerField()
    completed_meetings = serializers.IntegerField()
    average_rating = serializers.FloatField()
