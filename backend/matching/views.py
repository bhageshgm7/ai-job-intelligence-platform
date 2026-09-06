from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import MatchAnalysis
from .serializers import MatchRequestSerializer, MatchAnalysisSerializer
from .engine import calculate_deterministic_match, analyze_match_with_ai

class AnalyzeMatchView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MatchRequestSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        resume = serializer.validated_data['resume_id']
        job = serializer.validated_data['job_id']

        # 1. Deterministic skill extraction and baseline scoring
        match_data = calculate_deterministic_match(
            job_description=job.description,
            resume_text=resume.extracted_text,
            job_required_skills=job.required_skills
        )

        overall_score = match_data['overall_score']
        matching_skills = match_data['matching_skills']
        missing_skills = match_data['missing_skills']

        # 2. AI Qualitative Analysis via Ollama (with fallback)
        ai_insights = analyze_match_with_ai(
            job_title=job.job_title,
            company_name=job.company_name,
            job_desc=job.description,
            resume_text=resume.extracted_text,
            matching_skills=matching_skills,
            missing_skills=missing_skills,
            score=overall_score
        )

        # 3. Save MatchAnalysis record
        analysis = MatchAnalysis.objects.create(
            user=request.user,
            resume=resume,
            job=job,
            overall_score=overall_score,
            matching_skills=matching_skills,
            missing_skills=missing_skills,
            recommendations=ai_insights['recommendations'],
            ai_summary=ai_insights['ai_summary']
        )

        response_data = MatchAnalysisSerializer(analysis).data
        response_data['ai_status'] = ai_insights['ai_status']
        response_data['model'] = ai_insights.get('model')

        return Response(response_data, status=status.HTTP_201_CREATED)


class MatchHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MatchAnalysisSerializer

    def get_queryset(self):
        return MatchAnalysis.objects.filter(user=self.request.user).select_related('resume', 'job')


class MatchDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MatchAnalysisSerializer

    def get_queryset(self):
        return MatchAnalysis.objects.filter(user=self.request.user).select_related('resume', 'job')
