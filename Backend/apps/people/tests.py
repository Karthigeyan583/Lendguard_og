from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from apps.people.models import Person, BankAccount


class BankAccountComplianceTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_person_with_valid_indian_bank_account(self):
        payload = {
            "first_name": "Rohan",
            "last_name": "Sharma",
            "mobile": "+91 9876543210",
            "email": "rohan@example.com",
            "relationship": "friend",
            "bank_accounts": [
                {
                    "country": "IN",
                    "bank_name": "HDFC Bank",
                    "account_holder_name": "Rohan Sharma",
                    "account_number": "50100234567890",
                    "ifsc_code": "HDFC0001234",
                    "upi_id": "rohan@okhdfcbank",
                    "account_type": "savings",
                    "is_primary": True
                }
            ]
        }
        response = self.client.post('/api/v1/people/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        person_id = response.data['id']
        self.assertEqual(BankAccount.objects.filter(person_id=person_id).count(), 1)
        bank = BankAccount.objects.get(person_id=person_id)
        self.assertEqual(bank.ifsc_code, "HDFC0001234")
        self.assertTrue(bank.is_primary)

    def test_create_person_fails_without_bank_account(self):
        payload = {
            "first_name": "Anita",
            "last_name": "Deshmukh",
            "mobile": "+91 9876543211",
            "email": "anita@example.com",
            "relationship": "colleague",
            "bank_accounts": []
        }
        response = self.client.post('/api/v1/people/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("bank_accounts", response.data)

    def test_create_person_fails_with_more_than_3_bank_accounts(self):
        payload = {
            "first_name": "Vikram",
            "last_name": "Patel",
            "mobile": "+91 9876543212",
            "email": "vikram@example.com",
            "relationship": "business",
            "bank_accounts": [
                {"country": "IN", "bank_name": "Bank 1", "account_holder_name": "Vikram", "account_number": "1234567890", "ifsc_code": "SBIN0001234"},
                {"country": "IN", "bank_name": "Bank 2", "account_holder_name": "Vikram", "account_number": "1234567891", "ifsc_code": "ICIC0001234"},
                {"country": "IN", "bank_name": "Bank 3", "account_holder_name": "Vikram", "account_number": "1234567892", "ifsc_code": "HDFC0001234"},
                {"country": "IN", "bank_name": "Bank 4", "account_holder_name": "Vikram", "account_number": "1234567893", "ifsc_code": "UTIB0001234"},
            ]
        }
        response = self.client.post('/api/v1/people/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("bank_accounts", response.data)

    def test_multi_country_bank_accounts_up_to_3(self):
        payload = {
            "first_name": "Alexander",
            "last_name": "Wright",
            "mobile": "+44 7911123456",
            "email": "alex@example.co.uk",
            "relationship": "business",
            "bank_accounts": [
                {
                    "country": "GB",
                    "bank_name": "Barclays UK",
                    "account_holder_name": "Alexander Wright",
                    "account_number": "12345678",
                    "sort_code": "204577",
                    "is_primary": True
                },
                {
                    "country": "US",
                    "bank_name": "Chase Bank",
                    "account_holder_name": "Alexander Wright",
                    "account_number": "9876543210",
                    "routing_number": "021000021",
                    "is_primary": False
                },
                {
                    "country": "EU",
                    "bank_name": "Deutsche Bank",
                    "account_holder_name": "Alexander Wright",
                    "account_number": "DE89370400440532013000",
                    "iban": "DE89370400440532013000",
                    "is_primary": False
                }
            ]
        }
        response = self.client.post('/api/v1/people/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        person_id = response.data['id']
        self.assertEqual(BankAccount.objects.filter(person_id=person_id).count(), 3)
