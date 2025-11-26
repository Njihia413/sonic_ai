"use client";
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Mic, Pause, Play, Check, RotateCcw } from 'lucide-react';
import { colors } from '@/lib/colors';

export default function RecordPage() {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please ensure you have granted permission.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const retryRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setIsRecording(false);
    setIsPaused(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  const saveRecording = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      localStorage.setItem('recordedAudioUrl', audioUrl);
      localStorage.setItem('recordedAudioBlob', 'true');
      router.push('/chat');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
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
          <WaveVisualization isActive={isRecording && !isPaused} />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div
                className="text-5xl font-bold mb-2"
                style={{ color: colors.emeraldGreen }}
              >
                {formatTime(recordingTime)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {isRecording ? 'Recording' : audioBlob ? 'Complete' : 'Ready'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          {!isRecording && !audioBlob ? (
            <button
              onClick={startRecording}
              className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl"
              style={{ backgroundColor: colors.emeraldGreen }}
            >
              <Mic className="w-10 h-10 text-white" />
            </button>
          ) : isRecording ? (
            <>
              <button
                onClick={isPaused ? resumeRecording : pauseRecording}
                className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-all duration-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {isPaused ? (
                  <Play className="w-7 h-7 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Pause className="w-7 h-7 text-gray-700 dark:text-gray-300" />
                )}
              </button>

              <button
                onClick={stopRecording}
                className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{ backgroundColor: colors.emeraldGreen }}
              >
                <Check className="w-10 h-10 text-white" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={retryRecording}
                className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-all duration-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <RotateCcw className="w-7 h-7 text-gray-700 dark:text-gray-300" />
              </button>

              <button
                onClick={saveRecording}
                className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{ backgroundColor: colors.emeraldGreen }}
              >
                <Check className="w-10 h-10 text-white" />
              </button>
            </>
          )}
        </div>

        {isRecording && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Recommended: 5-30 seconds for best results
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function WaveVisualization({ isActive }: { isActive: boolean }) {
  return (
    <div className="relative w-80 h-80">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <radialGradient id="waveGradientOuter" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.emeraldGreen} stopOpacity="0.4" />
            <stop offset="70%" stopColor={colors.emeraldGreen} stopOpacity="0.2" />
            <stop offset="100%" stopColor={colors.emeraldGreen} stopOpacity="0" />
          </radialGradient>

          <radialGradient id="waveGradientInner" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.emeraldGreen} stopOpacity="0.6" />
            <stop offset="50%" stopColor={colors.emeraldGreen} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colors.emeraldGreen} stopOpacity="0.1" />
          </radialGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <circle
          cx="100"
          cy="100"
          r="85"
          fill="url(#waveGradientOuter)"
          className={`transition-all duration-1000 ${isActive ? 'animate-pulse' : ''}`}
          style={{ animationDuration: '2s' }}
        />

        <circle
          cx="100"
          cy="100"
          r="65"
          fill="url(#waveGradientInner)"
          className={`transition-all duration-1000 ${isActive ? 'animate-pulse' : ''}`}
          style={{ animationDuration: '1.5s' }}
        />

        <circle
          cx="100"
          cy="100"
          r="75"
          fill="none"
          stroke={colors.emeraldGreen}
          strokeWidth="1.5"
          opacity="0.4"
          className={isActive ? 'animate-ping' : ''}
          style={{ animationDuration: '2.5s' }}
        />

        <circle
          cx="100"
          cy="100"
          r="60"
          fill="none"
          stroke={colors.emeraldGreen}
          strokeWidth="1.5"
          opacity="0.5"
          className={isActive ? 'animate-ping' : ''}
          style={{ animationDuration: '2s', animationDelay: '0.3s' }}
        />

        <circle
          cx="100"
          cy="100"
          r="45"
          fill="none"
          stroke={colors.emeraldGreen}
          strokeWidth="2"
          opacity="0.6"
          filter="url(#glow)"
          className={isActive ? 'animate-ping' : ''}
          style={{ animationDuration: '1.5s', animationDelay: '0.5s' }}
        />

        {isActive && (
          <>
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              const baseRadius = 48;
              const barLength = 8 + Math.random() * 4;
              const startX = 100 + Math.cos(angle) * baseRadius;
              const startY = 100 + Math.sin(angle) * baseRadius;
              const endX = 100 + Math.cos(angle) * (baseRadius + barLength);
              const endY = 100 + Math.sin(angle) * (baseRadius + barLength);

              return (
                <line
                  key={i}
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke={colors.emeraldGreen}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.8"
                  filter="url(#glow)"
                  className="animate-pulse"
                  style={{
                    animationDuration: `${0.8 + Math.random() * 0.4}s`,
                    animationDelay: `${i * 0.08}s`
                  }}
                />
              );
            })}
          </>
        )}
      </svg>
    </div>
  );
}
