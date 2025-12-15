from fastapi import FastAPI, UploadFile, File, HTTPException, Form, BackgroundTasks
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
import logging
import numpy as np
import librosa
import noisereduce as nr
import soundfile as sf
from typing import List, Optional
from datetime import datetime
from pathlib import Path
from pydub import AudioSegment, effects
from scipy.signal import butter, sosfilt, savgol_filter
# Quality Validation Import
from resemblyzer import VoiceEncoder, preprocess_wav
import random

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SonicV2")

app = FastAPI(
    title="Sonic AI Voice Cloner V2.3",
    description="State-of-the-Art XTTS API with Spectral Matching & Intra-Clip Validation",
    version="2.3.0",
)

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
    acceleration = "🟢 NVIDIA RTX GPU – FULL SPEED"
elif torch.backends.mps.is_available():
    device = "mps"
    acceleration = "🟢 Apple Silicon MPS – EXTREMELY FAST"
else:
    device = "cpu"
    acceleration = "🟡 CPU – Standard Speed"

logger.info(f"🚀 Sonic AI Voice Cloner V2.3 starting → {acceleration}")

# --- Load Models ---
# 1. XTTS Model
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=(device == "cuda"))
if device == "mps":
    tts.synthesizer.tts_model.to("mps")
    tts.synthesizer.gpt.to("mps")
    tts.synthesizer.vocoder.to("mps")

# 2. Resemblyzer (Voice Encoder for Validation)
# Keeping on CPU to prevent VRAM fragmentation with XTTS
encoder_device = "cpu" 
voice_encoder = VoiceEncoder(device=encoder_device)
logger.info("✅ Resemblyzer Loaded")

VOICES_DIR = Path("/app/voices")
VOICES_DIR.mkdir(exist_ok=True)


# --- AUDIO PROCESSING PIPELINE ---
class AudioProcessor:
    
    @staticmethod
    def deess_audio(y: np.ndarray, sr: int) -> np.ndarray:
        # Surgical De-essing (6kHz-8kHz Bandstop - narrowed for less muffling)
        sos = butter(2, [6000, 8000], btype='bandstop', fs=sr, output='sos')
        return sosfilt(sos, y)

    @staticmethod
    def process_audio(file_bytes: bytes, target_sr=24000) -> tuple[AudioSegment, float]:
        # 1. Load Audio with pydub for better memory handling
        try:
            audio_seg = AudioSegment.from_file(io.BytesIO(file_bytes))
            audio_seg = audio_seg.set_channels(1).set_frame_rate(target_sr)
            y = np.array(audio_seg.get_array_of_samples(), dtype=np.float32) / 32768.0
            sr = audio_seg.frame_rate
        except Exception as e:
            raise HTTPException(400, detail=f"Could not decode audio: {str(e)}")

        # 2. Noise Reduction (reduced aggressiveness)
        try:
            y_clean = nr.reduce_noise(y=y, sr=sr, stationary=True, prop_decrease=0.3)
        except Exception:
            y_clean = y

        # 3. VAD & Trimming
        intervals = librosa.effects.split(y_clean, top_db=30)
        y_speech = np.concatenate([y_clean[start:end] for start, end in intervals])
        
        if len(y_speech) == 0:
            raise HTTPException(400, detail="No speech detected.")

        # 4. Surgical De-essing
        y_deessed = AudioProcessor.deess_audio(y_speech, sr)

        # 5. Conversion to AudioSegment
        y_int16 = (y_deessed * 32767).astype(np.int16)
        audio_seg = AudioSegment(
            y_int16.tobytes(), 
            frame_rate=sr, 
            sample_width=2, 
            channels=1
        )

        # 6. Normalize & Fade
        audio_seg = effects.normalize(audio_seg, headroom=3.0) 
        audio_seg = audio_seg.fade_in(50).fade_out(50)

        return audio_seg, len(audio_seg) / 1000.0


# --- UTILS ---
def cleanup_file(path: str):
    try:
        os.unlink(path)
        logger.info(f"🧹 Cleaned up temp file: {path}")
    except Exception as e:
        logger.error(f"❌ Error deleting temp file {path}: {e}")

# --- ENDPOINTS ---

