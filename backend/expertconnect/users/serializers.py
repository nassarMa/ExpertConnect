from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import UserSkill, Category, UserAvailability

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration with role selection"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    re_password = serializers.CharField(write_only=True, required=True)
    
    # Provider-specific fields (optional based on role)
    headline = serializers.CharField(required=False, allow_blank=True, max_length=100)
    bio = serializers.CharField(required=False, allow_blank=True)
    hourly_rate = serializers.IntegerField(required=False, min_value=0)
    is_available_for_hire = serializers.BooleanField(required=False, default=False)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 're_password', 'first_name', 
                  'last_name', 'role', 'headline', 'bio', 'hourly_rate', 
                  'is_available_for_hire')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'role': {'required': True}
        }
    
    def validate(self, attrs):
        # Validate passwords match
        if attrs['password'] != attrs['re_password']:
            raise serializers.ValidationError({"re_password": "Password fields didn't match."})
        
        # Validate provider fields if role is provider or both
        if attrs.get('role') in ['provider', 'both']:
            if not attrs.get('headline'):
                raise serializers.ValidationError({"headline": "Headline is required for providers."})
            if not attrs.get('bio'):
                raise serializers.ValidationError({"bio": "Bio is required for providers."})
            if attrs.get('hourly_rate') is None:
                raise serializers.ValidationError({"hourly_rate": "Hourly rate is required for providers."})
        
        return attrs
    
    def create(self, validated_data):
        # Remove re_password from validated data
        validated_data.pop('re_password')
        
        # Create user with create_user to properly hash password
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password'],
            role=validated_data['role']
        )
        
        # Set provider-specific fields if applicable
        if validated_data.get('role') in ['provider', 'both']:
            user.headline = validated_data.get('headline', '')
            user.bio = validated_data.get('bio', '')
            user.hourly_rate = validated_data.get('hourly_rate', 0)
            user.is_available_for_hire = validated_data.get('is_available_for_hire', False)
            user.save()
        
        return user

class UserSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSkill
        fields = ('id', 'skill_name', 'skill_level', 'years_experience')

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'description', 'icon')

class UserAvailabilitySerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = UserAvailability
        fields = ('id', 'day_of_week', 'day_name', 'start_time', 'end_time', 'is_available')

class UserProfileSerializer(serializers.ModelSerializer):
    skills = UserSkillSerializer(many=True, read_only=True)
    availability = UserAvailabilitySerializer(many=True, read_only=True)
    credit_balance = serializers.IntegerField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    is_consumer = serializers.BooleanField(read_only=True)
    is_provider = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'full_name',
                  'profile_picture', 'bio', 'headline', 'role', 'is_consumer', 'is_provider',
                  'hourly_rate', 'is_available_for_hire', 'is_verified', 'email_verified',
                  'phone_number', 'phone_verified', 'credit_balance', 'skills', 'availability',
                  'date_joined', 'last_login')
        read_only_fields = ('id', 'username', 'email', 'date_joined', 'last_login', 
                           'is_verified', 'email_verified', 'phone_verified')
