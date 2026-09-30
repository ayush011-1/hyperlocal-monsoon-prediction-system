# ==============================================================================
# Multi-stage Dockerfile for Hyperlocal Monsoon Prediction & Decision System
# SIH PS 26086: Production Ready for Render / Railway / Cloud Run / Koyeb
# ==============================================================================

# Stage 1: Build the React + Vite frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Python FastAPI backend + ML Models
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code, ML models, and regional datasets
COPY backend/ ./backend/

# Copy compiled frontend assets from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

WORKDIR /app/backend

ENV PORT=8000
ENV HOST=0.0.0.0
ENV APP_ENV=production

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
