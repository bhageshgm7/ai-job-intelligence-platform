from collections import Counter
from django.db.models import Avg, Count
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from applications.models import Application
from applications.serializers import ApplicationSerializer
from jobs.models import Job
from matching.models import MatchAnalysis

class DashboardOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # 1. Summary metric counts
        total_applications = Application.objects.filter(user=user).count()
        saved_jobs = Job.objects.filter(user=user).count()
        interviews = Application.objects.filter(user=user, status='INTERVIEW').count()
        offers = Application.objects.filter(user=user, status='OFFER').count()
        rejected = Application.objects.filter(user=user, status='REJECTED').count()

        avg_score_res = MatchAnalysis.objects.filter(user=user).aggregate(avg=Avg('overall_score'))
        avg_score = round(avg_score_res['avg'], 1) if avg_score_res['avg'] is not None else 0.0

        # 2. Applications by status
        status_counts = dict(
            Application.objects.filter(user=user)
            .values('status')
            .annotate(total=Count('id'))
            .values_list('status', 'total')
        )

        all_statuses = ['SAVED', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN']
        applications_by_status = [
            {'status': s, 'count': status_counts.get(s, 0)}
            for s in all_statuses
        ]

        # 3. Recent applications
        recent_apps_qs = Application.objects.filter(user=user).select_related('job', 'resume').order_by('-created_at')[:5]
        recent_applications = ApplicationSerializer(recent_apps_qs, many=True, context={'request': request}).data

        # 4. Upcoming interviews
        upcoming_interviews_qs = Application.objects.filter(
            user=user,
            interview_date__isnull=False
        ).select_related('job').order_by('interview_date')[:5]
        upcoming_interviews = ApplicationSerializer(upcoming_interviews_qs, many=True, context={'request': request}).data

        # 5. Top missing skills aggregation from match analyses
        all_analyses = MatchAnalysis.objects.filter(user=user).only('missing_skills')
        missing_skills_counter = Counter()
        for analysis in all_analyses:
            if isinstance(analysis.missing_skills, list):
                missing_skills_counter.update(analysis.missing_skills)

        top_missing_skills = [
            {'skill': skill, 'count': count}
            for skill, count in missing_skills_counter.most_common(8)
        ]

        # 6. Recent match scores for chart
        recent_matches_qs = MatchAnalysis.objects.filter(user=user).select_related('job').order_by('created_at')[:8]
        match_scores_overview = [
            {
                'job_title': f"{m.job.job_title[:15]}..." if len(m.job.job_title) > 15 else m.job.job_title,
                'score': m.overall_score
            }
            for m in recent_matches_qs
        ]

        return Response({
            'total_applications': total_applications,
            'saved_jobs': saved_jobs,
            'interviews': interviews,
            'offers': offers,
            'rejected_applications': rejected,
            'average_match_score': avg_score,
            'applications_by_status': applications_by_status,
            'recent_applications': recent_applications,
            'upcoming_interviews': upcoming_interviews,
            'top_missing_skills': top_missing_skills,
            'match_scores_overview': match_scores_overview,
        })