@app.get("/")
async def root():
    voice_count = len([d for d in VOICES_DIR.iterdir() if d.is_dir()])
    return {
        "status": "running",
        "version": "2.3.0",
        "acceleration": acceleration,
        "voices_stored": voice_count,
        "features": ["Spectral Matching", "Intra-Clip Consistency", "Bandstop De-essing"]
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

        ref_count = len(list(folder.glob("reference*.wav")))
        if ref_count == 0: continue

        voices.append({
            "id": folder.name,
            "name": metadata.get("name", folder.name),
            "uploaded_at": metadata.get("uploaded_at"),
            "samples": ref_count,
            "consistency": metadata.get("consistency_score", "N/A"),
            "duration": metadata.get("duration_total_sec", 0),
        })
    return {"voices": sorted(voices, key=lambda x: x.get("uploaded_at") or "", reverse=True)}

@app.post("/voices")
async def upload_voice(
    name: str = Form(..., description="Voice name"),
    files: List[UploadFile] = File(..., description="Upload 1-5 audio samples"),
    overwrite: bool = Form(False, description="Overwrite existing voice?")
):
    voice_id = re.sub(r"[^a-z0-9-]", "", name.lower().replace(" ", "-"))[:60]
    voice_dir = VOICES_DIR / voice_id
    
    if voice_dir.exists():
        if overwrite:
            shutil.rmtree(voice_dir)
        else:
            raise HTTPException(409, detail=f"Voice '{voice_id}' already exists.")
            
    voice_dir.mkdir(exist_ok=True)

    total_duration = 0.0
    saved_files = []
    saved_wav_paths = []
    skipped_count = 0

    # 1. Process Files
    for i, file in enumerate(files):
        if i > 4: break 
        
        contents = await file.read()
        try:
            processed_audio, duration = AudioProcessor.process_audio(contents)
            total_duration += duration
            
            save_path = voice_dir / f"reference_{i}.wav"
            processed_audio.export(save_path, format="wav")
            saved_files.append(str(save_path))
            saved_wav_paths.append(save_path)
            
        except Exception as e:
            logger.warning(f"Skipping file {file.filename}: {e}")
            skipped_count += 1
            continue

    # 2. Duration Validation (increased min to 10s)
    if total_duration < 10.0:
        shutil.rmtree(voice_dir)
        raise HTTPException(400, detail=f"Total speech ({total_duration:.2f}s) is too short. Min: 10s. Recommended: 15s+.")

    warning = None
    if total_duration < 15.0:
        warning = "Voice duration low (10-15s). For best fidelity, aim for 15s+."

    # 3. Enhanced Consistency Validation
    consistency_score = 0.0
    try:
        # Load and preprocess all valid wavs (Resemblyzer handles 16k resampling internally in preprocess_wav)
        wavs = [preprocess_wav(p) for p in saved_wav_paths]
        embeds = []

        if len(wavs) == 1 and total_duration > 10.0:
            # --- Single File Split Strategy ---
            # If only 1 long file, split into 5s chunks to check consistency against itself
            y = wavs[0]
            chunk_size = int(5 * 16000) # 5 seconds at 16kHz
            chunks = [y[i:i+chunk_size] for i in range(0, len(y), chunk_size) if len(y[i:i+chunk_size]) > chunk_size//2]
            
            if len(chunks) > 1:
                embeds = [voice_encoder.embed_utterance(c) for c in chunks]
            else:
                embeds = [voice_encoder.embed_utterance(y)] # Fallback
        else:
            # --- Multi-File Strategy ---
            embeds = [voice_encoder.embed_utterance(w) for w in wavs]

        # Calculate Score
        if len(embeds) > 1:
            sims = []
            for i in range(len(embeds)):
                for j in range(i + 1, len(embeds)):
                    sim = np.inner(embeds[i], embeds[j])
                    sims.append(sim)
            consistency_score = float(np.mean(sims))
        else:
            consistency_score = 1.0 

        # Enforce gate
        if consistency_score < 0.7:
            shutil.rmtree(voice_dir)
            raise HTTPException(400, detail=f"Voice consistency too low ({consistency_score:.2f}). Please upload clearer audio from a single speaker.")
            
    except Exception as e:
        logger.error(f"Validation failed: {e}")
        consistency_score = -1.0

    # 4. Save Metadata
    metadata = {
        "name": name,
        "uploaded_at": datetime.utcnow().isoformat() + "Z",
        "file_count": len(saved_files),
        "duration_total_sec": round(total_duration, 2),
        "consistency_score": round(consistency_score, 2),
        "warning": warning
    }
    (voice_dir / "metadata.json").write_text(json.dumps(metadata, indent=2))

    return {
        "message": "Voice processed successfully",
        "id": voice_id,
        "consistency_score": round(consistency_score, 2),
        "total_duration": round(total_duration, 2),
        "skipped_files": skipped_count,
        "warning": warning
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
    background_tasks: BackgroundTasks,
    text: str = Form(...),
    voice_id: str = Form(...),
    language: str = Form("en"),
    spectral_match: bool = Form(False, description="Enable for better timbre matching (slower)"),
    temperature: float = Form(0.75),
    length_penalty: float = Form(1.0),
    repetition_penalty: float = Form(5.0),
    top_k: int = Form(50),
    top_p: float = Form(0.85),
    seed: Optional[int] = Form(None, description="Random seed for deterministic generation")
):
    voice_dir = VOICES_DIR / voice_id
    if not voice_dir.exists():
        raise HTTPException(404, detail="Voice not found")

    speaker_wavs = sorted([str(p) for p in voice_dir.glob("reference_*.wav")])
    if not speaker_wavs:
        raise HTTPException(404, detail="No reference files found.")

    temp_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    output_path = temp_file.name
    temp_file.close()

    try:
        # Set seed for determinism if provided
        if seed is not None:
            random.seed(seed)
            np.random.seed(seed)
            torch.manual_seed(seed)
            if torch.cuda.is_available():
                torch.cuda.manual_seed_all(seed)
            # For MPS, manual_seed suffices

        # 1. Generate Raw Audio
        tts.tts_to_file(
            text=text,
            file_path=output_path,
            speaker_wav=speaker_wavs,
            language=language,
            split_sentences=True,
            temperature=temperature,
            length_penalty=length_penalty,
            repetition_penalty=repetition_penalty,
            top_k=top_k,
            top_p=top_p
        )

        # 2. Spectral Matching (Post-Processing)
        if spectral_match:
            try:
                # Average Reference Spectrum
                spec_refs = []
                for ref_path in speaker_wavs:
                    y_ref, _ = librosa.load(ref_path, sr=24000)
                    stft_ref = librosa.stft(y_ref)
                    spec_refs.append(np.mean(np.abs(stft_ref), axis=1))
                
                if spec_refs:
                    spec_ref_avg = np.mean(spec_refs, axis=0)

                    # Generated Spectrum
                    y_gen, sr_gen = librosa.load(output_path, sr=24000)
                    stft_gen = librosa.stft(y_gen)
                    spec_gen = np.mean(np.abs(stft_gen), axis=1)

                    # Calculate EQ Ratio (Clipped 0.5 - 2.0)
                    eq_ratio = np.clip(spec_ref_avg / (spec_gen + 1e-8), 0.5, 2.0)

                    # Smooth the EQ ratio to reduce artifacts
                    eq_ratio = savgol_filter(eq_ratio, window_length=11, polyorder=2)

                    # Apply Filter (Preserves Phase)
                    stft_eq = stft_gen * eq_ratio[:, np.newaxis]
                    y_eq = librosa.istft(stft_eq)

                    # Save result
                    y_eq = librosa.util.normalize(y_eq)
                    sf.write(output_path, y_eq, sr_gen)
                    logger.info("✨ Applied Spectral Matching")
            except Exception as e:
                logger.error(f"Spectral matching failed (serving raw output): {e}")

        # 3. Dynamic Range Compression (Post-Processing)
        try:
            audio_seg = AudioSegment.from_wav(output_path)
            audio_seg = effects.compress_dynamic_range(audio_seg, threshold=-20.0, ratio=4.0, attack=5, release=50)
            audio_seg.export(output_path, format="wav")
            logger.info("🔊 Applied Dynamic Compression")
        except Exception as e:
            logger.warning(f"Dynamic compression skipped: {e}")

    except Exception as e:
        os.unlink(output_path)
        raise HTTPException(500, detail=f"Generation failed: {str(e)}")

    background_tasks.add_task(cleanup_file, output_path)

    return FileResponse(
        output_path,
        media_type="audio/wav",
        filename=f"{voice_id}_gen.wav"
    )