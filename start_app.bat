@echo off
title AI Job Intelligence Platform Launcher
echo ====================================================
echo Starting AI Job Intelligence Platform
echo ====================================================

:: Check virtual environment
if not exist "venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment 'venv' not found.
    echo Please run 'python -m venv venv' and install requirements.
    pause
    exit /b 1
)

:: Check if Ollama is running
echo Checking Ollama local AI service...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Ollama service detected online!
) else (
    echo [NOTE] Ollama not detected at http://localhost:11434.
    echo Non-AI features and deterministic matching will run normally.
    echo To enable LLM coaching, run 'ollama serve' in a separate terminal.
)

echo.
echo Starting Django Backend at http://127.0.0.1:8000 ...
start "Django Backend Server" cmd /k ".\venv\Scripts\activate && python backend\manage.py runserver 127.0.0.1:8000"

timeout /t 2 /nobreak >nul

echo Starting Vite Frontend at http://localhost:5173 ...
start "React Frontend Dev Server" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ====================================================
echo Platform is up and running!
echo Frontend: http://localhost:5173
echo Backend API: http://127.0.0.1:8000/api/
echo Demo Account: demouser / Password123!
echo ====================================================
