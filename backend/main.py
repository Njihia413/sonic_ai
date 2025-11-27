from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from TTS.api import TTS
import torch
import io
import shutil
import tempfile
import json
import re
from datetime import datetime
from pathlib import Path
from pydub import AudioSegment

app = FastAPI(
    title="Sonic AI Voice Cloner",
    description="Professional XTTS-v2 voice cloning API – multi-voice, persistent, GPU-accelerated",
    version="1.0.0",
)

# CORS – wide open in dev, tighten in prod
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Device detection + pretty message
if torch.cuda.is_available():
    device = "cuda"
    acceleration = "🟢 NVIDIA RTX GPU – FULL SPEED"
elif torch.backends.mps.is_available():
    device = "mps"
    acceleration = "🟢 Apple Silicon MPS – EXTREMELY FAST"
else:
    device = "cpu"
    acceleration = "🟡 CPU – still excellent on modern machines"

print(f"\n🚀 Sonic AI Voice Cloner starting → {acceleration}\n")

# Load XTTS once at startup
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=(device == "cuda"))

# Move to Apple Silicon MPS if available
if device == "mps":
    tts.synthesizer.tts_model.to("mps")
    tts.synthesizer.gpt.to("mps")
    tts.synthesizer.vocoder.to("mps")

# Persistent multi-voice directory (mounted via Docker volume)
VOICES_DIR = Path("/app/voices")
VOICES_DIR.mkdir(exist_ok=True)


@app.get("/")
async def root():
    voice_count = len([d for d in VOICES_DIR.iterdir() if d.is_dir() and (d / "reference.wav").exists()])
    return {
        "project": "Sonic AI Voice Cloner",
        "status": "running",
        "acceleration": acceleration,
        "voices_stored": voice_count,
        "endpoints": {
            "docs": "/docs",
            "list_voices": "GET /voices",
            "upload_voice": "POST /voices",
            "generate": "POST /generate",
            "delete": "DELETE /voices/{voice_id}"
        }
    }


@app.get("/voices")
async def list_voices():
    voices = []
    for folder in VOICES_DIR.iterdir():
        if not folder.is_dir():
            continue
        wav_path = folder / "reference.wav"
        meta_path = folder / "metadata.json"
        if not wav_path.exists():
            continue

        try:
            duration = len(AudioSegment.from_wav(wav_path)) / 1000.0
        except:
            duration = 0.0

        metadata = {}
        if meta_path.exists():
            try:
                metadata = json.loads(meta_path.read_text())
            except:
                pass

        voices.append({
            "id": folder.name,
            "name": metadata.get("name", folder.name.replace("-", " ").title()),
            "uploaded_at": metadata.get("uploaded_at"),
            "duration_sec": round(duration, 2),
            "original_filename": metadata.get("original_filename", "unknown")
        })

    return {
        "voices": sorted(voices, key=lambda x: x.get("uploaded_at") or "", reverse=True)
    }


@app.post("/voices")
async def upload_voice(
    name: str = Form(..., description="Display name, e.g. 'Emma – British Female'"),
    file: UploadFile = File(..., description="Any audio file: WAV, MP3, OGG, M4A, etc.")
):
    # Sanitize voice_id (safe for filesystem + URL)
    voice_id = re.sub(r"[^a-z0-9-]", "", name.lower().replace(" ", "-"))[:60]
    if not voice_id:
        raise HTTPException(400, detail="Name results in invalid ID")

    voice_dir = VOICES_DIR / voice_id
    voice_dir.mkdir(exist_ok=True)

    # Load, convert to perfect XTTS format
    contents = await file.read()
    try:
        audio = AudioSegment.from_file(io.BytesIO(contents))
        audio = audio.set_channels(1).set_frame_rate(24000).set_sample_width(2)  # 16-bit
    except Exception as e:
        raise HTTPException(400, detail=f"Unsupported or corrupted audio file: {str(e)}")

    wav_path = voice_dir / "reference.wav"
    audio.export(wav_path, format="wav")

    # Save metadata
    metadata = {
        "name": name,
        "uploaded_at": datetime.utcnow().isoformat() + "Z",
        "original_filename": file.filename,
        "duration_sec": round(len(audio) / 1000, 2)
    }
    (voice_dir / "metadata.json").write_text(json.dumps(metadata, indent=2))

    return {
        "message": "Voice uploaded successfully",
        "id": voice_id,
        "name": name,
        "duration_sec": metadata["duration_sec"]
    }


@app.delete("/voices/{voice_id}")
async def delete_voice(voice_id: str):
    voice_dir = VOICES_DIR / voice_id
    if voice_dir.exists() and voice_dir.is_dir():
        shutil.rmtree(voice_dir)
        return {"message": f"Voice '{voice_id}' deleted permanently"}
    raise HTTPException(404, detail="Voice not found")


@app.post("/generate")
async def generate(
    text: str = Form(..., description="Text to synthesize"),
    voice_id: str = Form(..., description="Voice ID from /voices"),
    language: str = Form("en", description="Language code: en, es, fr, de, it, pt, pl, tr, ru, nl, cs, ar, zh-cn, hu, ko, ja, hi")
):
    wav_path = VOICES_DIR / voice_id / "reference.wav"
    if not wav_path.exists():
        raise HTTPException(404, detail=f"Voice '{voice_id}' not found. Upload it first.")

    temp_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    output_path = temp_file.name
    temp_file.close()

    try:
        tts.tts_to_file(
            text=text,
            file_path=output_path,
            speaker_wav=str(wav_path),
            language=language,
            split_sentences=True
        )
    except Exception as e:
        os.unlink(output_path)
        raise HTTPException(500, detail=f"TTS inference failed: {str(e)}")

    return FileResponse(
        output_path,
        media_type="audio/wav",
        filename=f"{voice_id}_{int(datetime.utcnow().timestamp())}.wav"
    )