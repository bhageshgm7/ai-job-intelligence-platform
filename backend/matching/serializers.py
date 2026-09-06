from rest_framework import serializers
from .models import MatchAnalysis
from resumes.models import Resume
from resumes.serializers import ResumeSerializer
from jobs.models import Job
from jobs.serializers import JobSerializer

class MatchRequestSerializer(serializers.Serializer):
    resume_id = serializers.IntegerField(required=True)
    job_id = serializers.IntegerField(required=True)

    def validate_resume_id(self, value):
        user = self.context['request'].user
        try:
            resume = Resume.objects.get(pk=value, user=user)
        except Resume.DoesNotExist:
            raise serializers.ValidationError("Selected resume not found or does not belong to you.")
        return resume

    def validate_job_id(self, value):
        user = self.context['request'].user
        try:
            job = Job.objects.get(pk=value, user=user)
        except Job.DoesNotExist:
            raise serializers.ValidationError("Selected job not found or does not belong to you.")
        return job


class MatchAnalysisSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    resume_title = serializers.CharField(source='resume.title', read_only=True)
    job_title = serializers.CharField(source='job.job_title', read_only=True)
    company_name = serializers.CharField(source='job.company_name', read_only=True)

    class Meta:
        model = MatchAnalysis
        fields = (
            'id', 'user', 'resume', 'resume_title', 'job', 'job_title',
            'company_name', 'overall_score', 'matching_skills',
            'missing_skills', 'recommendations', 'ai_summary', 'created_at'
        )
        read_only_fields = ('id', 'user', 'created_at')
