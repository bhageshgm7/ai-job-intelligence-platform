from rest_framework import serializers
from .models import Application
from jobs.models import Job
from jobs.serializers import JobSerializer
from resumes.models import Resume
from resumes.serializers import ResumeSerializer

class ApplicationSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    job_details = JobSerializer(source='job', read_only=True)
    resume_details = ResumeSerializer(source='resume', read_only=True)

    job_id = serializers.PrimaryKeyRelatedField(
        queryset=Job.objects.all(),
        source='job',
        write_only=True
    )
    resume_id = serializers.PrimaryKeyRelatedField(
        queryset=Resume.objects.all(),
        source='resume',
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Application
        fields = (
            'id', 'user', 'job', 'job_id', 'job_details',
            'resume', 'resume_id', 'resume_details',
            'status', 'applied_date', 'interview_date',
            'notes', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'job', 'resume', 'created_at', 'updated_at')

    def validate_job_id(self, value):
        user = self.context['request'].user
        if value.user != user:
            raise serializers.ValidationError("You cannot create an application for a job you do not own.")
        return value

    def validate_resume_id(self, value):
        if value is not None:
            user = self.context['request'].user
            if value.user != user:
                raise serializers.ValidationError("You cannot associate a resume you do not own.")
        return value

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
