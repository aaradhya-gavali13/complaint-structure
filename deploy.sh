#!/usr/bin/env bash
# ==============================================================================
# AI Citizen Grievance Portal - Automated Production Deployment Script
# ==============================================================================

set -e

echo "========================================================"
echo "  Deploying AI Grievance Platform (Docker Compose)      "
echo "========================================================"

# 1. Check for Docker and Docker Compose
if ! command -v docker &> /dev/null; then
    echo "[-] Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# 2. Check for .env file; create from example if missing
if [ ! -f .env ]; then
    echo "[+] Creating .env from .env.example..."
    cp .env.example .env
fi

# 3. Ensure persistent directories exist
echo "[+] Ensuring persistent storage directories exist..."
mkdir -p uploads
touch grievances.db

# 4. Pull and Build containers
echo "[+] Building Docker containers (Backend, Citizen Portal, Admin Portal)..."
docker compose build --parallel

# 5. Bring up services in detached mode
echo "[+] Starting services in detached background mode..."
docker compose up -d

# 6. Verify health
echo "[+] Waiting for backend health check..."
sleep 5
docker compose ps

echo "========================================================"
echo "  Deployment Complete! Application Services Running:    "
echo "  - Citizen Portal:   http://localhost:5173             "
echo "  - Admin Dashboard:  http://localhost:5174             "
echo "  - Backend API:      http://localhost:8000             "
echo "  - API Swagger Docs: http://localhost:8000/docs        "
echo "========================================================"
echo "To view live logs, run: docker compose logs -f"
echo "To shut down, run:      docker compose down"
