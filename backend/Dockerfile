FROM python:3.13-slim

WORKDIR /app

# Install system dependencies for build tools and sqlite/postgres
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ensure entrypoint script is executable
RUN chmod +x entrypoint.sh || true

EXPOSE 8000

ENV PORT=8000
ENV ENVIRONMENT=production

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
