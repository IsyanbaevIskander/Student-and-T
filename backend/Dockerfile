FROM python:3.11-slim AS builder

WORKDIR /backend

RUN pip install --no-cache-dir uv

COPY pyproject.toml .

RUN uv pip install --system --no-cache -e .

FROM python:3.11-slim

WORKDIR /backend

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser

COPY --from=builder --chown=appuser:appgroup /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --chown=appuser:appgroup . .

USER appuser

EXPOSE 8080

ENTRYPOINT ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
