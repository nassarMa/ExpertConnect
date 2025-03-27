import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from expertconnect.users.models import Category
from expertconnect.reviews.models import Review, ProviderRating
from expertconnect.discovery.models import Location, AvailabilitySlot, ServiceOffering, Booking
from expertconnect.credits.models import CreditPackage, UserCredit, CreditTransaction, Payment, PaymentMethod
import json
from datetime import datetime, timedelta

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def admin_user():
    return User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='adminpassword',
        first_name='Admin',
        last_name='User',
        role='both'
    )

@pytest.fixture
def provider_user():
    user = User.objects.create_user(
        username='provider',
        email='provider@example.com',
        password='providerpassword',
        first_name='Provider',
        last_name='User',
        role='provider',
        headline='Experienced Consultant',
        bio='Professional with 10+ years of experience',
        hourly_rate=100,
        is_available_for_hire=True
    )
    # Create provider rating
    ProviderRating.objects.create(
        provider=user,
        average_rating=4.5,
        expertise_rating=4.7,
        communication_rating=4.6,
        value_rating=4.3,
        review_count=15,
        recommendation_percentage=92.0,
        completed_sessions=25,
        response_time_minutes=30,
        ranking_score=85.5
    )
    # Create location
    Location.objects.create(
        user=user,
        city='New York',
        state='NY',
        country='USA',
        postal_code='10001',
        latitude=40.7128,
        longitude=-74.0060,
        is_remote_available=True,
        is_in_person_available=True,
        service_radius=25
    )
    return user

@pytest.fixture
def consumer_user():
    user = User.objects.create_user(
        username='consumer',
        email='consumer@example.com',
        password='consumerpassword',
        first_name='Consumer',
        last_name='User',
        role='consumer'
    )
    # Create user credits
    UserCredit.objects.create(
        user=user,
        balance=500,
        lifetime_earned=1000,
        lifetime_spent=500
    )
    return user

@pytest.fixture
def categories():
    categories = []
    for name in ['Technology', 'Business', 'Health', 'Education', 'Legal']:
        category = Category.objects.create(
            name=name,
            description=f'{name} consultation services'
        )
        categories.append(category)
    return categories

@pytest.fixture
def credit_packages():
    packages = []
    packages.append(CreditPackage.objects.create(
        name='Starter',
        description='Basic credit package for new users',
        credit_amount=100,
        price=10.00,
        is_active=True,
        is_featured=False
    ))
    packages.append(CreditPackage.objects.create(
        name='Standard',
        description='Standard credit package with good value',
        credit_amount=500,
        price=45.00,
        is_active=True,
        is_featured=True
    ))
    packages.append(CreditPackage.objects.create(
        name='Premium',
        description='Premium credit package with best value',
        credit_amount=1000,
        price=80.00,
        is_active=True,
        is_featured=True,
        discount_percentage=10
    ))
    return packages

@pytest.fixture
def service_offerings(provider_user, categories):
    offerings = []
    offerings.append(ServiceOffering.objects.create(
        provider=provider_user,
        title='Technology Consultation',
        description='Expert advice on technology implementation',
        category=categories[0],
        duration_minutes=60,
        credit_cost=100,
        is_active=True
    ))
    offerings.append(ServiceOffering.objects.create(
        provider=provider_user,
        title='Business Strategy Session',
        description='Strategic planning for your business',
        category=categories[1],
        duration_minutes=90,
        credit_cost=150,
        is_active=True
    ))
    return offerings

@pytest.fixture
def availability_slots(provider_user):
    slots = []
    today = datetime.now().date()
    for i in range(7):  # Next 7 days
        date = today + timedelta(days=i)
        # Morning slot
        slots.append(AvailabilitySlot.objects.create(
            user=provider_user,
            date=date,
            start_time='09:00:00',
            end_time='12:00:00',
            is_available=True
        ))
        # Afternoon slot
        slots.append(AvailabilitySlot.objects.create(
            user=provider_user,
            date=date,
            start_time='13:00:00',
            end_time='17:00:00',
            is_available=True
        ))
    return slots

@pytest.fixture
def payment_method(consumer_user):
    return PaymentMethod.objects.create(
        user=consumer_user,
        method_type='credit_card',
        is_default=True,
        card_type='visa',
        last_four='4242',
        expiry_month='12',
        expiry_year='2025'
    )

