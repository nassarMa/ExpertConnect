"""
Serializers for the users app.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserSkill, Category, UserAvailability

User = get_user_model()

class UserSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSkill
        fields = ['id', 'skill_name', 'skill_level', 'years_experience']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon']

class UserAvailabilitySerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = UserAvailability
        fields = ['id', 'day_of_week', 'day_name', 'start_time', 'end_time', 'is_available']

class UserSerializer(serializers.ModelSerializer):
    skills = UserSkillSerializer(many=True, read_only=True)
    availability = UserAvailabilitySerializer(many=True, read_only=True)
    credit_balance = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile_picture', 
                  'bio', 'headline', 'is_verified', 'date_joined', 'skills', 
                  'availability', 'credit_balance']
        read_only_fields = ['id', 'date_joined', 'is_verified']

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile information"""
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'profile_picture', 'bio', 'headline']

class UserSkillCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSkill
        fields = ['skill_name', 'skill_level', 'years_experience']
        
    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)

class UserAvailabilityCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAvailability
        fields = ['day_of_week', 'start_time', 'end_time', 'is_available']
        
    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)
