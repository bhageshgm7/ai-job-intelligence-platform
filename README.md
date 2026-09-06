# AI Job Intelligence Platform

An enterprise-grade, AI-powered job application tracker and resume intelligence platform built with **Django REST Framework**, **React + Vite**, and **local Ollama LLM** integration.

The platform empowers job seekers to manage multiple resume versions, parse text from uploaded PDFs, track active job applications across Kanban pipeline stages, deterministically evaluate resume-to-job match scores, uncover critical skill gaps, and interact with a context-aware AI Career Coach.

---

## Key Features

1. **Intelligent Resume Management**
   - PDF upload with validation (extension, mime-type, 10MB size limit).
   - Automated text extraction using `pypdf`.
   - Toggle active resume status across multiple document versions.
   - Extracted text inspection and full-fidelity preview.
   - **AI Resume Review**: On-demand structured critique covering ATS friendliness, bullet formatting, measurable achievements, weak verbs, and tech stack categorization.

2. **Job Opportunity Tracker**
   - Save target roles with company name, job title, employment type, location, salary range, job URL, required skills tags, and descriptions.
   - Real-time search and filter by employment type (Full-time, Part-time, Contract, Remote, Internship).
   - Direct shortcuts to match against your active resume or log to the application tracker.

3. **Application Pipeline Tracker (Dual View)**
   - **Interactive Kanban Board**: Columns for `SAVED`, `APPLIED`, `SCREENING`, `INTERVIEW`, `OFFER`, `REJECTED`, and `WITHDRAWN`.
   - **Modern Data Table**: Tabular view with sorting, status badges, dates, and note previews.
   - Associate specific resume versions with individual applications.
   - Schedule upcoming interviews and maintain timestamped personal interview notes.

4. **Deterministic + AI Resume Matcher**
   - **Deterministic Skill Catalog**: Scans 100+ industry technologies (Python, Django, React, Docker, AWS, PostgreSQL, Kubernetes, etc.) using regex word boundary matching.
   - Computes baseline percentage match score mathematically: `(matching_skills / job_skills) * 100`.
   - **Ollama AI Qualitative Analysis**: Generates an executive compatibility summary and actionable recommendations to bridge missing skill gaps.
   - **Fault-Tolerant Fallback**: If Ollama is offline or times out, the system seamlessly provides deterministic match scoring and heuristic gap guidance without throwing errors.
   - Comprehensive history log of prior match analyses.

5. **AI Career Coach (ChatGPT-Style Interface)**
   - Multi-turn conversation interface with chat bubbles and markdown formatting.
   - **Deep Context Injection**: Automatically injects candidate name, active resume text, recent applications, target job postings, and identified skill gaps into prompt context.
   - Quick prompt pills for common questions (skill gap roadmap, resume improvement tips, Django interview prep).
   - Real-time Ollama connectivity status pill and one-click chat history reset.

6. **Analytics Dashboard**
   - Pipeline metric cards: Total Applications, Interviews, Offers, Saved Jobs, Average Match Score.
   - Visual charts powered by **Recharts**: Applications by Pipeline Stage (Bar Chart) and Resume Match Scores Trend (Area Chart).
   - Upcoming interviews widget with quick note links.
   - Target skill gaps frequency counter aggregating missing skills across all job matches.

7. **Security & Data Isolation**
   - Strict multi-tenant data isolation: users cannot view, edit, or delete another user's resumes, jobs, applications, match analyses, or conversations.
   - JWT authentication via `djangorestframework-simplejwt` with automatic Axios interceptor token refresh.
   - Passwords securely hashed with PBKDF2/SHA256.

8. **Modern Dark-Glass SaaS Aesthetic**
   - High-contrast typography with Plus Jakarta Sans.
   - Glassmorphic panels (`backdrop-filter: blur(14px)`), subtle borders, glowing accent highlights, and responsive sidebar navigation.

---

## Technology Stack

- **Backend**: Python 3.14+, Django 5.2+, Django REST Framework 3.18+, SimpleJWT, PostgreSQL (with SQLite fallback for local development), `django-cors-headers`, `python-dotenv`, `pypdf`, `requests`, `psycopg` (binary v3).
- **Frontend**: React 18, Vite 5, React Router v6, Axios, Recharts, Lucide React, CSS3 Design Tokens.
- **AI / Local LLM**: Ollama (`llama3.2:latest` or configurable via environment variables).

---

## Project Structure

```
ai-job-intelligence-platform/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── .env
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── accounts/         # Custom User model, JWT auth & profile APIs
│   ├── resumes/          # Resume upload, pypdf extraction, AI critique
│   ├── jobs/             # Job opportunity CRUD, search & filtering
│   ├── applications/     # Application tracker, Kanban status updates
│   ├── matching/         # Skill taxonomy, deterministic + Ollama engine
│   ├── ai_assistant/     # Context builder, Ollama client, chat history
│   └── dashboard/        # Aggregated pipeline metrics & chart data
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── index.css     # Dark-Glass design tokens and utility classes
│       ├── App.jsx
│       ├── main.jsx
│       ├── context/      # AuthContext & ToastContext
│       ├── services/     # API service layer with JWT auto-refresh
│       ├── components/   # Layout, Modal, ScoreGauge, ProtectedRoute
│       └── pages/        # Dashboard, Resumes, Jobs, Applications, Matching, AI Assistant, Profile
│
├── media/resumes/        # Uploaded PDF resumes
├── README.md
└── .gitignore
```

---

