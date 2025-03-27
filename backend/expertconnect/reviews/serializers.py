from rest_framework import serializers
from .models import Review, ProviderRating
from django.contrib.auth import get_user_model

User = get_user_model()

class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for creating and retrieving reviews"""
    consumer_name = serializers.SerializerMethodField()
    provider_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = (
            'id', 'provider', 'provider_name', 'consumer', 'consumer_name',
            'rating', 'comment', 'expertise_rating', 'communication_rating',
            'value_rating', 'would_recommend', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'consumer', 'created_at', 'updated_at')
    
    def get_consumer_name(self, obj):
        return obj.consumer.full_name
    
    def get_provider_name(self, obj):
        return obj.provider.full_name
    
    def validate(self, attrs):
        # Ensure provider has provider role
        provider = attrs.get('provider')
        if not provider.is_provider:
            raise serializers.ValidationError(
                {"provider": "Selected user is not a provider."}
            )
        
        # Ensure consumer is not reviewing themselves
        request = self.context.get('request')
        if request and provider.id == request.user.id:
            raise serializers.ValidationError(
                {"provider": "You cannot review yourself."}
            )
        
        return attrs
    
    def create(self, validated_data):
        # Set consumer to current user
        request = self.context.get('request')
        validated_data['consumer'] = request.user
        return super().create(validated_data)

class ProviderRatingSerializer(serializers.ModelSerializer):
    """Serializer for provider rating metrics"""
    provider_name = serializers.SerializerMethodField()
    provider_headline = serializers.SerializerMethodField()
    provider_profile_picture = serializers.SerializerMethodField()
    
    class Meta:
        model = ProviderRating
        fields = (
            'id', 'provider', 'provider_name', 'provider_headline', 
            'provider_profile_picture', 'average_rating', 'expertise_rating',
            'communication_rating', 'value_rating', 'review_count',
            'recommendation_percentage', 'completed_sessions',
            'response_time_minutes', 'ranking_score', 'last_updated'
        )
        read_only_fields = fields
    
    def get_provider_name(self, obj):
        return obj.provider.full_name
    
    def get_provider_headline(self, obj):
        return obj.provider.headline
    
    def get_provider_profile_picture(self, obj):
        if obj.provider.profile_picture:
            return obj.provider.profile_picture.url
        return None

class TopProviderSerializer(serializers.ModelSerializer):
    """Serializer for listing top providers based on ranking"""
    rating_metrics = ProviderRatingSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'full_name', 'headline', 'profile_picture',
            'hourly_rate', 'is_available_for_hire', 'rating_metrics'
        )
