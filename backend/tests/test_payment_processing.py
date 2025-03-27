import unittest
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from expertconnect.credits.models import CreditPackage, UserCredit, Payment, PaymentMethod
from expertconnect.credits.views import PaymentViewSet
import stripe
import json

User = get_user_model()

class StripePaymentProcessingTests(TestCase):
    """Unit tests for Stripe payment processing"""
    
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword',
            first_name='Test',
            last_name='User',
            role='consumer'
        )
        
        # Create credit package
        self.credit_package = CreditPackage.objects.create(
            name='Test Package',
            description='Test package for unit tests',
            credit_amount=100,
            price=10.00,
            is_active=True
        )
        
        # Create payment method
        self.payment_method = PaymentMethod.objects.create(
            user=self.user,
            method_type='credit_card',
            is_default=True,
            card_type='visa',
            last_four='4242',
            expiry_month='12',
            expiry_year='2025'
        )
        
        # Create payment
        self.payment = Payment.objects.create(
            user=self.user,
            credit_package=self.credit_package,
            amount=self.credit_package.price,
            credits_purchased=self.credit_package.credit_amount,
            payment_method='credit_card',
            status='pending'
        )
        
        # Create user credit
        self.user_credit, _ = UserCredit.objects.get_or_create(
            user=self.user,
            defaults={'balance': 0}
        )
        
        # Login the user
        self.client.force_login(self.user)
    
    @patch('stripe.Charge.create')
    def test_successful_stripe_payment(self, mock_charge_create):
        """Test successful Stripe payment processing"""
        # Mock the Stripe charge response
        mock_charge = MagicMock()
        mock_charge.id = 'ch_test123456'
        mock_charge_create.return_value = mock_charge
        
        # Make the API request
        url = reverse('payment-process-stripe', args=[self.payment.id])
        data = {'payment_token': 'tok_visa'}
        response = self.client.post(url, data, content_type='application/json')
        
        # Check response
        self.assertEqual(response.status_code, 200)
        
        # Verify payment was updated
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'completed')
        self.assertEqual(self.payment.transaction_id, 'ch_test123456')
        
        # Verify credits were added
        self.user_credit.refresh_from_db()
        self.assertEqual(self.user_credit.balance, self.credit_package.credit_amount)
    
    @patch('stripe.Charge.create')
    def test_failed_stripe_payment(self, mock_charge_create):
        """Test failed Stripe payment processing"""
        # Mock a Stripe card error
        mock_charge_create.side_effect = stripe.error.CardError(
            "Your card was declined.",
            "param",
            "code"
        )
        
        # Make the API request
        url = reverse('payment-process-stripe', args=[self.payment.id])
        data = {'payment_token': 'tok_chargeDeclined'}
        response = self.client.post(url, data, content_type='application/json')
        
        # Check response
        self.assertEqual(response.status_code, 400)
        
        # Verify payment was marked as failed
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'failed')
        
        # Verify no credits were added
        self.user_credit.refresh_from_db()
        self.assertEqual(self.user_credit.balance, 0)


class CreditTransactionTests(TestCase):
    """Unit tests for credit transactions"""
    
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='credituser',
            email='credit@example.com',
            password='testpassword',
            first_name='Credit',
            last_name='User',
            role='consumer'
        )
        
        # Create user credit
        self.user_credit = UserCredit.objects.create(
            user=self.user,
            balance=500,
            lifetime_earned=500,
            lifetime_spent=0
        )
    
    def test_add_credits(self):
        """Test adding credits to user balance"""
        initial_balance = self.user_credit.balance
        amount_to_add = 100
        
        # Add credits
        new_balance = self.user_credit.add_credits(amount_to_add)
        
        # Verify balance was updated
        self.assertEqual(new_balance, initial_balance + amount_to_add)
        
        # Verify lifetime earned was updated
        self.user_credit.refresh_from_db()
        self.assertEqual(self.user_credit.lifetime_earned, 500 + amount_to_add)
        
        # Verify transaction was created
        transactions = self.user.credit_transactions.filter(type='purchase')
        self.assertEqual(transactions.count(), 1)
        self.assertEqual(transactions.first().amount, amount_to_add)
    
    def test_use_credits(self):
        """Test using credits from user balance"""
        initial_balance = self.user_credit.balance
        amount_to_use = 50
        
        # Use credits
        new_balance = self.user_credit.use_credits(amount_to_use, "Test booking")
        
        # Verify balance was updated
        self.assertEqual(new_balance, initial_balance - amount_to_use)
        
        # Verify lifetime spent was updated
        self.user_credit.refresh_from_db()
        self.assertEqual(self.user_credit.lifetime_spent, 0 + amount_to_use)
        
        # Verify transaction was created
        transactions = self.user.credit_transactions.filter(type='booking')
        self.assertEqual(transactions.count(), 1)
        self.assertEqual(transactions.first().amount, -amount_to_use)
    
    def test_insufficient_credits(self):
        """Test using more credits than available"""
        initial_balance = self.user_credit.balance
        amount_to_use = initial_balance + 100
        
        # Attempt to use more credits than available
        with self.assertRaises(ValueError):
            self.user_credit.use_credits(amount_to_use, "Test booking")
        
        # Verify balance was not changed
        self.user_credit.refresh_from_db()
        self.assertEqual(self.user_credit.balance, initial_balance)
        
        # Verify no transaction was created
        transactions = self.user.credit_transactions.filter(type='booking')
        self.assertEqual(transactions.count(), 0)
    
    def test_refund_credits(self):
        """Test refunding credits to user balance"""
        # First use some credits
        amount_to_use = 100
        self.user_credit.use_credits(amount_to_use, "Test booking")
        
        # Get balance after using credits
        balance_after_use = self.user_credit.balance
        
        # Refund credits
        amount_to_refund = 50
        new_balance = self.user_credit.refund_credits(amount_to_refund, "Test refund")
        
        # Verify balance was updated
        self.assertEqual(new_balance, balance_after_use + amount_to_refund)
        
        # Verify lifetime spent was updated
        self.user_credit.refresh_from_db()
        self.assertEqual(self.user_credit.lifetime_spent, amount_to_use - amount_to_refund)
        
        # Verify transaction was created
        transactions = self.user.credit_transactions.filter(type='refund')
        self.assertEqual(transactions.count(), 1)
        self.assertEqual(transactions.first().amount, amount_to_refund)


if __name__ == '__main__':
    unittest.main()
