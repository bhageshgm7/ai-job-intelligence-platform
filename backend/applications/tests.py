from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from jobs.models import Job
from resumes.models import Resume
from applications.models import Application

User = get_user_model()

class ApplicationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_a = User.objects.create_user(username='app_user_a', email='ua@example.com', password='Password123!')
        self.user_b = User.objects.create_user(username='app_user_b', email='ub@example.com', password='Password123!')

        self.job_a = Job.objects.create(user=self.user_a, company_name='Stripe', job_title='Backend Eng', description='Python Django')
        self.job_b = Job.objects.create(user=self.user_b, company_name='Netflix', job_title='SRE', description='Kubernetes')
        self.resume_a = Resume.objects.create(user=self.user_a, title='My Resume', extracted_text='Python')

    def test_application_lifecycle_and_ownership(self):
        self.client.force_authenticate(user=self.user_a)

        # 1. Successful creation
        payload = {
            'job_id': self.job_a.id,
            'resume_id': self.resume_a.id,
            'status': 'APPLIED',
            'notes': 'Applied via referral.'
        }
        res = self.client.post('/api/applications/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        app_id = res.data['id']
        self.assertEqual(res.data['status'], 'APPLIED')

        # 2. Cannot associate another user's job
        bad_payload = {
            'job_id': self.job_b.id,
            'status': 'SAVED'
        }
        bad_res = self.client.post('/api/applications/', bad_payload, format='json')
        self.assertEqual(bad_res.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Update status to INTERVIEW
        patch_res = self.client.patch(f'/api/applications/{app_id}/', {'status': 'INTERVIEW'}, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['status'], 'INTERVIEW')

        # 4. Filter by status
        filter_res = self.client.get('/api/applications/?status=INTERVIEW')
        self.assertEqual(len(filter_res.data), 1)

        # 5. User B cannot see User A's application
        self.client.force_authenticate(user=self.user_b)
        res_b = self.client.get('/api/applications/')
        self.assertEqual(len(res_b.data), 0)
