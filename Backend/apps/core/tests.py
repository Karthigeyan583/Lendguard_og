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