## Installation & Setup

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ and npm
- [Optional] PostgreSQL (defaults to SQLite if PostgreSQL is not running)
- [Optional] [Ollama](https://ollama.com/) for on-device AI features

---

### 1. Backend Setup

1. **Navigate to project root and create Python virtual environment**:
   ```bash
   python -m venv venv
   ```

2. **Activate the virtual environment**:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows (Command Prompt)**:
     ```cmd
     venv\Scripts\activate.bat
     ```
   - **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. **Configure Environment Variables**:
   Copy `backend/.env.example` to `backend/.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```

   Example `.env` file:
   ```env
   SECRET_KEY=your-secure-secret-key-here
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1

   # Database: Set DB_ENGINE=postgresql to use PostgreSQL, or DB_ENGINE=sqlite for local SQLite
   DB_ENGINE=sqlite
   DATABASE_NAME=job_intelligence_db
   DATABASE_USER=postgres
   DATABASE_PASSWORD=postgres
   DATABASE_HOST=localhost
   DATABASE_PORT=5432

   # CORS
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

   # Ollama AI
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.2:latest
   ```

5. **PostgreSQL Setup (Optional)**:
   If using PostgreSQL:
   ```sql
   CREATE DATABASE job_intelligence_db;
   CREATE USER postgres WITH PASSWORD 'postgres';
   GRANT ALL PRIVILEGES ON DATABASE job_intelligence_db TO postgres;
   ```
   Set `DB_ENGINE=postgresql` in `backend/.env`.

6. **Run Database Migrations**:
   ```bash
   python backend/manage.py migrate
   ```

7. **Run Backend Tests**:
   ```bash
   python backend/manage.py test accounts resumes jobs applications matching ai_assistant
   ```

8. **Start Django Development Server**:
   ```bash
   python backend/manage.py runserver 127.0.0.1:8000
   ```
   Backend runs at: `http://127.0.0.1:8000`

---

### 2. Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install npm dependencies**:
   ```bash
   npm install
   ```

3. **Verify Production Build**:
   ```bash
   npm run build
   ```

4. **Start Vite Development Server**:
   ```bash
   npm run dev
   ```
   Frontend runs at: `http://localhost:5173`

---

### 3. Ollama AI Setup

1. Install Ollama from [https://ollama.com](https://ollama.com).
2. Start the Ollama server:
   ```bash
   ollama serve
   ```
3. Pull the default lightweight model:
   ```bash
   ollama pull llama3.2:latest
   ```
4. *(Optional)* If you wish to use another model (such as `mistral` or `llama3`), pull it and update `OLLAMA_MODEL` in `backend/.env`.
5. If Ollama is not installed or offline, all core non-AI features (resume uploading, job tracking, kanban pipeline, deterministic match scoring) continue to function with zero disruption.

---

## API Overview

### Authentication
- `POST /api/auth/register/` - Register a new candidate account and receive JWT tokens.
- `POST /api/auth/login/` - Authenticate using username or email + password.
- `POST /api/auth/refresh/` - Refresh expired access token using refresh token.
- `GET /api/auth/profile/` - Retrieve logged-in candidate profile.
- `PUT /api/auth/profile/` - Update profile information.

### Resumes
- `GET /api/resumes/` - List user resumes.
- `POST /api/resumes/` - Upload PDF resume, extract text, and set active.
- `GET /api/resumes/<id>/` - Retrieve resume details and extracted text.
- `DELETE /api/resumes/<id>/` - Delete resume and media file.
- `POST /api/resumes/<id>/set-active/` - Mark resume as active (auto-unsets others).
- `POST /api/resumes/<id>/improve/` - Request AI critique on ATS friendliness, weak wording, and impact metrics.

### Jobs
- `GET /api/jobs/?search=&employment_type=` - List user jobs with search and filters.
- `POST /api/jobs/` - Create a target job listing.
- `GET /api/jobs/<id>/` - Retrieve job details.
- `PUT /api/jobs/<id>/` - Update job details.
- `DELETE /api/jobs/<id>/` - Delete job.

### Applications
- `GET /api/applications/?status=` - List applications with optional pipeline status filter.
- `POST /api/applications/` - Track a new job application with associated resume.
- `GET /api/applications/<id>/` - Retrieve application details.
- `PATCH /api/applications/<id>/` - Quick-update pipeline status or interview date.
- `DELETE /api/applications/<id>/` - Delete tracked application.

### Resume Matching
- `POST /api/matching/analyze/` - Analyze resume against job. Computes deterministic score and triggers Ollama qualitative analysis.
- `GET /api/matching/history/` - View past match analyses.
- `GET /api/matching/<id>/` - View specific match analysis.

### AI Assistant
- `POST /api/ai/ask/` - Ask AI career coach (contextually enriched with user data).
- `GET /api/ai/history/` - Fetch conversation history.
- `DELETE /api/ai/history/` - Clear conversation history.
- `GET /api/ai/status/` - Live Ollama health check.

### Dashboard
- `GET /api/dashboard/` - Pipeline summary metrics, applications by status, recent applications, upcoming interviews, and top missing skills.

---

## User Data Isolation & Security

- Every request is verified via JWT Bearer token authentication.
- All ORM queries strictly filter by `user=request.user`.
- Cross-tenant access is blocked: users cannot link another candidate's resumes or jobs into their applications or match queries.

---

## Future Improvements

- Browser extension for one-click job clipping from LinkedIn and Indeed.
- Automated cover letter generation tailored to specific match gaps.
- Export resume critique report as PDF.
- Email reminders for upcoming interviews.
