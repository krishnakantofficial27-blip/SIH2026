# Multi-stage hardened production Dockerfile for SlopeSafe AI Early Warning System
FROM python:3.11-slim as builder

WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.11-slim as runtime

WORKDIR /app

# Create non-root system user for defense-in-depth container security
RUN groupadd -r slopesafe && useradd -r -g slopesafe -s /bin/false slopesafe

COPY --from=builder /root/.local /home/slopesafe/.local
COPY . /app

RUN chown -R slopesafe:slopesafe /app /home/slopesafe/.local
ENV PATH=/home/slopesafe/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

USER slopesafe

EXPOSE 8000

# Institutional Docker health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health/live').read()" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--proxy-headers"]
