from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Credit, CreditTransaction, PaymentInformation
from .serializers import CreditSerializer, CreditTransactionSerializer, PaymentInformationSerializer
from expertconnect.meetings.models import Meeting

class CreditViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing user credits.
    """
    serializer_class = CreditSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Return credits for the current user only.
        """
        return Credit.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def balance(self, request):
        """
        Get the current user's credit balance.
        """
        credit, created = Credit.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(credit)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def transfer(self, request):
        """
        Transfer credits between users during a meeting.
        """
        meeting_id = request.data.get('meeting_id')
        amount = request.data.get('amount', 1)  # Default to 1 credit
        
        if not meeting_id:
            return Response(
                {'error': 'Meeting ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            meeting = Meeting.objects.get(id=meeting_id)
            
            # Verify the meeting is completed
            if meeting.status != 'completed':
                return Response(
                    {'error': 'Credits can only be transferred for completed meetings'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify the current user is the requester
            if meeting.requester_id != request.user.id:
                return Response(
                    {'error': 'Only the meeting requester can transfer credits'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get the expert user
            expert_user = meeting.expert
            
            # Get or create credit balances
            requester_credit, _ = Credit.objects.get_or_create(user=request.user)
            expert_credit, _ = Credit.objects.get_or_create(user=expert_user)
            
            # Check if requester has enough credits
            if requester_credit.balance < amount:
                return Response(
                    {'error': 'Insufficient credits'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Deduct credits from requester
            requester_credit.balance -= amount
            requester_credit.save()
            
            # Create spent transaction for requester
            CreditTransaction.objects.create(
                user=request.user,
                transaction_type='spent',
                amount=amount,
                description=f'Credit spent for meeting with {expert_user.username}',
                related_meeting_id=meeting_id
            )
            
            # Add credits to expert
            expert_credit.balance += amount
            expert_credit.save()
            
            # Create earned transaction for expert
            CreditTransaction.objects.create(
                user=expert_user,
                transaction_type='earned',
                amount=amount,
                description=f'Credit earned from meeting with {request.user.username}',
                related_meeting_id=meeting_id
            )
            
            return Response({
                'success': True,
                'message': f'{amount} credit(s) transferred successfully',
                'new_balance': requester_credit.balance
            })
            
        except Meeting.DoesNotExist:
            return Response(
                {'error': 'Meeting not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CreditTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing credit transactions.
    """
    serializer_class = CreditTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Return transactions for the current user only.
        """
        return CreditTransaction.objects.filter(user=self.request.user).order_by('-created_at')

class PaymentInformationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing payment information and purchasing credits.
    """
    serializer_class = PaymentInformationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Return payment information for the current user only.
        """
        return PaymentInformation.objects.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        """
        Set the user to the current user when creating payment information.
        """
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def purchase_credits(self, request):
        """
        Purchase credits using payment information.
        """
        payment_method = request.data.get('payment_method')
        amount = request.data.get('amount')
        credits_to_purchase = request.data.get('credits_to_purchase')
        
        if not all([payment_method, amount, credits_to_purchase]):
            return Response(
                {'error': 'Payment method, amount, and credits to purchase are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # In a real application, this would integrate with a payment gateway
            # For this demo, we'll simulate a successful payment
            
            # Create payment record
            payment = PaymentInformation.objects.create(
                user=request.user,
                payment_method=payment_method,
                amount=amount,
                currency='USD',
                status='completed',  # Simulating successful payment
                credits_purchased=credits_to_purchase,
                transaction_id=f'sim_{request.user.id}_{int(amount)}_{credits_to_purchase}'
            )
            
            # Update user's credit balance
            credit, _ = Credit.objects.get_or_create(user=request.user)
            credit.balance += int(credits_to_purchase)
            credit.save()
            
            # Create transaction record
            transaction = CreditTransaction.objects.create(
                user=request.user,
                transaction_type='purchased',
                amount=int(credits_to_purchase),
                description=f'Purchased {credits_to_purchase} credits for ${amount}'
            )
            
            return Response({
                'success': True,
                'payment': PaymentInformationSerializer(payment).data,
                'transaction': CreditTransactionSerializer(transaction).data,
                'new_balance': credit.balance
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
