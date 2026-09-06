import re
from .skill_dictionary import SKILL_CATALOG
from ai_assistant.ollama_service import query_ollama

def normalize_text(text: str) -> str:
    """Lowercases and cleans text for robust keyword matching."""
    if not text:
        return ""
    return text.lower()

def extract_skills_from_text(text: str, extra_skills: list = None) -> set:
    """
    Extracts canonical skill names from text using the catalog and regex word boundaries.
    Also incorporates any explicitly specified extra skills.
    """
    found_skills = set()
    cleaned_text = normalize_text(text)

    # 1. Search against SKILL_CATALOG
    for canonical_name, aliases in SKILL_CATALOG.items():
        for alias in aliases:
            # Check if alias already contains regex escape
            if alias.startswith('\\b') or '\\+' in alias or '#' in alias:
                pattern = alias
            else:
                pattern = r'(?<![a-zA-Z0-9])' + re.escape(alias) + r'(?![a-zA-Z0-9])'

            if re.search(pattern, cleaned_text, re.IGNORECASE):
                found_skills.add(canonical_name)
                break

    # 2. Check extra skills (e.g. from job required_skills list)
    if extra_skills:
        for skill in extra_skills:
            skill_clean = str(skill).strip()
            if not skill_clean:
                continue

            # Check if skill matches canonical
            matched_canonical = None
            for c_name, aliases in SKILL_CATALOG.items():
                if skill_clean.lower() == c_name.lower() or skill_clean.lower() in [a.lower() for a in aliases]:
                    matched_canonical = c_name
                    break

            target_skill = matched_canonical or skill_clean
            pattern = r'(?<![a-zA-Z0-9])' + re.escape(skill_clean.lower()) + r'(?![a-zA-Z0-9])'
            if re.search(pattern, cleaned_text, re.IGNORECASE):
                found_skills.add(target_skill)

    return found_skills

def calculate_deterministic_match(job_description: str, resume_text: str, job_required_skills: list = None) -> dict:
    """
    Performs purely deterministic skill extraction and baseline score calculation.
    """
    # 1. Determine job skills (from required_skills list + job description)
    explicit_skills = set()
    if job_required_skills:
        for s in job_required_skills:
            # Map to canonical if present
            s_clean = str(s).strip()
            matched = False
            for c_name, aliases in SKILL_CATALOG.items():
                if s_clean.lower() == c_name.lower() or s_clean.lower() in [a.lower() for a in aliases]:
                    explicit_skills.add(c_name)
                    matched = True
                    break
            if not matched and s_clean:
                explicit_skills.add(s_clean)

    extracted_job_skills = extract_skills_from_text(job_description, extra_skills=job_required_skills or [])
    all_job_skills = explicit_skills.union(extracted_job_skills)

    # 2. Extract skills from resume
    resume_skills = extract_skills_from_text(resume_text)

    # 3. Compute overlap
    matching_skills = sorted(list(all_job_skills.intersection(resume_skills)))
    missing_skills = sorted(list(all_job_skills.difference(resume_skills)))

    # 4. Calculate score
    if all_job_skills:
        score = round((len(matching_skills) / len(all_job_skills)) * 100, 1)
    else:
        # If job didn't list specific technical skills, use reasonable baseline
        score = 65.0 if resume_skills else 50.0

    score = max(0.0, min(100.0, score))

    return {
        'overall_score': score,
        'matching_skills': matching_skills,
        'missing_skills': missing_skills,
        'job_skills': sorted(list(all_job_skills)),
        'resume_skills': sorted(list(resume_skills))
    }

def generate_fallback_recommendations(missing_skills: list, matching_skills: list, job_title: str) -> list:
    """Generates structured, practical heuristic recommendations when AI service is offline."""
    recs = []
    if missing_skills:
        for skill in missing_skills[:4]:
            recs.append(f"Acquire hands-on project experience with {skill} and add a dedicated section or bullet to your resume.")
        recs.append(f"Highlight transferable competencies that complement {job_title} requirements.")
    else:
        recs.append(f"Strong skill alignment! Emphasize measurable achievements and scale for your matching skills: {', '.join(matching_skills[:5])}.")
        recs.append("Tailor your summary statement directly to the company mission.")
    return recs

def analyze_match_with_ai(job_title: str, company_name: str, job_desc: str, resume_text: str, matching_skills: list, missing_skills: list, score: float) -> dict:
    """
    Sends deterministic match results to Ollama for qualitative insights and tailored recommendations.
    Falls back gracefully to deterministic heuristics if Ollama is unreachable.
    """
    prompt = f"""You are a Technical Hiring Manager and Senior Recruiter evaluating a candidate's fit for an open role.

POSITION: {job_title} at {company_name}
DETERMINISTIC MATCH SCORE: {score}%
MATCHING SKILLS IDENTIFIED: {', '.join(matching_skills) if matching_skills else 'None identified'}
MISSING SKILLS IDENTIFIED: {', '.join(missing_skills) if missing_skills else 'None'}

JOB DESCRIPTION EXCERPT:
\"\"\"
{job_desc[:1500]}
\"\"\"

RESUME EXCERPT:
\"\"\"
{resume_text[:1500]}
\"\"\"

Provide your analysis formatted as:
### SUMMARY
(A 2-3 sentence candid executive summary of how well this candidate fits the role and their strongest selling points)

### RECOMMENDATIONS
- Recommendation 1: (Actionable advice addressing missing skills or positioning)
- Recommendation 2: (Project or portfolio idea to demonstrate missing competencies)
- Recommendation 3: (Resume bullet enhancement tip tailored to this role)
"""

    system_instruction = "You are an objective, encouraging, and experienced tech career advisor."
    ai_result = query_ollama(prompt, system_instruction=system_instruction)

    if ai_result.get('error'):
        fallback_recs = generate_fallback_recommendations(missing_skills, matching_skills, job_title)
        return {
            'ai_summary': (
                f"Candidate matches {score}% of the target skills for {job_title} at {company_name}. "
                f"Strong foundation observed in: {', '.join(matching_skills[:4]) or 'general software engineering'}. "
                f"Closing key gaps in {', '.join(missing_skills[:3]) or 'specialized domains'} will maximize interview readiness."
            ),
            'recommendations': fallback_recs,
            'ai_status': 'offline',
            'model': 'deterministic-fallback'
        }

    # Parse AI response
    raw_text = ai_result.get('text', '')
    summary = ""
    recommendations = []

    if '### SUMMARY' in raw_text and '### RECOMMENDATIONS' in raw_text:
        parts = raw_text.split('### RECOMMENDATIONS')
        summary_part = parts[0].replace('### SUMMARY', '').strip()
        summary = summary_part
        rec_part = parts[1].strip()
        for line in rec_part.split('\n'):
            line_cleaned = line.strip().lstrip('-*0123456789. ')
            if line_cleaned:
                recommendations.append(line_cleaned)
    else:
        summary = raw_text.strip()
        recommendations = generate_fallback_recommendations(missing_skills, matching_skills, job_title)

    if not recommendations:
        recommendations = generate_fallback_recommendations(missing_skills, matching_skills, job_title)

    return {
        'ai_summary': summary,
        'recommendations': recommendations[:5],
        'ai_status': 'online',
        'model': ai_result.get('model')
    }
