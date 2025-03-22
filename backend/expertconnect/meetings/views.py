"""
Views for the meetings app.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from .models import Meeting, Review
from .serializers import (
    MeetingSerializer, MeetingCreateSerializer, MeetingUpdateStatusSerializer,
    ReviewSerializer, ReviewCreateSerializer
)
from expertconnect.credits.models import Credit, CreditTransaction
from expertconnect.messaging.models import Notification

class MeetingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for meetings.
    """
    queryset = Meeting.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return MeetingCreateSerializer
        elif self.action == 'update_status':
            return MeetingUpdateStatusSerializer
        return MeetingSerializer
    
    def get_queryset(self):
        """
        Filter meetings based on user role and query parameters.
        """
        user = self.request.user
        status_filter = self.request.query_params.get('status', None)
        
        # Get meetings where user is either requester or expert
        queryset = Meeting.objects.filter(
            models.Q(requester=user) | models.Q(expert=user)
        ).order_by('-scheduled_start')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        return queryset
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Create a meeting and handle credit transaction.
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Check if user has enough credits
            try:
                credit = Credit.objects.get(user=request.user)
                if credit.balance < 1:
                    return Response(
                        {'error': 'Insufficient credits. Please purchase more credits.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Credit.DoesNotExist:
                # Create credit record with 1 free credit if it doesn't exist
                credit = Credit.objects.create(user=request.user, balance=1)
            
            # Create meeting
            meeting = serializer.save()
            
            # Create notification for expert
            Notification.objects.create(
                user=meeting.expert,
                notification_type='meeting_request',
                content=f"{request.user.full_name} has requested a meeting with you: {meeting.title}",
                related_id=meeting.id,
                related_type='meeting'
            )
            
            return Response(
                MeetingSerializer(meeting, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'])
    @transaction.atomic
    def update_status(self, request, pk=None):
        """
        Update meeting status and handle credit transactions.
        """
        meeting = self.get_object()
        serializer = MeetingUpdateStatusSerializer(meeting, data=request.data, partial=True)
        
        if serializer.is_valid():
            new_status = serializer.validated_data.get('status')
            
            # Handle different status transitions
            if new_status == 'confirmed' and meeting.status == 'pending':
                if meeting.expert != request.user:
                    return Response(
                        {'error': 'Only the expert can confirm a meeting.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Create notification for requester
                Notification.objects.create(
                    user=meeting.requester,
                    notification_type='meeting_confirmed',
                    content=f"Your meeting '{meeting.title}' has been confirmed by {meeting.expert.full_name}",
                    related_id=meeting.id,
                    related_type='meeting'
                )
                
            elif new_status == 'completed' and meeting.status == 'confirmed':
                # Process credit transfer from requester to expert
                requester_credit = Credit.objects.get(user=meeting.requester)
                
                # Deduct credit from requester
                if requester_credit.balance >= 1:
                    requester_credit.balance -= 1
                    requester_credit.save()
                    
                    # Create transaction record for requester
                    CreditTransaction.objects.create(
                        user=meeting.requester,
                        transaction_type='spent',
                        amount=1,
                        description=f"Spent 1 credit for meeting with {meeting.expert.full_name}",
                        related_meeting_id=meeting.id
                    )
                    
                    # Add credit to expert
                    try:
                        expert_credit = Credit.objects.get(user=meeting.expert)
                        expert_credit.balance += 1
                        expert_credit.save()
                    except Credit.DoesNotExist:
                        expert_credit = Credit.objects.create(
                            user=meeting.expert,
                            balance=2  # 1 free credit + 1 earned
                        )
                    
                    # Create transaction record for expert
                    CreditTransaction.objects.create(
                        user=meeting.expert,
                        transaction_type='earned',
                        amount=1,
                        description=f"Earned 1 credit for meeting with {meeting.requester.full_name}",
                        related_meeting_id=meeting.id
                    )
                    
                    # Create review reminder notifications
                    Notification.objects.create(
                        user=meeting.requester,
                        notification_type='review_reminder',
                        content=f"Please leave a review for your meeting with {meeting.expert.full_name}",
                        related_id=meeting.id,
                        related_type='meeting'
                    )
                    
                    Notification.objects.create(
                        user=meeting.expert,
                        notification_type='review_reminder',
                        content=f"Please leave a review for your meeting with {meeting.requester.full_name}",
                        related_id=meeting.id,
                        related_type='meeting'
                    )
                
            elif new_status == 'cancelled' and meeting.status in ['pending', 'confirmed']:
                # Create notification for the other party
                recipient = meeting.expert if request.user == meeting.requester else meeting.requester
                Notification.objects.create(
                    user=recipient,
                    notification_type='meeting_cancelled',
                    content=f"Meeting '{meeting.title}' has been cancelled by {request.user.full_name}",
                    related_id=meeting.id,
                    related_type='meeting'
                )
            
            meeting = serializer.save()
            return Response(MeetingSerializer(meeting).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReviewViewSet(viewsets.ModelViewSet):
    """
    API endpoint for reviews.
    """
    queryset = Review.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReviewCreateSerializer
        return ReviewSerializer
    
    def get_queryset(self):
        """
        Filter reviews based on query parameters.
        """
        meeting_id = self.request.query_params.get('meeting_id', None)
        user_id = self.request.query_params.get('user_id', None)
        
        queryset = Review.objects.all()
        
        if meeting_id:
            queryset = queryset.filter(meeting_id=meeting_id)
            
        if user_id:
            queryset = queryset.filter(reviewee_id=user_id)
            
        return queryset
