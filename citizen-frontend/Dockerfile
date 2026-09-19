# ==============================================================================
# Multi-stage Dockerfile for Citizen Grievance Portal Frontend (React + Vite)
# ==============================================================================

# Stage 1: Build static assets
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for API Base URL
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Copy package descriptors and install dependencies
COPY citizen-frontend/package*.json ./
RUN npm ci || npm install

# Copy frontend source files and build production bundle
COPY citizen-frontend/ ./
RUN npm run build

# Stage 2: Serve with high-performance Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with SPA fallback
COPY citizen-frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
