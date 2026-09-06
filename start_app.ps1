# AI Job Intelligence Platform PowerShell Launcher

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Starting AI Job Intelligence Platform" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Virtual Environment Check
if (-not (Test-Path ".\venv\Scripts\python.exe")) {
    Write-Host "[ERROR] Virtual environment 'venv' not found in project root." -ForegroundColor Red
    Write-Host "Run: python -m venv venv; .\venv\Scripts\pip install -r .\backend\requirements.txt" -ForegroundColor Yellow
    exit 1
}

# 2. Ollama Check
Write-Host "Checking local Ollama status..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "[OK] Ollama is active and ready." -ForegroundColor Green
    }
} catch {
    Write-Host "[NOTE] Ollama not detected at http://localhost:11434." -ForegroundColor Yellow
    Write-Host "Deterministic skill matching will run normally. Start Ollama with 'ollama serve' for AI generation." -ForegroundColor Gray
}

# 3. Launch Django Backend
Write-Host "Starting Django Backend on http://127.0.0.1:8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\venv\Scripts\Activate.ps1; python backend\manage.py runserver 127.0.0.1:8000"

Start-Sleep -Seconds 2

# 4. Launch React Frontend
Write-Host "Starting Vite Frontend on http://localhost:5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location frontend; npm run dev"

Start-Sleep -Seconds 3

# 5. Open Default Browser
Start-Process "http://localhost:5173"

Write-Host "====================================================" -ForegroundColor Green
Write-Host "Platform launched successfully!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "Backend API: http://127.0.0.1:8000/api/" -ForegroundColor White
Write-Host "Demo Credentials: demouser / Password123!" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Green
