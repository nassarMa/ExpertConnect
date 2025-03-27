import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from expertconnect.users.models import UserSkill, Category, UserAvailability
from expertconnect.users.serializers import UserSerializer

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def regular_user():
    user = User.objects.create_user(
        username='user',
        email='user@example.com',
        password='userpassword'
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
def user_skill(expert_user, category):
    return UserSkill.objects.create(
        user=expert_user,
        category=category,
        skill_name='Python',
        proficiency_level=5,
        years_experience=5
    )

@pytest.fixture
def user_availability(expert_user):
    return UserAvailability.objects.create(
        user=expert_user,
        day_of_week=1,  # Monday
        start_time='09:00:00',
        end_time='17:00:00'
    )

@pytest.mark.django_db
class TestUserAPI:
    def test_register_user(self, api_client):
        url = reverse('user-register')
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newuserpassword',
            'password_confirm': 'newuserpassword',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'client'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check user was created
        assert User.objects.filter(username='newuser').exists()
        
        # Check user can login
        login_data = {
            'username': 'newuser',
            'password': 'newuserpassword'
        }
        login_url = reverse('token_obtain_pair')
        login_response = api_client.post(login_url, login_data, format='json')
        assert login_response.status_code == status.HTTP_200_OK
        assert 'access' in login_response.data
    
    def test_register_expert(self, api_client, category):
        url = reverse('user-register')
        data = {
            'username': 'newexpert',
            'email': 'newexpert@example.com',
            'password': 'newexpertpassword',
            'password_confirm': 'newexpertpassword',
            'first_name': 'New',
            'last_name': 'Expert',
            'role': 'expert',
            'bio': 'Experienced developer',
            'hourly_rate': 50,
            'skills': [
                {
                    'category': category.id,
                    'skill_name': 'JavaScript',
                    'proficiency_level': 4,
                    'years_experience': 3
                }
            ]
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check user was created with expert role
        user = User.objects.get(username='newexpert')
        assert user.role == 'expert'
        
        # Check skill was created
        assert UserSkill.objects.filter(user=user, skill_name='JavaScript').exists()
    
    def test_user_profile(self, api_client, regular_user):
        api_client.force_authenticate(user=regular_user)
        url = reverse('user-me')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == regular_user.username
        assert response.data['email'] == regular_user.email
    
    def test_update_profile(self, api_client, regular_user):
        api_client.force_authenticate(user=regular_user)
        url = reverse('user-me')
        data = {
            'first_name': 'Updated',
            'last_name': 'User',
            'bio': 'New bio'
        }
        response = api_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        # Refresh from database
        regular_user.refresh_from_db()
        assert regular_user.first_name == 'Updated'
        assert regular_user.last_name == 'User'
        assert regular_user.bio == 'New bio'
    
    def test_change_password(self, api_client, regular_user):
        api_client.force_authenticate(user=regular_user)
        url = reverse('user-change-password')
        data = {
            'old_password': 'userpassword',
            'new_password': 'newuserpassword',
            'new_password_confirm': 'newuserpassword'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        # Check user can login with new password
        login_data = {
            'username': regular_user.username,
            'password': 'newuserpassword'
        }
        login_url = reverse('token_obtain_pair')
        login_response = api_client.post(login_url, login_data, format='json')
        assert login_response.status_code == status.HTTP_200_OK

@pytest.mark.django_db
class TestUserSkillAPI:
    def test_list_user_skills(self, api_client, expert_user, user_skill):
        api_client.force_authenticate(user=expert_user)
        url = reverse('userskill-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['skill_name'] == 'Python'
    
    def test_create_user_skill(self, api_client, expert_user, category):
        api_client.force_authenticate(user=expert_user)
        url = reverse('userskill-list')
        data = {
            'category': category.id,
            'skill_name': 'JavaScript',
            'proficiency_level': 4,
            'years_experience': 3
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check skill was created
        assert UserSkill.objects.filter(user=expert_user, skill_name='JavaScript').exists()
    
    def test_update_user_skill(self, api_client, expert_user, user_skill):
        api_client.force_authenticate(user=expert_user)
        url = reverse('userskill-detail', args=[user_skill.id])
        data = {
            'proficiency_level': 4,
            'years_experience': 6
        }
        response = api_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        # Refresh from database
        user_skill.refresh_from_db()
        assert user_skill.proficiency_level == 4
        assert user_skill.years_experience == 6
    
    def test_delete_user_skill(self, api_client, expert_user, user_skill):
        api_client.force_authenticate(user=expert_user)
        url = reverse('userskill-detail', args=[user_skill.id])
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Check skill is deleted
        assert not UserSkill.objects.filter(id=user_skill.id).exists()

@pytest.mark.django_db
class TestCategoryAPI:
    def test_list_categories(self, api_client, category):
        url = reverse('category-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Programming'

@pytest.mark.django_db
class TestUserAvailabilityAPI:
    def test_list_user_availability(self, api_client, expert_user, user_availability):
        api_client.force_authenticate(user=expert_user)
        url = reverse('useravailability-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['day_of_week'] == 1
    
    def test_create_user_availability(self, api_client, expert_user):
        api_client.force_authenticate(user=expert_user)
        url = reverse('useravailability-list')
        data = {
            'day_of_week': 2,  # Tuesday
            'start_time': '10:00:00',
            'end_time': '18:00:00'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check availability was created
        assert UserAvailability.objects.filter(
            user=expert_user, 
            day_of_week=2
        ).exists()
    
    def test_update_user_availability(self, api_client, expert_user, user_availability):
        api_client.force_authenticate(user=expert_user)
        url = reverse('useravailability-detail', args=[user_availability.id])
        data = {
            'start_time': '08:00:00',
            'end_time': '16:00:00'
        }
        response = api_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        # Refresh from database
        user_availability.refresh_from_db()
        assert user_availability.start_time.strftime('%H:%M:%S') == '08:00:00'
        assert user_availability.end_time.strftime('%H:%M:%S') == '16:00:00'
    
    def test_delete_user_availability(self, api_client, expert_user, user_availability):
        api_client.force_authenticate(user=expert_user)
        url = reverse('useravailability-detail', args=[user_availability.id])
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Check availability is deleted
        assert not UserAvailability.objects.filter(id=user_availability.id).exists()
