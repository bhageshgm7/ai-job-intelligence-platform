from rest_framework import serializers
from .models import Job

class JobSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Job
        fields = (
            'id', 'user', 'company_name', 'job_title', 'description',
            'location', 'employment_type', 'salary', 'job_url',
            'required_skills', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def validate_required_skills(self, value):
        if isinstance(value, str):
            # Split comma separated if string passed
            return [s.strip() for s in value.split(',') if s.strip()]
        elif isinstance(value, list):
            return [str(s).strip() for s in value if str(s).strip()]
        return []

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
