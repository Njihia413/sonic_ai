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
import os
import numpy as np
import librosa
import noisereduce as nr
import soundfile as sf
from datetime import datetime
from pathlib import Path
from pydub import AudioSegment, effects

app = FastAPI(
    title="Sonic AI Voice Cloner",
    description="Professional XTTS-v2 API with Audio Pre-processing Pipeline",
    version="1.1.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Hardware Setup ---
if torch.cuda.is_available():
    device = "cuda"
    acceleration = "🟢 NVIDIA RTX GPU - FULL SPEED"
elif torch.backends.mps.is_available():
    device = "mps"
    acceleration = "🟢 Apple Silicon MPS - EXTREMELY FAST"
else:
    device = "cpu"
    acceleration = "🟡 CPU - Standard Speed"

print(f"\n🚀 Sonic AI Voice Cloner starting → {acceleration}\n")

# Load XTTS Model
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=(device == "cuda"))
if device == "mps":
    tts.synthesizer.tts_model.to("mps")
    tts.synthesizer.gpt.to("mps")
    tts.synthesizer.vocoder.to("mps")

VOICES_DIR = Path("/app/voices")
VOICES_DIR.mkdir(exist_ok=True)


# --- AUDIO PROCESSING PIPELINE ---
class AudioProcessor:
    """
    Handles cleaning, normalizing, and verifying reference audio.
    Implements Feedback items: #1, #2, #3, #5, #6, #11
    """
    
    @staticmethod
    def process_audio(file_bytes: bytes, target_sr=24000) -> tuple[str, float]:
        """
        Runs the full pipeline:
        1. Load -> 2. Denoise -> 3. VAD/Trim -> 4. Normalize -> 5. Export
        Returns: (path_to_clean_wav, duration_sec)
        """
        # 1. Load Audio with Librosa (returns float32 array, normalized -1 to 1)
        # We use a BytesIO wrapper for librosa
        try:
            y, sr = librosa.load(io.BytesIO(file_bytes), sr=target_sr, mono=True)
        except Exception as e:
            raise HTTPException(400, detail=f"Could not decode audio: {str(e)}")

        # 2. Noise Reduction (Spectral Gating)
        # We assume the noise is stationary (constant hiss/hum)
        try:
            y_clean = nr.reduce_noise(y=y, sr=sr, stationary=True, prop_decrease=0.95)
        except Exception:
            y_clean = y  # Fallback if NR fails

        # 3. Voice Activity Detection (VAD) / Trimming
        # Split on silence (below 30dB) to remove start/end/middle gaps
        intervals = librosa.effects.split(y_clean, top_db=30)
        
        # Reconstruct only the speech parts
        y_speech = np.concatenate([y_clean[start:end] for start, end in intervals])
        
        if len(y_speech) == 0:
            raise HTTPException(400, detail="No speech detected in audio file.")

        # 4. Check Duration (Enforcement)
        duration = len(y_speech) / sr
        if duration < 3.0:
            raise HTTPException(400, detail=f"Audio too short ({duration:.1f}s). Minimum 3s required.")
        if duration > 45.0:
            # If too long, take the first 45s (XTTS degrades on very long inputs)
            y_speech = y_speech[:int(45 * sr)]
            duration = 45.0

        # 5. Normalization (using Pydub for safer peak normalization)
        # We need to convert numpy array back to something pydub likes, or use soundfile
        # Easier path: Save temp, load pydub, normalize, export.
        
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tf:
            sf.write(tf.name, y_speech, sr)
            temp_path = tf.name

        # Apply peak normalization to -3.0 dBFS
        audio_seg = AudioSegment.from_wav(temp_path)
        audio_seg = effects.normalize(audio_seg, headroom=3.0) 
        
        # Clean up temp
        os.unlink(temp_path)

        # 6. Return audio object and duration
        return audio_seg, duration

# --- ENDPOINTS ---

