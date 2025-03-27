import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from expertconnect.reviews.models import Review, ReviewVote, ExpertProfile
from expertconnect.meetings.models import Meeting

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def client_user():
    user = User.objects.create_user(
        username='client',
        email='client@example.com',
        password='clientpassword',
        role='client'
    )
    return user

@pytest.fixture
def expert_user():
    user = User.objects.create_user(
        username='expert',
        email='expert@example.com',
        password='expertpassword',
        role='expert'
    )
    return user

@pytest.fixture
def expert_profile(expert_user):
    return ExpertProfile.objects.create(
        user=expert_user,
        title='Senior Developer',
        summary='Experienced software developer',
        hourly_rate=75.00,
        is_verified=True
    )

@pytest.fixture
def completed_meeting(client_user, expert_user):
    return Meeting.objects.create(
        client=client_user,
        expert=expert_user,
        title='Code Review',
        description='Review my Python project',
        start_time='2025-03-15T14:00:00Z',
        end_time='2025-03-15T15:00:00Z',
        status='completed'
    )

@pytest.fixture
def review(client_user, expert_user, completed_meeting):
    return Review.objects.create(
        reviewer=client_user,
        expert=expert_user,
        meeting=completed_meeting,
        rating=4,
        content='Great session, very helpful!',
        is_public=True
    )

@pytest.mark.django_db
class TestReviewAPI:
    def test_create_review(self, api_client, client_user, expert_user, completed_meeting):
        api_client.force_authenticate(user=client_user)
        url = reverse('review-list')
        data = {
            'expert': expert_user.id,
            'meeting': completed_meeting.id,
            'rating': 5,
            'content': 'Excellent session, learned a lot!',
            'is_public': True
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check review was created
        assert Review.objects.filter(
            reviewer=client_user,
            expert=expert_user,
            rating=5
        ).exists()
    
    def test_list_expert_reviews(self, api_client, expert_user, review):
        url = reverse('review-list') + f'?expert={expert_user.id}'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['rating'] == 4
    
    def test_update_own_review(self, api_client, client_user, review):
        api_client.force_authenticate(user=client_user)
        url = reverse('review-detail', args=[review.id])
        data = {
            'rating': 3,
            'content': 'Updated review content'
        }
        response = api_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        # Refresh from database
        review.refresh_from_db()
        assert review.rating == 3
        assert review.content == 'Updated review content'
    
    def test_cannot_update_others_review(self, api_client, expert_user, review):
        api_client.force_authenticate(user=expert_user)
        url = reverse('review-detail', args=[review.id])
        data = {
            'rating': 5,
            'content': 'Trying to change someone else\'s review'
        }
        response = api_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
class TestReviewVoteAPI:
    def test_upvote_review(self, api_client, client_user, review):
        api_client.force_authenticate(user=client_user)
        url = reverse('reviewvote-list')
        data = {
            'review': review.id,
            'vote_type': 'upvote'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check vote was created
        assert ReviewVote.objects.filter(
            user=client_user,
            review=review,
            vote_type='upvote'
        ).exists()
    
    def test_change_vote(self, api_client, client_user, review):
        # First create an upvote
        vote = ReviewVote.objects.create(
            user=client_user,
            review=review,
            vote_type='upvote'
        )
        
        # Now change to downvote
        api_client.force_authenticate(user=client_user)
        url = reverse('reviewvote-detail', args=[vote.id])
        data = {
            'vote_type': 'downvote'
        }
        response = api_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        # Refresh from database
        vote.refresh_from_db()
        assert vote.vote_type == 'downvote'
    
    def test_remove_vote(self, api_client, client_user, review):
        # First create a vote
        vote = ReviewVote.objects.create(
            user=client_user,
            review=review,
            vote_type='upvote'
        )
        
        # Now delete it
        api_client.force_authenticate(user=client_user)
        url = reverse('reviewvote-detail', args=[vote.id])
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Check vote is deleted
        assert not ReviewVote.objects.filter(id=vote.id).exists()

@pytest.mark.django_db
class TestExpertProfileAPI:
    def test_get_expert_profile(self, api_client, expert_profile):
        url = reverse('expertprofile-detail', args=[expert_profile.id])
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Senior Developer'
        assert response.data['hourly_rate'] == '75.00'
    
    def test_update_own_profile(self, api_client, expert_user, expert_profile):
        api_client.force_authenticate(user=expert_user)
        url = reverse('expertprofile-detail', args=[expert_profile.id])
        data = {
            'title': 'Lead Developer',
            'summary': 'Updated summary',
            'hourly_rate': 85.00
        }
        response = api_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        # Refresh from database
        expert_profile.refresh_from_db()
        assert expert_profile.title == 'Lead Developer'
        assert expert_profile.summary == 'Updated summary'
        assert expert_profile.hourly_rate == 85.00
    
    def test_cannot_update_others_profile(self, api_client, client_user, expert_profile):
        api_client.force_authenticate(user=client_user)
        url = reverse('expertprofile-detail', args=[expert_profile.id])
        data = {
            'title': 'Fake Title',
            'hourly_rate': 10.00
        }
        response = api_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_list_top_experts(self, api_client, expert_profile):
        url = reverse('expertprofile-top')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        
    def test_search_experts(self, api_client, expert_profile):
        url = reverse('expertprofile-search') + '?q=developer'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        assert response.data[0]['title'] == 'Senior Developer'
