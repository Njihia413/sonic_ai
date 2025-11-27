FROM ghcr.io/coqui-ai/tts:latest

# Docker Desktop GPU compatibility + license
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility
ENV NVIDIA_DISABLE_REQUIRE=1
ENV COQUI_TOS_AGREED=1

# Install ffmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install only our additional requirements (best caching)
COPY requirements-app.txt .
RUN pip install --no-cache-dir -r requirements-app.txt

# Copy source last (so code changes don't invalidate dep layer)
COPY main.py .

EXPOSE 8000

ENTRYPOINT ["uvicorn"]
CMD ["main:app", "--host", "0.0.0.0", "--port", "8000"]