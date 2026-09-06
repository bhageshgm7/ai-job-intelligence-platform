from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from jobs.models import Job

User = get_user_model()

class JobAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_a = User.objects.create_user(username='job_user_a', email='ja@example.com', password='Password123!')
        self.user_b = User.objects.create_user(username='job_user_b', email='jb@example.com', password='Password123!')

    def test_job_crud_and_isolation(self):
        self.client.force_authenticate(user=self.user_a)

        payload = {
            'company_name': 'TechCorp',
            'job_title': 'Python Backend Lead',
            'description': 'We need a Django expert with Docker, PostgreSQL, and AWS.',
            'location': 'Remote',
            'employment_type': 'Full-time',
            'salary': '$130k - $150k',
            'required_skills': ['Python', 'Django', 'PostgreSQL', 'Docker', 'AWS']
        }

        # Create
        res = self.client.post('/api/jobs/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        job_id = res.data['id']
        self.assertEqual(res.data['company_name'], 'TechCorp')

        # List
        list_res = self.client.get('/api/jobs/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data), 1)

        # Search
        search_res = self.client.get('/api/jobs/?search=Backend')
        self.assertEqual(len(search_res.data), 1)
        search_miss = self.client.get('/api/jobs/?search=Marketing')
        self.assertEqual(len(search_miss.data), 0)

        # User B isolation
        self.client.force_authenticate(user=self.user_b)
        res_b = self.client.get('/api/jobs/')
        self.assertEqual(len(res_b.data), 0)

        put_res = self.client.put(f'/api/jobs/{job_id}/', {'job_title': 'Hacked Title'}, format='json')
        self.assertEqual(put_res.status_code, status.HTTP_404_NOT_FOUND)
