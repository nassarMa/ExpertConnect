import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from expertconnect.users.models import User
from expertconnect.meetings.models import Meeting

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

@pytest.fixture
def test_expert():
    expert = User.objects.create_user(
        username='expertuser',
        email='expert@example.com',
        password='expertpassword123'
    )
    return expert

@pytest.mark.django_db
class TestMeetingSystem:
    
    def test_create_meeting(self, api_client, test_user, test_expert):
        """Test creating a new meeting."""
        api_client.force_authenticate(user=test_user)
        url = reverse('meeting-list')
        
        data = {
            'title': 'Test Meeting',
            'description': 'This is a test meeting',
            'expert_id': test_expert.id,
            'category_id': 1,  # Assuming category with ID 1 exists
            'scheduled_start': '2025-04-01T10:00:00Z',
            'scheduled_end': '2025-04-01T11:00:00Z'
        }
        
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'Test Meeting'
        assert response.data['requester_id'] == test_user.id
        assert response.data['expert_id'] == test_expert.id
        assert response.data['status'] == 'pending'
    
    def test_confirm_meeting(self, api_client, test_user, test_expert):
        """Test confirming a meeting."""
        # Create a meeting
        meeting = Meeting.objects.create(
            title='Test Meeting',
            description='This is a test meeting',
            requester=test_user,
            expert=test_expert,
            status='pending',
            scheduled_start='2025-04-01T10:00:00Z',
            scheduled_end='2025-04-01T11:00:00Z'
        )
        
        # Authenticate as the expert
        api_client.force_authenticate(user=test_expert)
        url = reverse('meeting-update-status', args=[meeting.id])
        
        data = {
            'status': 'confirmed'
        }
        
        response = api_client.patch(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'confirmed'
        
        # Check that the meeting was updated in the database
        meeting.refresh_from_db()
        assert meeting.status == 'confirmed'
    
    def test_cancel_meeting(self, api_client, test_user, test_expert):
        """Test cancelling a meeting."""
        # Create a meeting
        meeting = Meeting.objects.create(
            title='Test Meeting',
            description='This is a test meeting',
            requester=test_user,
            expert=test_expert,
            status='pending',
            scheduled_start='2025-04-01T10:00:00Z',
            scheduled_end='2025-04-01T11:00:00Z'
        )
        
        # Authenticate as the requester
        api_client.force_authenticate(user=test_user)
        url = reverse('meeting-update-status', args=[meeting.id])
        
        data = {
            'status': 'cancelled'
        }
        
        response = api_client.patch(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'cancelled'
        
        # Check that the meeting was updated in the database
        meeting.refresh_from_db()
        assert meeting.status == 'cancelled'
    
    def test_complete_meeting(self, api_client, test_user, test_expert):
        """Test completing a meeting."""
        # Create a meeting
        meeting = Meeting.objects.create(
            title='Test Meeting',
            description='This is a test meeting',
            requester=test_user,
            expert=test_expert,
            status='confirmed',
            scheduled_start='2025-04-01T10:00:00Z',
            scheduled_end='2025-04-01T11:00:00Z'
        )
        
        # Authenticate as the requester
        api_client.force_authenticate(user=test_user)
        url = reverse('meeting-update-status', args=[meeting.id])
        
        data = {
            'status': 'completed'
        }
        
        response = api_client.patch(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'completed'
        
        # Check that the meeting was updated in the database
        meeting.refresh_from_db()
        assert meeting.status == 'completed'
    
    def test_create_review(self, api_client, test_user, test_expert):
        """Test creating a review for a completed meeting."""
        # Create a completed meeting
        meeting = Meeting.objects.create(
            title='Test Meeting',
            description='This is a test meeting',
            requester=test_user,
            expert=test_expert,
            status='completed',
            scheduled_start='2025-04-01T10:00:00Z',
            scheduled_end='2025-04-01T11:00:00Z'
        )
        
        # Authenticate as the requester
        api_client.force_authenticate(user=test_user)
        url = reverse('review-list')
        
        data = {
            'meeting_id': meeting.id,
            'reviewer_id': test_user.id,
            'reviewee_id': test_expert.id,
            'rating': 5,
            'review_text': 'Excellent meeting, very helpful!'
        }
        
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['rating'] == 5
        assert response.data['review_text'] == 'Excellent meeting, very helpful!'
        assert response.data['meeting_id'] == meeting.id
