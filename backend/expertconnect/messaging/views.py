"""
Views for the messaging app.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Message, Notification
from .serializers import (
    MessageSerializer, MessageCreateSerializer,
    NotificationSerializer, NotificationMarkReadSerializer
)

class MessageViewSet(viewsets.ModelViewSet):
    """
    API endpoint for messages.
    """
    queryset = Message.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return MessageCreateSerializer
        return MessageSerializer
    
    def get_queryset(self):
        """
        Filter messages to show conversations involving the current user.
        """
        user = self.request.user
        other_user_id = self.request.query_params.get('user_id', None)
        meeting_id = self.request.query_params.get('meeting_id', None)
        
        queryset = Message.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).order_by('created_at')
        
        if other_user_id:
            queryset = queryset.filter(
                Q(sender_id=other_user_id, receiver=user) | 
                Q(sender=user, receiver_id=other_user_id)
            )
            
        if meeting_id:
            queryset = queryset.filter(related_meeting_id=meeting_id)
            
        return queryset
    
    def create(self, request, *args, **kwargs):
        """
        Create a message and create notification.
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            message = serializer.save()
            
            # Create notification for receiver
            Notification.objects.create(
                user=message.receiver,
                notification_type='new_message',
                content=f"New message from {request.user.full_name}",
                related_id=message.id,
                related_type='message'
            )
            
            return Response(
                MessageSerializer(message, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        """
        Mark a message as read.
        """
        message = self.get_object()
        
        # Only the receiver can mark a message as read
        if message.receiver != request.user:
            return Response(
                {'error': 'You can only mark messages sent to you as read.'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        message.is_read = True
        message.save()
        
        return Response({'status': 'message marked as read'})
    
    @action(detail=False, methods=['patch'])
    def mark_all_read(self, request):
        """
        Mark all messages from a specific user as read.
        """
        sender_id = request.data.get('sender_id')
        
        if not sender_id:
            return Response(
                {'error': 'sender_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        messages = Message.objects.filter(
            sender_id=sender_id,
            receiver=request.user,
            is_read=False
        )
        
        messages.update(is_read=True)
        
        return Response({'status': f'marked {messages.count()} messages as read'})

class NotificationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for notifications.
    """
    queryset = Notification.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'mark_read' or self.action == 'mark_all_read':
            return NotificationMarkReadSerializer
        return NotificationSerializer
    
    def get_queryset(self):
        """
        Filter notifications to only show the current user's notifications.
        """
        return Notification.objects.filter(
            user=self.request.user
        ).order_by('-created_at')
    
    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        """
        Mark a notification as read.
        """
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        
        return Response({'status': 'notification marked as read'})
    
    @action(detail=False, methods=['patch'])
    def mark_all_read(self, request):
        """
        Mark all notifications as read.
        """
        notifications = Notification.objects.filter(
            user=request.user,
            is_read=False
        )
        
        notifications.update(is_read=True)
        
        return Response({'status': f'marked {notifications.count()} notifications as read'})
