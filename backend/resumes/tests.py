from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from resumes.models import Resume
import io
from pypdf import PdfWriter

User = get_user_model()

def create_sample_pdf(content="Experienced Python and Django Developer with React knowledge."):
    """Helper to generate a valid in-memory PDF."""
    buffer = io.BytesIO()
    writer = PdfWriter()
    page = writer.add_blank_page(width=200, height=200)
    # pypdf can create blank page or attach text via annotations/pages
    # To create a real PDF with text stream:
    writer.write(buffer)
    buffer.seek(0)
    return buffer.getvalue()

class ResumeAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_a = User.objects.create_user(username='user_a', email='a@example.com', password='Password123!')
        self.user_b = User.objects.create_user(username='user_b', email='b@example.com', password='Password123!')

    def test_resume_creation_and_isolation(self):
        self.client.force_authenticate(user=self.user_a)

        # Directly test Resume model and API isolation
        resume_a = Resume.objects.create(
            user=self.user_a,
            title='Senior Backend Resume',
            extracted_text='Python Django PostgreSQL Docker AWS REST API',
            is_active=True
        )

        res = self.client.get('/api/resumes/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['title'], 'Senior Backend Resume')

        # User B cannot see User A's resume
        self.client.force_authenticate(user=self.user_b)
        res_b = self.client.get('/api/resumes/')
        self.assertEqual(res_b.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_b.data), 0)

        # User B cannot delete User A's resume
        del_res = self.client.delete(f'/api/resumes/{resume_a.id}/')
        self.assertEqual(del_res.status_code, status.HTTP_404_NOT_FOUND)

    def test_active_resume_switch(self):
        self.client.force_authenticate(user=self.user_a)
        r1 = Resume.objects.create(user=self.user_a, title='Resume 1', extracted_text='text', is_active=True)
        r2 = Resume.objects.create(user=self.user_a, title='Resume 2', extracted_text='text', is_active=False)

        res = self.client.post(f'/api/resumes/{r2.id}/set-active/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        r1.refresh_from_db()
        r2.refresh_from_db()
        self.assertFalse(r1.is_active)
        self.assertTrue(r2.is_active)
