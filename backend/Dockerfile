# ==============================================================================
# Production Dockerfile for AI Grievance Backend (FastAPI + Uvicorn)
# ==============================================================================
FROM python:3.11-slim

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# Install system dependencies (curl for health checks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first for caching
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy application source code
COPY backend /app/backend
COPY complaint.py /app/complaint.py

# Create directory for persistent uploads
RUN mkdir -p /app/uploads

# Expose backend port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Production server command with uvicorn
CMD ["uvicorn", "complaint:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
