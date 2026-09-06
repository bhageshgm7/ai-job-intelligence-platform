from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
from .models import Resume
from .serializers import ResumeSerializer
from ai_assistant.ollama_service import query_ollama

class ResumeListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ResumeSerializer

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class ResumeDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ResumeSerializer

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)


class ResumeSetActiveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            raise NotFound("Resume not found.")

        # Deactivate other resumes
        Resume.objects.filter(user=request.user, is_active=True).exclude(pk=resume.pk).update(is_active=False)
        resume.is_active = True
        resume.save()

        serializer = ResumeSerializer(resume, context={'request': request})
        return Response({
            'message': f"'{resume.title}' is now set as your active resume.",
            'resume': serializer.data
        }, status=status.HTTP_200_OK)


class ResumeImproveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            raise NotFound("Resume not found.")

        resume_text = resume.extracted_text.strip()
        if not resume_text or len(resume_text) < 50:
            return Response({
                'error': 'The resume text is too short or empty to provide meaningful analysis.'
            }, status=status.HTTP_400_BAD_REQUEST)

        prompt = f"""You are an elite Tech Career Coach and ATS Resume Optimization Specialist.
Review the following resume content and provide actionable, rigorous improvement advice.

RESUME CONTENT:
\"\"\"
{resume_text[:4000]}
\"\"\"

Please structure your output with the following exact Markdown sections:
### 1. ATS Friendliness & Formatting
Evaluate parsing ease, section headers, readability, and missing standard sections.

### 2. Measurable Achievements & Impact
Highlight where quantified results (metrics, percentages, scale, revenue, time saved) should replace passive task descriptions. Provide 2-3 specific before/after bullet rewrites.

### 3. Technical Skills Presentation
Assess skill grouping, modern tech stack visibility, and recommendations for better categorization (e.g. Languages, Frameworks, Cloud/DevOps).

### 4. Weak Wording & Power Verbs
Identify vague or passive verbs (e.g., "worked on", "responsible for", "assisted with") and replace them with strong action verbs (e.g., "architected", "streamlined", "spearheaded").

### 5. High-Priority Action Checklist
List 4-5 immediate, highest-impact changes the candidate should make today.
"""

        ai_response = query_ollama(prompt, system_instruction="You are an expert technical resume reviewer. Provide concise, direct, high-value advice.")

        if ai_response.get('error'):
            # Graceful fallback heuristic advice if Ollama is offline
            fallback_feedback = (
                "### 1. ATS Friendliness & Formatting\n"
                "- Keep section titles clean and standard (e.g., 'Work Experience', 'Education', 'Technical Skills').\n"
                "- Avoid multi-column layouts or complex tables that ATS scanners can fail to parse.\n\n"
                "### 2. Measurable Achievements & Impact\n"
                "- Shift from duty-oriented bullets to impact-oriented statements using the formula: *Accomplished [X] as measured by [Y] by doing [Z]*.\n"
                "- Include quantitative metrics (e.g., latency reduction %, API traffic volume, database query optimization).\n\n"
                "### 3. Technical Skills Presentation\n"
                "- Group technical skills into distinct categories: Languages, Frameworks, Databases, Cloud & Tools.\n"
                "- Place technical skills near the top for quick recruiter visibility.\n\n"
                "### 4. Weak Wording & Power Verbs\n"
                "- Replace passive phrases like 'Responsible for maintaining' with 'Engineered', 'Orchestrated', or 'Optimized'.\n\n"
                "### 5. High-Priority Action Checklist\n"
                "1. Quantify at least 3 bullet points with tangible metrics.\n"
                "2. Standardize technical terminology.\n"
                "3. Verify contact details and GitHub/LinkedIn links."
            )
            return Response({
                'suggestions': fallback_feedback,
                'ai_status': 'offline',
                'notice': 'Generated via standard resume optimization heuristics (Ollama offline).'
            })

        return Response({
            'suggestions': ai_response.get('text', ''),
            'ai_status': 'online',
            'model': ai_response.get('model', 'ollama')
        })
