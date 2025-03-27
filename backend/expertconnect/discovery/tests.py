import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from expertconnect.discovery.models import ExpertSearch, ExpertTag, ExpertSpecialization
from expertconnect.users.models import Category

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
def category():
    return Category.objects.create(
        name='Programming',
        description='Programming and software development'
    )

@pytest.fixture
def expert_tag(expert_user):
    return ExpertTag.objects.create(
        expert=expert_user,
        tag_name='Python'
    )

@pytest.fixture
def expert_specialization(expert_user, category):
    return ExpertSpecialization.objects.create(
        expert=expert_user,
        category=category,
        specialization='Web Development',
        description='Full-stack web development',
        experience_years=5
    )

@pytest.fixture
def expert_search(client_user):
    return ExpertSearch.objects.create(
        user=client_user,
        query='Python developer',
        filters={
            'categories': ['Programming'],
            'min_rating': 4,
            'max_price': 100
        }
    )

@pytest.mark.django_db
class TestDiscoveryAPI:
    def test_search_experts(self, api_client, expert_user, expert_tag, expert_specialization):
        url = reverse('discovery-search') + '?q=Python'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
        assert expert_user.username in [expert['username'] for expert in response.data['results']]
    
    def test_filter_experts_by_category(self, api_client, expert_user, category, expert_specialization):
        url = reverse('discovery-search') + f'?category={category.id}'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
        assert expert_user.username in [expert['username'] for expert in response.data['results']]
    
    def test_filter_experts_by_price_range(self, api_client, expert_user, expert_specialization):
        # Assuming expert has hourly_rate set in their profile
        url = reverse('discovery-search') + '?min_price=50&max_price=100'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        
        # Check if filtering works correctly
        if len(response.data['results']) > 0:
            for expert in response.data['results']:
                assert float(expert['hourly_rate']) >= 50
                assert float(expert['hourly_rate']) <= 100
    
    def test_get_recommendations(self, api_client, client_user, expert_user, expert_tag):
        api_client.force_authenticate(user=client_user)
        url = reverse('discovery-recommendations')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'recommendations' in response.data
    
    def test_get_trending_experts(self, api_client):
        url = reverse('discovery-trending')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'trending_experts' in response.data
    
    def test_save_search(self, api_client, client_user):
        api_client.force_authenticate(user=client_user)
        url = reverse('discovery-save-search')
        data = {
            'query': 'JavaScript developer',
            'filters': {
                'categories': ['Programming'],
                'min_rating': 4,
                'max_price': 120
            }
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check search was saved
        assert ExpertSearch.objects.filter(
            user=client_user,
            query='JavaScript developer'
        ).exists()
    
    def test_get_saved_searches(self, api_client, client_user, expert_search):
        api_client.force_authenticate(user=client_user)
        url = reverse('discovery-saved-searches')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        assert response.data[0]['query'] == 'Python developer'
    
    def test_delete_saved_search(self, api_client, client_user, expert_search):
        api_client.force_authenticate(user=client_user)
        url = reverse('discovery-delete-search', args=[expert_search.id])
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Check search was deleted
        assert not ExpertSearch.objects.filter(id=expert_search.id).exists()

@pytest.mark.django_db
class TestExpertTagAPI:
    def test_list_expert_tags(self, api_client, expert_user, expert_tag):
        url = reverse('experttag-list') + f'?expert={expert_user.id}'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        assert response.data[0]['tag_name'] == 'Python'
    
    def test_create_expert_tag(self, api_client, expert_user):
        api_client.force_authenticate(user=expert_user)
        url = reverse('experttag-list')
        data = {
            'tag_name': 'JavaScript'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check tag was created
        assert ExpertTag.objects.filter(
            expert=expert_user,
            tag_name='JavaScript'
        ).exists()
    
    def test_delete_expert_tag(self, api_client, expert_user, expert_tag):
        api_client.force_authenticate(user=expert_user)
        url = reverse('experttag-detail', args=[expert_tag.id])
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Check tag was deleted
        assert not ExpertTag.objects.filter(id=expert_tag.id).exists()

@pytest.mark.django_db
class TestExpertSpecializationAPI:
    def test_list_expert_specializations(self, api_client, expert_user, expert_specialization):
        url = reverse('expertspecialization-list') + f'?expert={expert_user.id}'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        assert response.data[0]['specialization'] == 'Web Development'
    
    def test_create_expert_specialization(self, api_client, expert_user, category):
        api_client.force_authenticate(user=expert_user)
        url = reverse('expertspecialization-list')
        data = {
            'category': category.id,
            'specialization': 'Mobile Development',
            'description': 'iOS and Android development',
            'experience_years': 3
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check specialization was created
        assert ExpertSpecialization.objects.filter(
            expert=expert_user,
            specialization='Mobile Development'
        ).exists()
    
    def test_update_expert_specialization(self, api_client, expert_user, expert_specialization):
        api_client.force_authenticate(user=expert_user)
        url = reverse('expertspecialization-detail', args=[expert_specialization.id])
        data = {
            'description': 'Updated description',
            'experience_years': 6
        }
        response = api_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        # Refresh from database
        expert_specialization.refresh_from_db()
        assert expert_specialization.description == 'Updated description'
        assert expert_specialization.experience_years == 6
    
    def test_delete_expert_specialization(self, api_client, expert_user, expert_specialization):
        api_client.force_authenticate(user=expert_user)
        url = reverse('expertspecialization-detail', args=[expert_specialization.id])
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Check specialization was deleted
        assert not ExpertSpecialization.objects.filter(id=expert_specialization.id).exists()
