# ==============================================================================
# AI Citizen Grievance Portal - Automated Windows Deployment Script
# ==============================================================================

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Deploying AI Grievance Platform (Windows / Docker)    " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Check for Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[-] Error: Docker is not installed or not in PATH." -ForegroundColor Red
    Write-Host "    Please start Docker Desktop and try again." -ForegroundColor Yellow
    Exit 1
}

# 2. Check for .env file
if (-not (Test-Path .env)) {
    Write-Host "[+] Creating .env from .env.example..." -ForegroundColor Green
    Copy-Item .env.example .env
}

# 3. Create persistent directories
if (-not (Test-Path uploads)) {
    New-Item -ItemType Directory -Path uploads | Out-Null
}
if (-not (Test-Path grievances.db)) {
    New-Item -ItemType File -Path grievances.db | Out-Null
}

# 4. Build containers
Write-Host "[+] Building containers with Docker Compose..." -ForegroundColor Green
docker compose build

# 5. Start containers
Write-Host "[+] Launching services in background..." -ForegroundColor Green
docker compose up -d

# 6. Check status
Start-Sleep -Seconds 5
docker compose ps

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete! Application Services Running:    " -ForegroundColor Green
Write-Host "  - Citizen Portal:   http://localhost:5173             " -ForegroundColor White
Write-Host "  - Admin Dashboard:  http://localhost:5174             " -ForegroundColor White
Write-Host "  - Backend API:      http://localhost:8000             " -ForegroundColor White
Write-Host "  - API Swagger Docs: http://localhost:8000/docs        " -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "To view live logs: docker compose logs -f" -ForegroundColor Yellow
Write-Host "To stop services:  docker compose down" -ForegroundColor Yellow
