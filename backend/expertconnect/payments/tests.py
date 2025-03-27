import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from expertconnect.payments.models import PaymentGateway, SubscriptionPlan, Subscription
from expertconnect.credits.models import CreditPackage, UserCredit, Payment, PaymentMethod

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
def expert_user():
    user = User.objects.create_user(
        username='expert',
        email='expert@example.com',
        password='expertpassword',
        role='expert'
    )
    return user

@pytest.fixture
def payment_gateway():
    return PaymentGateway.objects.create(
        name='Test Stripe',
        gateway_type='stripe',
        is_active=True,
        is_default=True,
        test_mode=True,
        configuration={
            'test_publishable_key': 'pk_test_123',
            'test_secret_key': 'sk_test_123',
            'webhook_secret': 'whsec_123'
        }
    )

@pytest.fixture
def subscription_plan():
    return SubscriptionPlan.objects.create(
        name='Basic Plan',
        description='Basic subscription plan',
        price=19.99,
        credits_per_month=100,
        duration_months=1,
        is_active=True,
        is_featured=True
    )

@pytest.fixture
def credit_package():
    return CreditPackage.objects.create(
        name='Starter Pack',
        description='Starter credit package',
        credit_amount=50,
        price=9.99,
        is_active=True,
        is_featured=True
    )

@pytest.fixture
def payment_method(regular_user):
    return PaymentMethod.objects.create(
        user=regular_user,
        method_type='credit_card',
        is_default=True,
        card_type='visa',
        last_four='4242',
        expiry_month='12',
        expiry_year='2025',
        payment_token='tok_visa'
    )

@pytest.mark.django_db
class TestPaymentGatewayAPI:
    def test_list_payment_gateways(self, api_client, admin_user, payment_gateway):
        # Admin can see all gateways including configuration
        api_client.force_authenticate(user=admin_user)
        url = reverse('paymentgateway-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert 'configuration' in response.data[0]
    
    def test_create_payment_gateway(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        url = reverse('paymentgateway-list')
        data = {
            'name': 'New Gateway',
            'gateway_type': 'paypal',
            'is_active': True,
            'is_default': False,
            'test_mode': True,
            'configuration': {
                'test_client_id': 'client_id_123',
                'test_client_secret': 'client_secret_123'
            }
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'New Gateway'
    
    def test_regular_user_cannot_create_gateway(self, api_client, regular_user):
        api_client.force_authenticate(user=regular_user)
        url = reverse('paymentgateway-list')
        data = {
            'name': 'New Gateway',
            'gateway_type': 'paypal',
            'is_active': True
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
class TestSubscriptionPlanAPI:
    def test_list_subscription_plans(self, api_client, regular_user, subscription_plan):
        api_client.force_authenticate(user=regular_user)
        url = reverse('subscriptionplan-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Basic Plan'
    
    def test_featured_subscription_plans(self, api_client, regular_user, subscription_plan):
        api_client.force_authenticate(user=regular_user)
        url = reverse('subscriptionplan-featured')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['is_featured'] == True

@pytest.mark.django_db
class TestSubscriptionAPI:
    def test_create_subscription(self, api_client, regular_user, subscription_plan, payment_method):
        api_client.force_authenticate(user=regular_user)
        url = reverse('subscription-list')
        data = {
            'plan': subscription_plan.id,
            'payment_method': payment_method.id,
            'auto_renew': True
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check that user received credits
        user_credit = UserCredit.objects.get(user=regular_user)
        assert user_credit.balance == subscription_plan.credits_per_month
    
    def test_cancel_subscription(self, api_client, regular_user, subscription_plan, payment_method):
        # Create subscription first
        subscription = Subscription.objects.create(
            user=regular_user,
            plan=subscription_plan,
            payment_method=payment_method,
            auto_renew=True
        )
        
        api_client.force_authenticate(user=regular_user)
        url = reverse('subscription-cancel', args=[subscription.id])
        response = api_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        
        # Refresh from database
        subscription.refresh_from_db()
        assert subscription.status == 'canceled'
        assert subscription.auto_renew == False

@pytest.mark.django_db
class TestCreditPackageAPI:
    def test_list_credit_packages(self, api_client, regular_user, credit_package):
        api_client.force_authenticate(user=regular_user)
        url = reverse('creditpackage-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Starter Pack'
    
    def test_featured_credit_packages(self, api_client, regular_user, credit_package):
        api_client.force_authenticate(user=regular_user)
        url = reverse('creditpackage-featured')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['is_featured'] == True

@pytest.mark.django_db
class TestPaymentAPI:
    def test_create_payment(self, api_client, regular_user, credit_package, payment_method, payment_gateway):
        api_client.force_authenticate(user=regular_user)
        url = reverse('payment-list')
        data = {
            'credit_package': credit_package.id,
            'payment_method': payment_method.id,
            'payment_token': 'tok_visa',
            'gateway_id': payment_gateway.id
        }
        
        # Mock the payment processor
        from unittest.mock import patch
        with patch('expertconnect.payments.models.PaymentProcessor.process_stripe_payment') as mock_process:
            mock_process.return_value = (True, 'ch_123456')
            response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check that payment was created
        payment = Payment.objects.get(user=regular_user)
        assert payment.status == 'completed'
        assert payment.transaction_id == 'ch_123456'
        
        # Check that user received credits
        user_credit = UserCredit.objects.get(user=regular_user)
        assert user_credit.balance == credit_package.credit_amount

@pytest.mark.django_db
class TestUserCreditAPI:
    def test_get_user_balance(self, api_client, regular_user):
        # Create user credit
        UserCredit.objects.create(
            user=regular_user,
            balance=100,
            lifetime_earned=150,
            lifetime_spent=50
        )
        
        api_client.force_authenticate(user=regular_user)
        url = reverse('usercredit-my-balance')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['balance'] == 100
        assert response.data['lifetime_earned'] == 150
        assert response.data['lifetime_spent'] == 50
    
    def test_get_credit_statistics(self, api_client, regular_user):
        # Create user credit
        UserCredit.objects.create(
            user=regular_user,
            balance=100,
            lifetime_earned=150,
            lifetime_spent=50
        )
        
        api_client.force_authenticate(user=regular_user)
        url = reverse('usercredit-statistics')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['current_balance'] == 100
        assert response.data['lifetime_earned'] == 150
        assert response.data['lifetime_spent'] == 50
