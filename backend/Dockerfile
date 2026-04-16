FROM python:3.11-slim AS builder

WORKDIR /backend

RUN pip install --no-cache-dir uv

COPY pyproject.toml .

RUN uv pip install --system --no-cache -e .

FROM python:3.11-slim

WORKDIR /backend

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser && \
    mkdir -p /backend/uploads/resumes && \
    chown -R appuser:appgroup /backend

COPY --from=builder --chown=appuser:appgroup /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder --chown=appuser:appgroup /usr/local/bin /usr/local/bin
COPY --chown=appuser:appgroup . .

USER appuser

EXPOSE 8000

ENTRYPOINT ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
