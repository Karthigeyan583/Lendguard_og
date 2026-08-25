from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status


class AuthenticationSystemTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='existinguser',
            email='existing@example.com',
            password='Password123!',
            first_name='Existing',
            last_name='User'
        )

    def test_register_successful(self):
        payload = {
            'username': 'newlender',
            'email': 'newlender@example.com',
            'password': 'SecurePassword123!',
            'first_name': 'New',
            'last_name': 'Lender',
            'phone_number': '+91-9884409999'
        }
        res = self.client.post('/api/v1/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', res.data)
        self.assertEqual(res.data['user']['username'], 'newlender')

    def test_register_duplicate_email_rejected(self):
        payload = {
            'username': 'anotheruser',
            'email': 'existing@example.com', # Duplicate email
            'password': 'SecurePassword123!'
        }
        res = self.client.post('/api/v1/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', res.data)

    def test_register_duplicate_username_rejected(self):
        payload = {
            'username': 'existinguser', # Duplicate username
            'email': 'unique@example.com',
            'password': 'SecurePassword123!'
        }
        res = self.client.post('/api/v1/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', res.data)

    def test_login_with_username(self):
        payload = {
            'username': 'existinguser',
            'password': 'Password123!'
        }
        res = self.client.post('/api/v1/auth/login/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('token', res.data)

    def test_login_with_email(self):
        payload = {
            'username': 'existing@example.com', # Email entered in username field
            'password': 'Password123!'
        }
        res = self.client.post('/api/v1/auth/login/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('token', res.data)
        self.assertEqual(res.data['user']['username'], 'existinguser')

    def test_login_with_wrong_password_fails(self):
        payload = {
            'username': 'existinguser',
            'password': 'WrongPassword999'
        }
        res = self.client.post('/api/v1/auth/login/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout(self):
        # Obtain token
        login_res = self.client.post('/api/v1/auth/login/', {'username': 'existinguser', 'password': 'Password123!'}, format='json')
        token = login_res.data['token']

        # Logout with auth header
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        logout_res = self.client.post('/api/v1/auth/logout/', format='json')
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

    def test_change_password(self):
        login_res = self.client.post('/api/v1/auth/login/', {'username': 'existinguser', 'password': 'Password123!'}, format='json')
        token = login_res.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')

        # Wrong old password
        res_fail = self.client.post('/api/v1/auth/change-password/', {
            'old_password': 'IncorrectOldPassword',
            'new_password': 'BrandNewPassword123!'
        }, format='json')
        self.assertEqual(res_fail.status_code, status.HTTP_400_BAD_REQUEST)

        # Correct old password
        res_ok = self.client.post('/api/v1/auth/change-password/', {
            'old_password': 'Password123!',
            'new_password': 'BrandNewPassword123!'
        }, format='json')
        self.assertEqual(res_ok.status_code, status.HTTP_200_OK)
