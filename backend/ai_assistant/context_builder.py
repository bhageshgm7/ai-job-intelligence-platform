from resumes.models import Resume
from jobs.models import Job
from applications.models import Application
from matching.models import MatchAnalysis

def build_user_career_context(user) -> str:
    """
    Builds a rich textual summary of user data to inject as context for the AI Career Assistant.
    """
    context_lines = []

    # 1. User details
    full_name = f"{user.first_name} {user.last_name}".strip() or user.username
    context_lines.append(f"Candidate Name: {full_name}")

    # 2. Active Resume
    active_resume = Resume.objects.filter(user=user, is_active=True).first()
    if not active_resume:
        active_resume = Resume.objects.filter(user=user).first()

    if active_resume:
        context_lines.append(f"Active Resume: '{active_resume.title}'")
        extracted_snippet = (active_resume.extracted_text or '')[:1200]
        context_lines.append(f"Resume Snippet:\n\"\"\"\n{extracted_snippet}\n\"\"\"")
    else:
        context_lines.append("Active Resume: None uploaded yet.")

    # 3. Recent Applications
    recent_apps = Application.objects.filter(user=user).select_related('job')[:5]
    if recent_apps:
        context_lines.append("\nRecent Job Applications:")
        for app in recent_apps:
            context_lines.append(f"- {app.job.job_title} at {app.job.company_name} (Status: {app.status})")
    else:
        context_lines.append("\nRecent Job Applications: None tracked yet.")

    # 4. Saved Jobs
    saved_jobs = Job.objects.filter(user=user)[:5]
    if saved_jobs:
        context_lines.append("\nTarget / Saved Jobs:")
        for j in saved_jobs:
            req_str = ", ".join(j.required_skills) if j.required_skills else "General"
            context_lines.append(f"- {j.job_title} at {j.company_name} | Required: {req_str}")

    # 5. Skill Gaps from recent match analyses
    recent_matches = MatchAnalysis.objects.filter(user=user).select_related('job')[:3]
    if recent_matches:
        context_lines.append("\nIdentified Missing Skill Gaps from Job Matches:")
        for m in recent_matches:
            if m.missing_skills:
                context_lines.append(f"- For {m.job.job_title}: Missing [{', '.join(m.missing_skills[:6])}]")

    return "\n".join(context_lines)
