'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Pause, Play, Check, RotateCcw, Sparkles, CheckCircle } from 'lucide-react';
import { colors } from '@/lib/colors';
import { Navbar } from '@/components/navbar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const MIN_RECORDING_TIME = 15; // seconds — visual countdown only
const SILENCE_VOLUME_THRESHOLD = 5; // out of 255 — volume below this = silence
const SILENCE_CHECK_INTERVAL = 100; // ms between volume checks
const MAX_SILENCE_DURATION = 3000; // 3s of silence triggers auto-stop (post-15s)
const KEEP_SPEAKING_DELAY = 1000; // 1s of silence before showing nudge (pre-15s)

const convertToWav = async (webmBlob: Blob): Promise<Blob> => {
  const audioContext = new AudioContext();
  const arrayBuffer = await webmBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length * numberOfChannels * 2;

  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length, true);

  const channelData = [];
  for (let channel = 0; channel < numberOfChannels; channel++) {
    channelData.push(audioBuffer.getChannelData(channel));
  }

  let offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
};

export default function RecordPage() {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [voiceName, setVoiceName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);
  const [showKeepSpeaking, setShowKeepSpeaking] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const silenceCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceAccumulatorRef = useRef(0);
  const recordingTimeRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (silenceCheckIntervalRef.current) {
        clearInterval(silenceCheckIntervalRef.current);
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      setSilenceCountdown(null);
      setShowKeepSpeaking(false);
      silenceAccumulatorRef.current = 0;
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (silenceCheckIntervalRef.current) {
        clearInterval(silenceCheckIntervalRef.current);
      }
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up Web Audio API analyser for live waveform
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const webmBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const wavBlob = await convertToWav(webmBlob);
        setAudioBlob(wavBlob);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
          analyserRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      recordingTimeRef.current = 0;

      timerIntervalRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // --- Silence detection ---
      silenceAccumulatorRef.current = 0;
      silenceCheckIntervalRef.current = setInterval(() => {
        if (!analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Average volume across all frequency bins
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avgVolume = sum / bufferLength;

        if (avgVolume < SILENCE_VOLUME_THRESHOLD) {
          // Accumulate silence
          silenceAccumulatorRef.current += SILENCE_CHECK_INTERVAL;

          const currentTime = recordingTimeRef.current;

          if (currentTime < MIN_RECORDING_TIME) {
            // Pre-15s: show "Keep speaking" nudge after 1s of silence
            if (silenceAccumulatorRef.current >= KEEP_SPEAKING_DELAY) {
              setShowKeepSpeaking(true);
            }
          } else {
            // Post-15s: show countdown and auto-stop after 3s
            setShowKeepSpeaking(false);
            if (silenceAccumulatorRef.current >= MAX_SILENCE_DURATION) {
              // Auto-stop!
              setSilenceCountdown(null);
              stopRecording();
            } else if (silenceAccumulatorRef.current >= 1000) {
              // Show countdown after 1s of silence
              const remaining = Math.ceil((MAX_SILENCE_DURATION - silenceAccumulatorRef.current) / 1000);
              setSilenceCountdown(remaining);
            }
          }
        } else {
          // Sound detected — reset everything
          silenceAccumulatorRef.current = 0;
          setSilenceCountdown(null);
          setShowKeepSpeaking(false);
        }
      }, SILENCE_CHECK_INTERVAL);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please ensure you have granted permission.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      setSilenceCountdown(null);
      setShowKeepSpeaking(false);
      silenceAccumulatorRef.current = 0;
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (silenceCheckIntervalRef.current) {
        clearInterval(silenceCheckIntervalRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      silenceAccumulatorRef.current = 0;

      timerIntervalRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Restart silence detection
      silenceCheckIntervalRef.current = setInterval(() => {
        if (!analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avgVolume = sum / bufferLength;

        if (avgVolume < SILENCE_VOLUME_THRESHOLD) {
          silenceAccumulatorRef.current += SILENCE_CHECK_INTERVAL;
          const currentTime = recordingTimeRef.current;

          if (currentTime < MIN_RECORDING_TIME) {
            if (silenceAccumulatorRef.current >= KEEP_SPEAKING_DELAY) {
              setShowKeepSpeaking(true);
            }
          } else {
            setShowKeepSpeaking(false);
            if (silenceAccumulatorRef.current >= MAX_SILENCE_DURATION) {
              setSilenceCountdown(null);
              stopRecording();
            } else if (silenceAccumulatorRef.current >= 1000) {
              const remaining = Math.ceil((MAX_SILENCE_DURATION - silenceAccumulatorRef.current) / 1000);
              setSilenceCountdown(remaining);
            }
          }
        } else {
          silenceAccumulatorRef.current = 0;
          setSilenceCountdown(null);
          setShowKeepSpeaking(false);
        }
      }, SILENCE_CHECK_INTERVAL);
    }
  };

  const retryRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    setIsRecording(false);
    setIsPaused(false);
    setSilenceCountdown(null);
    setShowKeepSpeaking(false);
    silenceAccumulatorRef.current = 0;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (silenceCheckIntervalRef.current) {
      clearInterval(silenceCheckIntervalRef.current);
    }
  };

  const saveRecording = () => {
    if (audioBlob) {
      setShowNameModal(true);
    }
  };

  const handleSaveWithName = async () => {
    if (!voiceName.trim()) {
      toast.error('Please enter a voice name');
      return;
    }

    if (!audioBlob) {
      toast.error('No audio to save');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('name', voiceName.trim());
    formData.append('files', audioBlob, `${voiceName.trim().replace(/\s+/g, '_')}.wav`);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/voices`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save voice');
      }

      const result = await response.json();

      // Store the newly created voice details for the chat page
      const audioUrl = URL.createObjectURL(audioBlob);
      const newVoiceForChat = {
        id: result.id,
        name: result.name,
        audio_url: audioUrl,
      };
      sessionStorage.setItem('selectedVoice', JSON.stringify(newVoiceForChat));

      toast.success(result.message || 'Voice saved successfully!');
      setShowNameModal(false);
      router.push('/chat');

    } catch (error) {
      console.error('Error saving voice:', error);
      toast.error((error as Error).message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  const progressRatio = Math.min(recordingTime / MIN_RECORDING_TIME, 1);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 text-black dark:text-white">
            Record Your Voice
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isRecording
              ? isPaused
                ? 'Recording paused'
                : 'Recording in progress...'
              : audioBlob
              ? 'Recording complete! Save or retry?'
              : 'Tap the microphone to start recording'
            }
          </p>
        </div>

        <div className="relative flex items-center justify-center mb-12">
          <LiveWaveVisualization
            isActive={isRecording && !isPaused}
            analyser={analyserRef.current}
            progressRatio={isRecording ? progressRatio : 0}
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div
                className="text-5xl font-bold mb-2"
                style={{ color: colors.emeraldGreen }}
              >
                {formatTime(recordingTime)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {isRecording
                  ? recordingTime < MIN_RECORDING_TIME
                    ? `Min ${MIN_RECORDING_TIME - recordingTime}s more`
                    : '✓ Min reached · stop anytime'
                  : audioBlob ? 'Complete' : 'Ready'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          {!isRecording && !audioBlob ? (
            <button
              onClick={startRecording}
              className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
              style={{ backgroundColor: colors.emeraldGreen }}
            >
              <Mic className="w-10 h-10 text-white" />
            </button>
          ) : isRecording ? (
            <>
              <button
                onClick={isPaused ? resumeRecording : pauseRecording}
                className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-all duration-300 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
              >
                {isPaused ? (
                  <Play className="w-7 h-7 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Pause className="w-7 h-7 text-gray-700 dark:text-gray-300" />
                )}
              </button>

              <button
                onClick={stopRecording}
                className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
                style={{ backgroundColor: colors.emeraldGreen }}
              >
                <Check className="w-10 h-10 text-white" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={retryRecording}
                className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-all duration-300 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
              >
                <RotateCcw className="w-7 h-7 text-gray-700 dark:text-gray-300" />
              </button>

              <button
                onClick={saveRecording}
                className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
                style={{ backgroundColor: colors.emeraldGreen }}
              >
                <Check className="w-10 h-10 text-white" />
              </button>
            </>
          )}
        </div>

        {isRecording && (
          <div className="mt-8 text-center">
            {showKeepSpeaking ? (
              <p className="text-sm text-amber-500 animate-pulse font-medium">
                Keep speaking…
              </p>
            ) : silenceCountdown !== null ? (
              <p className="text-sm text-amber-500 font-medium">
                Auto-stopping in {silenceCountdown}s…
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Recommended: 15-30 seconds for best results
              </p>
            )}
          </div>
        )}

        {!isRecording && !audioBlob && (
          <div className="mt-10 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-white/3 backdrop-blur-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4" style={{ color: colors.emeraldGreen }} />
              <span className="text-sm font-semibold text-black dark:text-white">Tips for the best voice clone</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: colors.emeraldGreen }} />
                <span>Speak <strong className="text-black dark:text-white">continuously</strong>, pauses and silence will be trimmed</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: colors.emeraldGreen }} />
                <span>Use your <strong className="text-black dark:text-white">natural tone</strong> eg read a paragraph or describe your day</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: colors.emeraldGreen }} />
                <span>Aim for <strong className="text-black dark:text-white">15–30 seconds</strong> of uninterrupted speech</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>

    <Dialog open={showNameModal} onOpenChange={setShowNameModal}>
      <DialogContent className="max-w-md w-[calc(100%-2rem)]! sm:w-full! rounded-xl bg-white dark:bg-[#0A0A0A] text-black dark:text-white border-gray-300 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-black dark:text-white">
            Name Your Voice
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Give your recorded voice a unique name
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="voiceName" className="text-black dark:text-white">
              Voice Name
            </Label>
            <Input
              id="voiceName"
              value={voiceName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVoiceName(e.target.value)}
              placeholder="e.g., My Voice, Professional Voice"
              className="mt-2 h-14 bg-transparent border border-gray-400 dark:border-gray-600 rounded-full px-4 text-black dark:text-white focus:outline-none transition-colors focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{ '--tw-ring-color': colors.emeraldGreen } as React.CSSProperties}
              onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.style.borderColor = colors.emeraldGreen}
              onBlur={(e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.style.borderColor = ''}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && !isSubmitting) {
                  handleSaveWithName();
                }
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowNameModal(false)}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-full border-2 font-medium transition-all ease-in-out duration-300 disabled:opacity-50 cursor-pointer"
              style={{
                borderColor: colors.emeraldGreen,
                color: colors.emeraldGreen,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveWithName}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-full font-medium transition-all ease-in-out duration-300 disabled:opacity-50 cursor-pointer"
              style={{
                backgroundColor: colors.emeraldGreen,
                color: colors.white
              }}
            >
              {isSubmitting ? 'Saving...' : 'Save Voice'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
}

// --- Live Waveform Visualization (Web Audio API AnalyserNode) ---
function LiveWaveVisualization({ isActive, analyser, progressRatio }: {
  isActive: boolean;
  analyser: AnalyserNode | null;
  progressRatio: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [frequencyData, setFrequencyData] = useState<number[]>(new Array(32).fill(0));

  useEffect(() => {
    if (!isActive || !analyser) {
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const animate = () => {
      analyser.getByteFrequencyData(dataArray);

      // Extract 32 evenly-spaced bins
      const bars = 32;
      const step = Math.floor(bufferLength / bars);
      const newData: number[] = [];
      for (let i = 0; i < bars; i++) {
        newData.push(dataArray[i * step] / 255);
      }
      setFrequencyData(newData);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isActive, analyser]);

  // Draw using canvas for smooth rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 320;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;

    ctx.clearRect(0, 0, size, size);

    // Outer pulsing glow circle
    const gradient = ctx.createRadialGradient(centerX, centerY, 40, centerX, centerY, 140);
    gradient.addColorStop(0, `${colors.emeraldGreen}40`);
    gradient.addColorStop(0.7, `${colors.emeraldGreen}15`);
    gradient.addColorStop(1, `${colors.emeraldGreen}00`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 140, 0, Math.PI * 2);
    ctx.fill();

    // Inner glow
    const innerGradient = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, 100);
    innerGradient.addColorStop(0, `${colors.emeraldGreen}50`);
    innerGradient.addColorStop(0.5, `${colors.emeraldGreen}20`);
    innerGradient.addColorStop(1, `${colors.emeraldGreen}08`);
    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
    ctx.fill();

    // Progress ring (15s minimum visual indicator)
    if (progressRatio > 0) {
      const ringRadius = 130;
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (2 * Math.PI * progressRatio);

      // Background ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `${colors.emeraldGreen}15`;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Progress arc — amber while counting down, fades to emerald when done
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, startAngle, endAngle);
      const ringColor = progressRatio >= 1 ? colors.emeraldGreen : '#F59E0B';
      const ringOpacity = progressRatio >= 1 ? '50' : 'CC';
      ctx.strokeStyle = `${ringColor}${ringOpacity}`;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Radial frequency bars
    const barCount = frequencyData.length;
    const baseRadius = 70;

    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
      const value = frequencyData[i];
      const barLength = 8 + value * 35;

      const startX = centerX + Math.cos(angle) * baseRadius;
      const startY = centerY + Math.sin(angle) * baseRadius;
      const endX = centerX + Math.cos(angle) * (baseRadius + barLength);
      const endY = centerY + Math.sin(angle) * (baseRadius + barLength);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = `${colors.emeraldGreen}${Math.round((0.4 + value * 0.6) * 255).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Static ring outlines (decorative)
    [85, 110].forEach((r, i) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.strokeStyle = `${colors.emeraldGreen}${i === 0 ? '30' : '18'}`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

  }, [frequencyData, progressRatio]);

  return (
    <div className="relative w-80 h-80">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: 320, height: 320 }}
      />
    </div>
  );
}
