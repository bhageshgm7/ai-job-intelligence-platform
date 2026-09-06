from django.db import models
from django.conf import settings
from resumes.models import Resume
from jobs.models import Job

class MatchAnalysis(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='match_analyses'
    )
    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name='match_analyses'
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='match_analyses'
    )
    overall_score = models.FloatField()
    matching_skills = models.JSONField(default=list)
    missing_skills = models.JSONField(default=list)
    recommendations = models.JSONField(default=list)
    ai_summary = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'job']),
        ]

    def __str__(self):
        return f"Match: {self.resume.title} vs {self.job.job_title} ({self.overall_score}%)"
