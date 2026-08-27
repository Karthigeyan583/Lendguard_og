from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from apps.people.models import Person
from apps.loans.models import Loan


class HealthCheckTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_check_endpoint(self):
        url = reverse('health-check')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('status'), 'healthy')
        self.assertEqual(response.data.get('service'), 'LendGuard Lending Ledger API')


class DataExportTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='export_tester',
            email='export@lendguard.io',
            password='Password123!'
        )
        self.client.force_authenticate(user=self.user)
        self.person = Person.objects.create(
            created_by=self.user,
            name='Test Borrower',
            relationship='friend'
        )
        self.loan = Loan.objects.create(
            created_by=self.user,
            person=self.person,
            loan_reference='LG-2026-TEST-001',
            principal_amount=10000,
            currency='INR',
            date_given='2026-08-01',
            status='OPEN'
        )

    def test_data_export(self):
        url = reverse('data-export')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('metadata', response.data)
        self.assertIn('sha256_checksum', response.data)
        self.assertEqual(len(response.data['people']), 1)
        self.assertEqual(len(response.data['loans']), 1)
        self.assertEqual(response.data['people'][0]['name'], 'Test Borrower')

    def test_data_purge(self):
        url = reverse('data-purge')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Person.objects.filter(created_by=self.user).count(), 0)
        self.assertEqual(Loan.objects.filter(created_by=self.user).count(), 0)


class CurrencyTickerTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='ticker_tester',
            email='ticker@lendguard.io',
            password='Password123!'
        )
        self.client.force_authenticate(user=self.user)
        self.person = Person.objects.create(
            created_by=self.user,
            name='Multi Currency Borrower',
            relationship='colleague'
        )
        # Create a loan in USD to verify active ledger detection
        self.loan_usd = Loan.objects.create(
            created_by=self.user,
            person=self.person,
            loan_reference='LG-2026-USD-001',
            principal_amount=5000,
            currency='USD',
            date_given='2026-08-01',
            status='OPEN'
        )

    def test_ticker_default_reporting_currency(self):
        url = reverse('currency-ticker')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('reporting_currency'), 'INR')
        self.assertTrue(response.data.get('is_live'))
        self.assertIn('rates', response.data)
        
        rates = response.data['rates']
        usd_inr = next((r for r in rates if r['pair'] == 'USD/INR'), None)
        self.assertIsNotNone(usd_inr)
        self.assertEqual(usd_inr['rate'], 90.0)
        self.assertTrue(usd_inr['is_used_in_ledger'])

    def test_ticker_dynamic_target_reporting_currency(self):
        url = f"{reverse('currency-ticker')}?reporting_currency=EUR"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('reporting_currency'), 'EUR')
        
        rates = response.data['rates']
        # Pairs should be <CURRENCY>/EUR
        self.assertTrue(all(r['to_currency'] == 'EUR' for r in rates))
        
        usd_eur = next((r for r in rates if r['pair'] == 'USD/EUR'), None)
        self.assertIsNotNone(usd_eur)
        # 1 USD (90 INR) / 1 EUR (98 INR) = ~0.918367
        self.assertAlmostEqual(usd_eur['rate'], 90.0 / 98.0, places=4)
        self.assertTrue(usd_eur['is_used_in_ledger'])

    def test_ticker_stale_or_invalid_currency_fallback(self):
        url = f"{reverse('currency-ticker')}?reporting_currency=INVALID_XYZ"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Gracefully falls back to INR
        self.assertEqual(response.data.get('reporting_currency'), 'INR')

    def test_historical_transaction_isolation(self):
        # Ensure that calling live ticker never mutates stored loan data
        url = f"{reverse('currency-ticker')}?reporting_currency=GBP"
        self.client.get(url)
        
        self.loan_usd.refresh_from_db()
        self.assertEqual(self.loan_usd.currency, 'USD')
        self.assertEqual(float(self.loan_usd.principal_amount), 5000.0)