@pytest.mark.django_db
class TestUserAPI:
    def test_user_registration(self, api_client):
        url = reverse('user-register')
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'StrongPassword123',
            're_password': 'StrongPassword123',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'consumer'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(username='newuser').exists()
        
    def test_provider_registration(self, api_client):
        url = reverse('user-register')
        data = {
            'username': 'newprovider',
            'email': 'newprovider@example.com',
            'password': 'StrongPassword123',
            're_password': 'StrongPassword123',
            'first_name': 'New',
            'last_name': 'Provider',
            'role': 'provider',
            'headline': 'Expert Consultant',
            'bio': 'I have over 10 years of experience in my field and offer professional consultation services.',
            'hourly_rate': 75,
            'is_available_for_hire': True
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        user = User.objects.get(username='newprovider')
        assert user.role == 'provider'
        assert user.headline == 'Expert Consultant'
        
    def test_user_login(self, api_client, consumer_user):
        url = reverse('token_obtain_pair')
        data = {
            'username': 'consumer',
            'password': 'consumerpassword'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        
    def test_user_profile(self, api_client, consumer_user):
        api_client.force_authenticate(user=consumer_user)
        url = reverse('user-profile-me')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == consumer_user.username
        assert response.data['email'] == consumer_user.email

@pytest.mark.django_db
class TestReviewAPI:
    def test_create_review(self, api_client, consumer_user, provider_user):
        api_client.force_authenticate(user=consumer_user)
        url = reverse('review-list')
        data = {
            'provider': provider_user.id,
            'rating': 5,
            'comment': 'Excellent service and very knowledgeable!',
            'expertise_rating': 5,
            'communication_rating': 4,
            'value_rating': 5,
            'would_recommend': True
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check if provider rating was updated
        provider_rating = ProviderRating.objects.get(provider=provider_user)
        assert provider_rating.review_count > 0
        
    def test_get_provider_reviews(self, api_client, consumer_user, provider_user):
        # Create a review first
        Review.objects.create(
            provider=provider_user,
            consumer=consumer_user,
            rating=4,
            comment='Great consultation!',
            expertise_rating=4,
            communication_rating=5,
            value_rating=4,
            would_recommend=True
        )
        
        url = reverse('review-list') + f'?provider={provider_user.id}'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0
        assert response.data[0]['provider'] == provider_user.id
        
    def test_top_providers(self, api_client, provider_user):
        url = reverse('provider-rating-top-providers')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0

@pytest.mark.django_db
class TestDiscoveryAPI:
    def test_provider_search(self, api_client, provider_user):
        url = reverse('provider-search-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0
        assert response.data[0]['id'] == provider_user.id
        
    def test_provider_search_by_location(self, api_client, provider_user):
        url = reverse('provider-search-list') + '?city=New%20York'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0
        assert response.data[0]['id'] == provider_user.id
        
    def test_nearby_providers(self, api_client, provider_user):
        url = reverse('provider-search-nearby') + '?latitude=40.7&longitude=-74.0&radius=50'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0
        
    def test_create_booking(self, api_client, consumer_user, provider_user, service_offerings, availability_slots):
        api_client.force_authenticate(user=consumer_user)
        url = reverse('booking-list')
        tomorrow = datetime.now().date() + timedelta(days=1)
        data = {
            'service': service_offerings[0].id,
            'consumer': consumer_user.id,
            'date': tomorrow.isoformat(),
            'start_time': '10:00:00',
            'end_time': '11:00:00',
            'is_remote': True,
            'notes': 'Looking forward to our consultation'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['status'] == 'pending'
        
    def test_confirm_booking(self, api_client, consumer_user, provider_user, service_offerings):
        # Create a booking first
        booking = Booking.objects.create(
            service=service_offerings[0],
            provider=provider_user,
            consumer=consumer_user,
            date=datetime.now().date() + timedelta(days=1),
            start_time='14:00:00',
            end_time='15:00:00',
            status='pending',
            credits_charged=service_offerings[0].credit_cost,
            is_remote=True
        )
        
        api_client.force_authenticate(user=provider_user)
        url = reverse('booking-confirm', args=[booking.id])
        response = api_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'confirmed'

@pytest.mark.django_db
class TestCreditAPI:
    def test_list_credit_packages(self, api_client, credit_packages):
        url = reverse('credit-package-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3
        
    def test_user_credit_balance(self, api_client, consumer_user):
        api_client.force_authenticate(user=consumer_user)
        url = reverse('user-credit-my-balance')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['balance'] == 500
        
    def test_create_payment(self, api_client, consumer_user, credit_packages, payment_method):
        api_client.force_authenticate(user=consumer_user)
        url = reverse('purchase-credits')
        data = {
            'credit_package': credit_packages[1].id,
            'payment_method': payment_method.id
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['status'] == 'pending'
        assert response.data['credits_purchased'] == credit_packages[1].credit_amount
        
    def test_credit_transactions(self, api_client, consumer_user):
        # Create a transaction first
        CreditTransaction.objects.create(
            user=consumer_user,
            amount=100,
            type='purchase',
            balance_after=600,
            description='Purchased 100 credits'
        )
        
        api_client.force_authenticate(user=consumer_user)
        url = reverse('credit-transaction-my-transactions')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0
        assert response.data[0]['user'] == consumer_user.id
