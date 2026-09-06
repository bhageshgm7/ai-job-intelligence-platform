from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from resumes.models import Resume
from jobs.models import Job
from ai_assistant.models import AIConversation
from ai_assistant.context_builder import build_user_career_context

User = get_user_model()

class AIAssistantTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='ai_user', email='ai@example.com', first_name='Alex', last_name='Smith', password='Password123!')
        self.other_user = User.objects.create_user(username='other_ai_user', email='other_ai@example.com', password='Password123!')

        Resume.objects.create(user=self.user, title='Software Architect CV', extracted_text='Python Django React microservices', is_active=True)
        Job.objects.create(user=self.user, company_name='OpenAI', job_title='AI Platform Engineer', description='Python FastAPI')

    def test_context_builder(self):
        context = build_user_career_context(self.user)
        self.assertIn("Alex Smith", context)
        self.assertIn("Software Architect CV", context)
        self.assertIn("OpenAI", context)

    def test_history_and_isolation(self):
        conv1 = AIConversation.objects.create(user=self.user, question='How to learn Django?', answer='Start with official docs.')
        conv_other = AIConversation.objects.create(user=self.other_user, question='Secret question', answer='Secret answer')

        self.client.force_authenticate(user=self.user)
        res = self.client.get('/api/ai/history/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['question'], 'How to learn Django?')

        # Clear history
        del_res = self.client.delete('/api/ai/history/')
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        self.assertEqual(AIConversation.objects.filter(user=self.user).count(), 0)
        # Other user's conv untouched
        self.assertEqual(AIConversation.objects.filter(user=self.other_user).count(), 1)
