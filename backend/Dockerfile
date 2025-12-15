FROM --platform=linux/amd64 ghcr.io/coqui-ai/tts:latest

# Docker Desktop GPU compatibility + license
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility
ENV NVIDIA_DISABLE_REQUIRE=1
ENV COQUI_TOS_AGREED=1

# Install ffmpeg AND libsndfile1 (Required for soundfile/librosa)

RUN apt-get update && \
    apt-get install -y ffmpeg libsndfile1 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app



# Copy and install Python deps

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY main.py .
EXPOSE 8000
ENTRYPOINT ["uvicorn"]
CMD ["main:app", "--host", "0.0.0.0", "--port", "8000"]