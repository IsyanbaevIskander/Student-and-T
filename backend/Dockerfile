FROM python:3.11-slim

WORKDIR /backend

# We install uv and use it to install the environment
RUN pip install uv

COPY pyproject.toml ./
# No poetry.lock or uv.lock yet, so we just let it install according to pyproject
RUN uv pip install --system -e .

COPY . .

# Run uvicorn server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
