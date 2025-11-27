```markdown
# Sonic AI Backend - FastAPI

This is the backend API for Sonic AI, built with FastAPI and powered by Coqui XTTS-v2..

## Project Structure


BACKEND/
├── Dockerfile
├── docker-compose.yml
├── requirements-app.txt      # only extra packages (TTS is in base image)
├── main.py                   # complete FastAPI app
├── voices/                   # ← persisted voices (gitignored)
├── tts_models/               # ← model cache (gitignored)
└── README.md


## Quick Start (Docker – the only supported way)

This project is deliberately Docker-only for reproducibility.  

1. Clone the repo
git clone <your-repo-url>.git
cd backend

2. Create persistent folders (only needed once)
mkdir voices tts_models

3. Start the API
docker-compose up --build

### Or without compose
docker build -t sonic-ai-api .
docker run -p 8000:8000 \
  -v "$(pwd)/voices:/app/voices" \
  -v "$(pwd)/tts_models:/root/.local/share/tts" \
  sonic-ai-api
