# AI Citizen Grievance Platform - Production Deployment Guide

This comprehensive guide details how to deploy and operate the **AI Citizen Grievance Platform** in production. The platform consists of:
- **Backend API**: FastAPI + Uvicorn (Port 8000)
- **Citizen Portal**: React + Vite + Nginx (Port 5173 / Port 80)
- **Admin Operations Dashboard**: React + Vite + Nginx (Port 5174 / Port 80)
- **Persistent Storage**: SQLite (`grievances.db`) or PostgreSQL, and media attachments (`uploads/`)

---

## Directory Architecture for Deployment

```
complaint/
├── backend/
│   ├── Dockerfile                 # Production Dockerfile (Python 3.11-slim)
│   ├── requirements.txt           # Production Python dependencies
│   └── app/                       # FastAPI application source code
├── citizen-frontend/
│   ├── Dockerfile                 # Multi-stage Dockerfile (Node -> Nginx)
│   ├── nginx.conf                 # SPA routing and Gzip compression
│   └── src/                       # React frontend source code
├── admin-frontend/
│   ├── Dockerfile                 # Multi-stage Dockerfile (Node -> Nginx)
│   ├── nginx.conf                 # SPA routing and Gzip compression
│   └── src/                       # React admin dashboard source code
├── docker-compose.yml             # Orchestrates backend, citizen, and admin services
├── .dockerignore                  # Excludes large CSVs (5GB+), cache, and models
├── .env.example                   # Environment variable template
├── deploy.sh                      # 1-click deployment script (Linux/macOS)
├── deploy.ps1                     # 1-click deployment script (Windows)
├── complaint.py                   # Root application entrypoint
├── grievances.db                  # Persistent SQLite database file
└── uploads/                       # Persistent citizen file uploads directory
```

---

## Pre-Deployment Configuration (`.env`)

Before deploying, copy `.env.example` to `.env` and configure your production credentials:

```bash
cp .env.example .env
```

Key environment variables:
```ini
# Production Secret for Admin JWT Tokens (Generate a random 64-char string)
JWT_SECRET=replace-with-a-random-super-secret-key-32-chars-minimum
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

# Initial Admin Credentials
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=YourStrongPasswordHere2026!

# Database Configuration (SQLite default; can be replaced with PostgreSQL)
DATABASE_URL=sqlite:///./grievances.db
# For PostgreSQL:
# DATABASE_URL=postgresql://username:password@db-host:5432/grievance_db

# Host Ollama AI Classifier (optional, automatically falls back to rule-based classifier)
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=qwen2.5:3b
```

---

## Method 1: Docker Compose Deployment (Recommended for Cloud VPS)

Applicable to any Linux VPS (AWS EC2, DigitalOcean Droplet, Hetzner, Linode, Google Compute Engine).

### Step 1: Install Docker & Docker Compose on your VPS
```bash
# Ubuntu / Debian
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git curl
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```
*(Log out and log back in for docker group permissions to take effect)*

### Step 2: Clone or Copy Your Codebase
```bash
git clone <your-repository-url> /var/www/complaint
cd /var/www/complaint
```

### Step 3: Run the Automated Deployment
```bash
chmod +x deploy.sh
./deploy.sh
```

Or execute manually via Docker Compose:
```bash
docker compose up -d --build
```

### Step 4: Verify Deployment Health
```bash
docker compose ps
docker compose logs -f
```

Your services are live:
- **Citizen Portal**: `http://<your-server-ip>:5173`
- **Admin Dashboard**: `http://<your-server-ip>:5174`
- **Backend API & Swagger**: `http://<your-server-ip>:8000/docs`

---

## Method 2: Production Nginx Reverse Proxy with SSL (Domain Setup)

To serve the portals on standard ports (`80` and `443` HTTPS) with a custom domain:
- `grievance.yourdomain.com` -> Citizen Portal
- `admin.yourdomain.com` -> Admin Dashboard
- `api.yourdomain.com` -> FastAPI Backend

### Step 1: Install Nginx and Certbot on your host server
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Step 2: Create Nginx Site Configuration
Create `/etc/nginx/sites-available/grievance.conf`:

```nginx
# Citizen Portal
server {
    server_name grievance.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin Portal
server {
    server_name admin.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5174;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API
server {
    server_name api.yourdomain.com;

    client_max_body_size 25M; # Supports photo & document evidence attachments

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 3: Enable Site and Obtain Free SSL Certificates
```bash
sudo ln -s /etc/nginx/sites-available/grievance.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Generate SSL certificates automatically
sudo certbot --nginx -d grievance.yourdomain.com -d admin.yourdomain.com -d api.yourdomain.com
```

---

## Method 3: Native Bare-Metal Deployment (Systemd + Node)

If you prefer deploying without Docker:

### 1. Build Frontends
```bash
# Citizen Frontend
cd citizen-frontend
npm install
npm run build
# Built files are in citizen-frontend/dist/

# Admin Frontend
cd ../admin-frontend
npm install
npm run build
# Built files are in admin-frontend/dist/
cd ..
```

### 2. Set Up Python Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

### 3. Create Systemd Service for Backend
Create `/etc/systemd/system/grievance-backend.service`:
```ini
[Unit]
Description=FastAPI Citizen Grievance Backend Service
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/complaint
ExecStart=/var/www/complaint/venv/bin/uvicorn complaint:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
RestartSec=5
EnvironmentFile=/var/www/complaint/.env

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now grievance-backend
```

### 4. Serve Frontends via Host Nginx
Point Nginx `root` directly to `/var/www/complaint/citizen-frontend/dist` and `/var/www/complaint/admin-frontend/dist`.

---

## Data Persistence & Backup Procedures

1. **Database Backup (SQLite)**:
   ```bash
   # Safe online backup without locking the database
   sqlite3 grievances.db ".backup 'grievances_backup_$(date +%Y%m%d_%H%M%S).db'"
   ```

2. **Media Attachments Backup**:
   ```bash
   tar -czvf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
   ```

3. **Migrating to PostgreSQL**:
   Simply provide a PostgreSQL connection URL in `.env`:
   ```ini
   DATABASE_URL=postgresql://user:password@localhost:5432/grievancedb
   ```
   Install `psycopg2-binary` (`pip install psycopg2-binary`) and restart the backend. SQLAlchemy will automatically initialize all tables and relationships on startup.

---

## Routine Operations & Monitoring

| Task | Command |
| :--- | :--- |
| **View Live Container Logs** | `docker compose logs -f backend` |
| **Restart Services** | `docker compose restart` |
| **Update Code & Rebuild** | `git pull && docker compose up -d --build` |
| **Check System Health** | `curl -i http://localhost:8000/health` |
| **Stop All Containers** | `docker compose down` |
| **Stop and Wipe Containers** | `docker compose down -v` *(Caution: keeps host db files)* |