@app.get("/")
async def root():
    voice_count = len([d for d in VOICES_DIR.iterdir() if d.is_dir() and (d / "reference.wav").exists()])
    return {
        "status": "running",
        "acceleration": acceleration,
        "voices_stored": voice_count,
        "pipeline_features": ["Noise Reduction", "VAD Trimming", "Normalization", "Duration Check"]
    }

@app.get("/voices")
async def list_voices():
    voices = []
    for folder in VOICES_DIR.iterdir():
        if not folder.is_dir(): continue
        meta_path = folder / "metadata.json"
        
        metadata = {}
        if meta_path.exists():
            try:
                metadata = json.loads(meta_path.read_text())
            except: pass

        voices.append({
            "id": folder.name,
            "name": metadata.get("name", folder.name),
            "uploaded_at": metadata.get("uploaded_at"),
            "duration": metadata.get("duration_sec", 0),
        })
    return {"voices": sorted(voices, key=lambda x: x.get("uploaded_at") or "", reverse=True)}

@app.post("/voices")
async def upload_voice(
    name: str = Form(..., description="Voice name"),
    file: UploadFile = File(...)
):
    voice_id = re.sub(r"[^a-z0-9-]", "", name.lower().replace(" ", "-"))[:60]
    voice_dir = VOICES_DIR / voice_id
    voice_dir.mkdir(exist_ok=True)

    # Read file
    contents = await file.read()
    
    # --- PIPELINE EXECUTION ---
    try:
        # Pass bytes to processor
        processed_audio, duration = AudioProcessor.process_audio(contents)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(500, detail=f"Processing failed: {str(e)}")

    # Save finalized "perfect" reference
    wav_path = voice_dir / "reference.wav"
    processed_audio.export(wav_path, format="wav")

    metadata = {
        "name": name,
        "uploaded_at": datetime.utcnow().isoformat() + "Z",
        "original_filename": file.filename,
        "duration_sec": round(duration, 2)
    }
    (voice_dir / "metadata.json").write_text(json.dumps(metadata, indent=2))

    return {
        "message": "Voice processed and stored successfully",
        "id": voice_id,
        "duration_cleaned": duration,
        "note": "Audio was automatically denoised, trimmed, and normalized."
    }

@app.delete("/voices/{voice_id}")
async def delete_voice(voice_id: str):
    voice_dir = VOICES_DIR / voice_id
    if voice_dir.exists():
        shutil.rmtree(voice_dir)
        return {"message": "Deleted"}
    raise HTTPException(404, detail="Voice not found")

@app.post("/generate")
async def generate(
    text: str = Form(...),
    voice_id: str = Form(...),
    language: str = Form("en"),
    # New Inference Parameters (Feedback #4)
    temperature: float = Form(0.75, description="Creativity (0.0-1.0). Lower is more stable."),
    length_penalty: float = Form(1.0, description="Control speed/length."),
    repetition_penalty: float = Form(5.0, description="Prevent stuttering."),
    top_k: int = Form(50, description="Sampling pool size."),
    top_p: float = Form(0.85, description="Nucleus sampling.")
):
    wav_path = VOICES_DIR / voice_id / "reference.wav"
    if not wav_path.exists():
        raise HTTPException(404, detail="Voice not found")

    temp_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    output_path = temp_file.name
    temp_file.close()

    try:
        tts.tts_to_file(
            text=text,
            file_path=output_path,
            speaker_wav=str(wav_path),
            language=language,
            split_sentences=True,
            # Tuning Parameters
            temperature=temperature,
            length_penalty=length_penalty,
            repetition_penalty=repetition_penalty,
            top_k=top_k,
            top_p=top_p
        )
    except Exception as e:
        os.unlink(output_path)
        raise HTTPException(500, detail=f"Generation failed: {str(e)}")

    return FileResponse(
        output_path,
        media_type="audio/wav",
        filename=f"{voice_id}_gen.wav"
    )