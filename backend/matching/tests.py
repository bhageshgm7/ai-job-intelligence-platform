from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from jobs.models import Job
from resumes.models import Resume
from matching.models import MatchAnalysis
from matching.engine import calculate_deterministic_match, extract_skills_from_text

User = get_user_model()

class MatchingEngineAndAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='match_tester', email='m@example.com', password='Password123!')
        self.other_user = User.objects.create_user(username='other_tester', email='o@example.com', password='Password123!')

        self.resume = Resume.objects.create(
            user=self.user,
            title='Fullstack Resume',
            extracted_text='Proficient in Python, Django, React, PostgreSQL, Git, and REST API development.'
        )

        self.job = Job.objects.create(
            user=self.user,
            company_name='NextGen AI',
            job_title='Full Stack Django Engineer',
            description='Looking for Python, Django, React, Docker, and AWS skills.',
            required_skills=['Python', 'Django', 'React', 'Docker', 'AWS']
        )

    def test_skill_extraction_and_scoring(self):
        resume_skills = extract_skills_from_text(self.resume.extracted_text)
        self.assertIn('Python', resume_skills)
        self.assertIn('Django', resume_skills)
        self.assertIn('React', resume_skills)
        self.assertIn('PostgreSQL', resume_skills)

        result = calculate_deterministic_match(
            job_description=self.job.description,
            resume_text=self.resume.extracted_text,
            job_required_skills=self.job.required_skills
        )

        # 3 matching: Python, Django, React. 2 missing: Docker, AWS. Total job skills: 5.
        self.assertEqual(result['matching_skills'], ['Django', 'Python', 'React'])
        self.assertEqual(result['missing_skills'], ['AWS', 'Docker'])
        self.assertEqual(result['overall_score'], 60.0)

    def test_analyze_endpoint_success(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            'resume_id': self.resume.id,
            'job_id': self.job.id
        }
        res = self.client.post('/api/matching/analyze/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['overall_score'], 60.0)
        self.assertEqual(res.data['matching_skills'], ['Django', 'Python', 'React'])
        self.assertEqual(res.data['missing_skills'], ['AWS', 'Docker'])
        self.assertIn('recommendations', res.data)
        self.assertIn('ai_summary', res.data)
        self.assertTrue(MatchAnalysis.objects.filter(id=res.data['id']).exists())

    def test_analyze_endpoint_isolation(self):
        self.client.force_authenticate(user=self.other_user)
        payload = {
            'resume_id': self.resume.id,
            'job_id': self.job.id
        }
        res = self.client.post('/api/matching/analyze/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
