import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from expertconnect.admin_dashboard.models import AdminSetting
from expertconnect.admin_dashboard.views import UserAdminViewSet, AnalyticsViewSet

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def admin_user():
    user = User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='adminpassword'
    )
    return user

@pytest.fixture
def regular_user():
    user = User.objects.create_user(
        username='user',
        email='user@example.com',
        password='userpassword'
    )
    return user

@pytest.fixture
def admin_setting():
    return AdminSetting.objects.create(
        key='site_maintenance',
        value='false',
        description='Site maintenance mode'
    )

@pytest.mark.django_db
class TestAdminDashboardAPI:
    def test_admin_access(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        url = reverse('admin-dashboard')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_regular_user_denied(self, api_client, regular_user):
        api_client.force_authenticate(user=regular_user)
        url = reverse('admin-dashboard')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
class TestUserAdminAPI:
    def test_list_users(self, api_client, admin_user, regular_user):
        api_client.force_authenticate(user=admin_user)
        url = reverse('admin-users-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 2  # At least admin and regular user
    
    def test_get_user_detail(self, api_client, admin_user, regular_user):
        api_client.force_authenticate(user=admin_user)
        url = reverse('admin-users-detail', args=[regular_user.id])
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == regular_user.username
    
    def test_update_user(self, api_client, admin_user, regular_user):
        api_client.force_authenticate(user=admin_user)
        url = reverse('admin-users-detail', args=[regular_user.id])
        data = {'first_name': 'Updated', 'last_name': 'User'}
        response = api_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        # Refresh from database
        regular_user.refresh_from_db()
        assert regular_user.first_name == 'Updated'
        assert regular_user.last_name == 'User'
    
    def test_delete_user(self, api_client, admin_user, regular_user):
        api_client.force_authenticate(user=admin_user)
        url = reverse('admin-users-detail', args=[regular_user.id])
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Check user is deleted
        assert not User.objects.filter(id=regular_user.id).exists()

@pytest.mark.django_db
class TestAdminSettingsAPI:
    def test_list_settings(self, api_client, admin_user, admin_setting):
        api_client.force_authenticate(user=admin_user)
        url = reverse('admin-settings-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
    
    def test_update_setting(self, api_client, admin_user, admin_setting):
        api_client.force_authenticate(user=admin_user)
        url = reverse('admin-settings-detail', args=[admin_setting.id])
        data = {'value': 'true'}
        response = api_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        # Refresh from database
        admin_setting.refresh_from_db()
        assert admin_setting.value == 'true'
    
    def test_create_setting(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        url = reverse('admin-settings-list')
        data = {
            'key': 'new_setting',
            'value': 'test_value',
            'description': 'Test setting'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check setting was created
        assert AdminSetting.objects.filter(key='new_setting').exists()

@pytest.mark.django_db
class TestAnalyticsAPI:
    def test_get_user_analytics(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        url = reverse('admin-analytics-users')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'total_users' in response.data
        assert 'new_users' in response.data
        assert 'active_users' in response.data
    
    def test_get_revenue_analytics(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        url = reverse('admin-analytics-revenue')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'total_revenue' in response.data
        assert 'monthly_revenue' in response.data
        assert 'revenue_by_package' in response.data
