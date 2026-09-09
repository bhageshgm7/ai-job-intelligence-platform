# Railway Deployment Guide - AI Job Intelligence Platform

This guide walks you through deploying the **AI Job Intelligence Platform** to [Railway](https://railway.app/) using your GitHub repository:
`https://github.com/bhageshgm7/ai-job-intelligence-platform`

---

## Architecture Overview

The platform deploys on Railway as three co-located components in a single project:
1. **Railway PostgreSQL Database**: Dedicated production PostgreSQL instance.
2. **Django Backend Service**: Gunicorn WSGI web service serving REST APIs and static assets via WhiteNoise.
3. **React Frontend Service**: Production Vite SPA bundle served with client-side routing fallback via `serve`.

---

## Step 1: Create a New Project on Railway

1. Log into your [Railway Dashboard](https://railway.app/dashboard).
2. Click the **+ New Project** button.
3. Select **Empty Project** (we will add the database and services inside this project).

---

## Step 2: Add Railway PostgreSQL Database

1. In your new project canvas, click **+ Create** or **Add a Service**.
2. Select **Database** -> **Add PostgreSQL**.
3. Railway will provision a dedicated PostgreSQL database.
4. Click on the PostgreSQL tile, navigate to the **Variables** tab, and locate:
   - `DATABASE_URL` (e.g., `postgresql://postgres:***@***.railway.internal:5432/railway`)

---

## Step 3: Deploy the Backend Service (Django)

1. In the project canvas, click **+ Create** -> **GitHub Repo**.
2. Select your repository: `bhageshgm7/ai-job-intelligence-platform`.
3. Rename the service to `ai-job-intelligence-backend` (click service name at the top to edit).
4. Go to **Settings**:
   - **Root Directory**: Set to `/backend`
   - Build and start commands are automatically managed by `backend/Procfile` and `backend/railway.json`:
     `python manage.py migrate && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
5. Go to **Variables** and add:
   | Variable | Value | Description |
   |---|---|---|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | References Railway's PostgreSQL connection string |
   | `SECRET_KEY` | *(Generate a secure random string)* | Production Django secret key |
   | `DEBUG` | `False` | Disables debug mode in production |
   | `ALLOWED_HOSTS` | `localhost,127.0.0.1,.railway.app,.up.railway.app` | Allowed host patterns |
   | `CORS_ALLOWED_ORIGINS` | *(Optional, e.g. frontend domain)* | Subdomains under `.railway.app` and `.up.railway.app` are allowed automatically |
   | `OLLAMA_BASE_URL` | *(Leave empty)* | Platform automatically uses fast deterministic skill taxonomy matching |

6. Go to **Networking** (or **Settings** -> **Public Networking**):
   - Click **Generate Domain**.
   - Note the generated domain (e.g., `https://ai-job-intelligence-backend-production.up.railway.app`).

---

## Step 4: Deploy the Frontend Service (React / Vite)

1. In the same project canvas, click **+ Create** -> **GitHub Repo**.
2. Select the same repository: `bhageshgm7/ai-job-intelligence-platform`.
3. Rename the service to `ai-job-intelligence-frontend`.
4. Go to **Settings**:
   - **Root Directory**: Set to `/frontend`
   - Build phase runs `npm install && npm run build`.
   - Start phase is handled by `frontend/Procfile` and `frontend/railway.json`: `npm run start` (serves `dist/` on `$PORT`).
5. Go to **Variables** and add:
   | Variable | Value | Description |
   |---|---|---|
   | `VITE_API_URL` | `https://<YOUR-BACKEND-DOMAIN>.up.railway.app/api` | Full URL to your deployed backend API |

   *Example: `https://ai-job-intelligence-backend-production.up.railway.app/api`*

6. Go to **Networking**:
   - Click **Generate Domain**.
   - Note the generated domain (e.g., `https://ai-job-intelligence-frontend-production.up.railway.app`).

---

## Step 5: Verification & Production Checklist

1. **Verify Backend Health**:
   - Visit `https://<YOUR-BACKEND-DOMAIN>.up.railway.app/api/jobs/` in your browser.
   - You should receive a valid JSON response `[]` or a list of jobs.
2. **Verify Frontend Application**:
   - Visit `https://<YOUR-FRONTEND-DOMAIN>.up.railway.app`.
   - Verify the login and registration pages load cleanly.
   - Register a new account or log in.
   - Navigate across SPA routes (`/dashboard`, `/jobs`, `/resumes`, `/matching`) and refresh the page to confirm SPA rewrites work.
3. **Verify Matches & Uploads**:
   - Upload a sample PDF resume.
   - Run a job match to confirm the skill taxonomy matching engine processes successfully.
