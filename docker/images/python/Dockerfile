# Python sandbox runner image.
# python:3.9-slim is intentionally pinned — do not upgrade without testing.
FROM python:3.9-slim

# Run as a non-root user for additional isolation.
RUN useradd -m sandboxuser
USER sandboxuser

WORKDIR /workspace
