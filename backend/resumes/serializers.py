from rest_framework import serializers
from .models import Resume
from .utils import extract_text_from_pdf, validate_pdf_file

class ResumeSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = (
            'id', 'user', 'title', 'file', 'file_url',
            'extracted_text', 'uploaded_at', 'updated_at', 'is_active'
        )
        read_only_fields = ('id', 'user', 'extracted_text', 'uploaded_at', 'updated_at')

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def validate_file(self, value):
        validate_pdf_file(value)
        return value

    def create(self, validated_data):
        file_obj = validated_data.get('file')
        user = self.context['request'].user
        extracted_text = extract_text_from_pdf(file_obj)

        # Check if user already has an active resume; if not, make this one active
        has_active = Resume.objects.filter(user=user, is_active=True).exists()
        is_active = validated_data.get('is_active', not has_active)

        resume = Resume.objects.create(
            user=user,
            title=validated_data['title'],
            file=file_obj,
            extracted_text=extracted_text,
            is_active=is_active
        )
        return resume
