"""
Serializers for the meetings app.
"""

from rest_framework import serializers
from .models import Meeting, Review
from expertconnect.users.serializers import UserSerializer

class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.full_name', read_only=True)
    reviewee_name = serializers.CharField(source='reviewee.full_name', read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'meeting', 'reviewer', 'reviewer_name', 'reviewee', 
                  'reviewee_name', 'rating', 'feedback', 'created_at']
        read_only_fields = ['id', 'reviewer_name', 'reviewee_name', 'created_at']

class MeetingSerializer(serializers.ModelSerializer):
    requester_name = serializers.CharField(source='requester.full_name', read_only=True)
    expert_name = serializers.CharField(source='expert.full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    
    class Meta:
        model = Meeting
        fields = ['id', 'requester', 'requester_name', 'expert', 'expert_name', 
                  'title', 'description', 'category', 'category_name', 
                  'scheduled_start', 'scheduled_end', 'duration_minutes', 
                  'status', 'meeting_link', 'created_at', 'updated_at', 'reviews']
        read_only_fields = ['id', 'requester_name', 'expert_name', 'category_name', 
                           'duration_minutes', 'created_at', 'updated_at']

class MeetingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meeting
        fields = ['expert', 'title', 'description', 'category', 
                  'scheduled_start', 'scheduled_end']
        
    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['requester'] = user
        validated_data['status'] = 'pending'
        return super().create(validated_data)

class MeetingUpdateStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meeting
        fields = ['status', 'meeting_link']

class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['meeting', 'reviewee', 'rating', 'feedback']
        
    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['reviewer'] = user
        return super().create(validated_data)
        
    def validate(self, data):
        # Ensure the reviewer was part of the meeting
        meeting = data['meeting']
        user = self.context['request'].user
        
        if user != meeting.requester and user != meeting.expert:
            raise serializers.ValidationError("You can only review meetings you participated in.")
            
        # Ensure the reviewee was part of the meeting
        reviewee = data['reviewee']
        if reviewee != meeting.requester and reviewee != meeting.expert:
            raise serializers.ValidationError("You can only review users who participated in the meeting.")
            
        # Ensure users don't review themselves
        if user == reviewee:
            raise serializers.ValidationError("You cannot review yourself.")
            
        return data
