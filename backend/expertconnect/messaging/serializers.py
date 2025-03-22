"""
Serializers for the messaging app.
"""

from rest_framework import serializers
from .models import Message, Notification

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    receiver_name = serializers.CharField(source='receiver.full_name', read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'receiver', 'receiver_name', 
                  'message_content', 'is_read', 'created_at', 'related_meeting']
        read_only_fields = ['id', 'sender_name', 'receiver_name', 'created_at']

class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['receiver', 'message_content', 'related_meeting']
        
    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['sender'] = user
        return super().create(validated_data)

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'notification_type', 'content', 
                  'is_read', 'created_at', 'related_id', 'related_type']
        read_only_fields = ['id', 'user', 'created_at']

class NotificationMarkReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['is_read']
