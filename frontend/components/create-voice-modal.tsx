'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Upload, X, Play, Pause } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { colors } from '@/lib/colors';
import { toast } from 'sonner';

interface CreateVoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateVoiceModal({ open, onOpenChange }: CreateVoiceModalProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<'record' | 'upload' | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewAnimRef = useRef<number>(0);

  const handleRecordClick = () => {
    onOpenChange(false);
    router.push('/record');
  };

  // Clean up preview audio on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = '';
      }
      cancelAnimationFrame(previewAnimRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanupPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.src = '';
      previewAudioRef.current = null;
    }
    cancelAnimationFrame(previewAnimRef.current);
    setPreviewUrl(null);
    setIsPreviewPlaying(false);
    setPreviewProgress(0);
    setPreviewDuration(0);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validFormats = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/m4a'];
      const maxSize = 10 * 1024 * 1024;

      if (!validFormats.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
        alert('Please upload a valid audio file (MP3, WAV, OGG, or M4A)');
        return;
      }

      if (file.size > maxSize) {
        alert('File size must be less than 10MB');
        return;
      }

      // Clean up old preview
      cleanupPreview();

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setSelectedFile(file);

      // Set up audio element for preview
      const audio = new Audio(url);
      previewAudioRef.current = audio;
      audio.addEventListener('loadedmetadata', () => {
        setPreviewDuration(audio.duration);
      });
      audio.addEventListener('ended', () => {
        setIsPreviewPlaying(false);
        setPreviewProgress(0);
        cancelAnimationFrame(previewAnimRef.current);
      });
    }
  };

  const togglePreview = () => {
    const audio = previewAudioRef.current;
    if (!audio) return;

    if (isPreviewPlaying) {
      audio.pause();
      cancelAnimationFrame(previewAnimRef.current);
      setIsPreviewPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPreviewPlaying(true);

      const updateProgress = () => {
        if (audio.duration) {
          setPreviewProgress(audio.currentTime / audio.duration);
        }
        previewAnimRef.current = requestAnimationFrame(updateProgress);
      };
      previewAnimRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const formatPreviewTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleUpload = async () => {
    if (!voiceName.trim()) {
      toast.error('Please enter a voice name');
      return;
    }

    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('name', voiceName.trim());
    formData.append('file', selectedFile, selectedFile.name);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/voices`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload file');
      }

      const result = await response.json();

      // Store the newly created voice details for the chat page
      const audioUrl = URL.createObjectURL(selectedFile);
      const newVoiceForChat = {
        id: result.id,
        name: result.name,
        audio_url: audioUrl,
      };
      sessionStorage.setItem('selectedVoice', JSON.stringify(newVoiceForChat));

      toast.success(result.message || 'File uploaded successfully!');
      onOpenChange(false);
      router.push('/chat');

    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error((error as Error).message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setSelectedOption(null);
    setSelectedFile(null);
    setVoiceName('');
    cleanupPreview();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetModal();
    }}>
      <DialogContent
        className="max-w-md w-[calc(100%-2rem)]! sm:w-full! rounded-xl bg-white dark:bg-[#0A0A0A] text-black dark:text-white border-gray-300 dark:border-gray-700"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-black dark:text-white">
            Create Voice
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Choose how you&apos;d like to create your voice
          </DialogDescription>
        </DialogHeader>

        {!selectedOption ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <button
              onClick={() => setSelectedOption('record')}
              className="p-6 rounded-xl border-2 bg-gray-50 dark:bg-[#1A1A1A] border-gray-200 dark:border-gray-700 transition-all ease-in-out duration-300 flex flex-col items-center gap-4 group cursor-pointer"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.emeraldGreen}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300"
                style={{ backgroundColor: `${colors.emeraldGreen}20` }}
              >
                <Mic className="w-8 h-8" style={{ color: colors.emeraldGreen }} />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-1 text-black dark:text-white">Record Voice</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Record your voice directly
                </p>
              </div>
            </button>

            <button
              onClick={() => setSelectedOption('upload')}
              className="p-6 rounded-xl border-2 bg-gray-50 dark:bg-[#1A1A1A] border-gray-200 dark:border-gray-700 transition-all ease-in-out duration-300 flex flex-col items-center gap-4 group cursor-pointer"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.emeraldGreen}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300"
                style={{ backgroundColor: `${colors.emeraldGreen}20` }}
              >
                <Upload className="w-8 h-8" style={{ color: colors.emeraldGreen }} />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-1 text-black dark:text-white">Upload Audio</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload an audio file
                </p>
              </div>
            </button>
          </div>
        ) : selectedOption === 'record' ? (
          <div className="space-y-4 mt-4">
            <div className="p-6 rounded-xl border-2 bg-gray-50 dark:bg-[#1A1A1A] border-gray-200 dark:border-gray-700 text-center">
              <Mic className="w-12 h-12 mx-auto mb-3" style={{ color: colors.emeraldGreen }} />
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                You&apos;ll be redirected to the recording page where you can record your voice sample.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Recommended: 15-30 seconds
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetModal}
                className="flex-1 px-4 py-2.5 rounded-full border-2 font-medium transition-all ease-in-out duration-300 cursor-pointer"
                style={{
                  borderColor: colors.emeraldGreen,
                  color: colors.emeraldGreen,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.emeraldGreen;
                  e.currentTarget.style.color = colors.white;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = colors.emeraldGreen;
                }}
              >
                Back
              </button>
              <button
                onClick={handleRecordClick}
                className="flex-1 px-4 py-2.5 rounded-full font-medium transition-all ease-in-out duration-300 cursor-pointer"
                style={{
                  backgroundColor: colors.emeraldGreen,
                  color: colors.white
                }}
              >
                Start Recording
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="p-6 rounded-xl border-2 border-dashed bg-gray-50 dark:bg-[#1A1A1A] border-gray-200 dark:border-gray-700">
              {!selectedFile ? (
                <label className="cursor-pointer flex flex-col items-center">
                  <Upload className="w-12 h-12 mb-3" style={{ color: colors.emeraldGreen }} />
                  <p className="mb-2 text-center text-gray-600 dark:text-gray-400">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-center text-gray-500 dark:text-gray-500">
                    MP3, WAV, OGG, or M4A (10-30 seconds recommended)
                  </p>
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.ogg,.m4a"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${colors.emeraldGreen}20` }}
                      >
                        <Upload className="w-5 h-5" style={{ color: colors.emeraldGreen }} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-black dark:text-white">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          {previewDuration > 0 && (
                            <>
                              {' · '}
                              <span style={{
                                color: previewDuration < 10 ? '#EF4444' : colors.emeraldGreen
                              }}>
                                {previewDuration.toFixed(1)}s
                              </span>
                              {previewDuration < 10 && (
                                <span className="text-red-500"> (too short)</span>
                              )}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedFile(null); cleanupPreview(); }}
                      className="p-2 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  {/* Audio Preview Player */}
                  {previewUrl && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-[#121212]">
                      <button
                        onClick={togglePreview}
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                        style={{ color: colors.emeraldGreen }}
                      >
                        {isPreviewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-100"
                          style={{
                            width: `${previewProgress * 100}%`,
                            backgroundColor: colors.emeraldGreen,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono shrink-0">
                        {formatPreviewTime(previewDuration)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedFile && (
              <div>
                <Label htmlFor="uploadVoiceName" className="text-black dark:text-white">
                  Voice Name
                </Label>
                <Input
                  id="uploadVoiceName"
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  placeholder="e.g., My Voice, Professional Voice"
                  className="mt-2 h-14 bg-transparent border border-gray-400 dark:border-gray-600 rounded-full px-4 text-black dark:text-white focus:outline-none transition-colors focus-visible:ring-0 focus-visible:ring-offset-0"
                  style={{ '--tw-ring-color': colors.emeraldGreen } as React.CSSProperties}
                  onFocus={(e) => (e.currentTarget.style.borderColor = colors.emeraldGreen)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isSubmitting) {
                      handleUpload();
                    }
                  }}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={resetModal}
                className="flex-1 px-4 py-2.5 rounded-full border-2 font-medium transition-all ease-in-out duration-300 cursor-pointer"
                style={{
                  borderColor: colors.emeraldGreen,
                  color: colors.emeraldGreen,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.emeraldGreen;
                  e.currentTarget.style.color = colors.white;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = colors.emeraldGreen;
                }}
              >
                Back
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-full font-medium transition-all ease-in-out duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: colors.emeraldGreen,
                  color: colors.white
                }}
              >
                {isSubmitting ? 'Uploading...' : 'Continue'}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
