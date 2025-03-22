import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from expertconnect.users.models import User
from expertconnect.credits.models import Credit, CreditTransaction

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def test_user():
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpassword123'
    )
    return user

@pytest.mark.django_db
class TestCreditSystem:
    
    def test_new_user_gets_free_credit(self, test_user):
        """Test that a new user automatically receives one free credit."""
        # Check that the credit was created
        credit = Credit.objects.get(user=test_user)
        assert credit is not None
        assert credit.balance == 1
        
        # Check that a transaction was recorded
        transaction = CreditTransaction.objects.filter(
            user=test_user,
            transaction_type='bonus',
            amount=1
        ).first()
        assert transaction is not None
        assert 'Initial free credit' in transaction.description
    
    def test_credit_balance_endpoint(self, api_client, test_user):
        """Test the credit balance endpoint."""
        api_client.force_authenticate(user=test_user)
        url = reverse('credit-balance')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['balance'] == 1
        assert response.data['user'] == test_user.id
    
    def test_credit_purchase(self, api_client, test_user):
        """Test purchasing credits."""
        api_client.force_authenticate(user=test_user)
        url = reverse('payment-purchase-credits')
        
        data = {
            'payment_method': 'credit_card',
            'amount': '10.00',
            'credits_to_purchase': 10
        }
        
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert response.data['new_balance'] == 11  # 1 initial + 10 purchased
        
        # Check that the credit balance was updated
        credit = Credit.objects.get(user=test_user)
        assert credit.balance == 11
        
        # Check that a transaction was recorded
        transaction = CreditTransaction.objects.filter(
            user=test_user,
            transaction_type='purchased',
            amount=10
        ).first()
        assert transaction is not None
    
    def test_credit_transfer(self, api_client, test_user):
        """Test transferring credits between users during a meeting."""
        # Create another user (expert)
        expert = User.objects.create_user(
            username='expert',
            email='expert@example.com',
            password='expertpass123'
        )
        
        # Create a meeting
        from expertconnect.meetings.models import Meeting
        meeting = Meeting.objects.create(
            title='Test Meeting',
            requester=test_user,
            expert=expert,
            status='completed',
            scheduled_start='2025-03-21T10:00:00Z',
            scheduled_end='2025-03-21T11:00:00Z'
        )
        
        api_client.force_authenticate(user=test_user)
        url = reverse('credit-transfer')
        
        data = {
            'meeting_id': meeting.id,
            'amount': 1
        }
        
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert response.data['new_balance'] == 0  # 1 initial - 1 transferred
        
        # Check that the requester's credit balance was updated
        requester_credit = Credit.objects.get(user=test_user)
        assert requester_credit.balance == 0
        
        # Check that the expert's credit balance was updated
        expert_credit = Credit.objects.get(user=expert)
        assert expert_credit.balance == 2  # 1 initial + 1 transferred
        
        # Check that transactions were recorded for both users
        requester_transaction = CreditTransaction.objects.filter(
            user=test_user,
            transaction_type='spent',
            amount=1,
            related_meeting_id=meeting.id
        ).first()
        assert requester_transaction is not None
        
        expert_transaction = CreditTransaction.objects.filter(
            user=expert,
            transaction_type='earned',
            amount=1,
            related_meeting_id=meeting.id
        ).first()
        assert expert_transaction is not None
