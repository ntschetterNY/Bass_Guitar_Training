# syntax=docker/dockerfile:1

# ---- Stage 1: build the React frontend ----
FROM node:22-alpine AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci || npm install
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: Python backend serving the built SPA ----
FROM python:3.12-slim AS runtime
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    BGT_DATA_DIR=/app/data \
    BGT_STATIC_DIR=/app/static
WORKDIR /app

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Backend source -> /app/app, then the compiled frontend -> /app/static
COPY backend/ ./
COPY --from=frontend /frontend/dist ./static

# Run as a fixed non-root UID so the bind-mounted data dataset can be chowned
# to match (see README — chown the TrueNAS dataset to 1000:1000).
RUN useradd -u 1000 -m appuser && mkdir -p /app/data && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/health').status==200 else 1)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
