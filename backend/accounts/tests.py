from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

class AccountsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'
        self.profile_url = '/api/auth/profile/'

    def test_user_registration_success(self):
        payload = {
            'username': 'candidate1',
            'email': 'candidate1@example.com',
            'password': 'Password123!',
            'confirm_password': 'Password123!',
            'first_name': 'Jane',
            'last_name': 'Doe'
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['username'], 'candidate1')
        self.assertTrue(User.objects.filter(username='candidate1').exists())

    def test_registration_password_mismatch(self):
        payload = {
            'username': 'candidate2',
            'email': 'candidate2@example.com',
            'password': 'Password123!',
            'confirm_password': 'DifferentPassword!',
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_duplicate_email(self):
        User.objects.create_user(username='existing', email='existing@example.com', password='Password123!')
        payload = {
            'username': 'newuser',
            'email': 'existing@example.com',
            'password': 'Password123!',
            'confirm_password': 'Password123!'
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_and_profile_retrieval(self):
        user = User.objects.create_user(username='testuser', email='test@example.com', password='Password123!')
        login_res = self.client.post(self.login_url, {'username': 'testuser', 'password': 'Password123!'}, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access_token = login_res.data['access']

        # Profile authenticated
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        profile_res = self.client.get(self.profile_url)
        self.assertEqual(profile_res.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_res.data['username'], 'testuser')
