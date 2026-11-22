#!/bin/sh
set -e

echo "Applying database migrations..."
alembic upgrade head

echo "Starting BULK SHARE FastAPI application..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
