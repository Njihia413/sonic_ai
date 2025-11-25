'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { colors } from '@/lib/colors';

interface CreateVoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateVoiceModal({ open, onOpenChange }: CreateVoiceModalProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<'record' | 'upload' | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleRecordClick = () => {
    onOpenChange(false);
    router.push('/record');
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

      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      console.log('Uploading file:', selectedFile);
    }
  };

  const resetModal = () => {
    setSelectedOption(null);
    setSelectedFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetModal();
    }}>
      <DialogContent
        className="max-w-md !w-[calc(100%-2rem)] sm:!w-full rounded-xl bg-white dark:bg-[#0A0A0A] text-black dark:text-white border-gray-300 dark:border-gray-700"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-black dark:text-white">
            Create Voice
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Choose how you'd like to create your voice
          </DialogDescription>
        </DialogHeader>

        {!selectedOption ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <button
              onClick={() => setSelectedOption('record')}
              className="p-6 rounded-xl border-2 bg-gray-50 dark:bg-[#1A1A1A] border-gray-200 dark:border-gray-700 transition-all ease-in-out duration-300 flex flex-col items-center gap-4 group"
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
              className="p-6 rounded-xl border-2 bg-gray-50 dark:bg-[#1A1A1A] border-gray-200 dark:border-gray-700 transition-all ease-in-out duration-300 flex flex-col items-center gap-4 group"
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
                You'll be redirected to the recording page where you can record your voice sample.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Recommended: 5-30 seconds
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetModal}
                className="flex-1 px-4 py-2.5 rounded-full border-2 font-medium transition-all ease-in-out duration-300"
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
                className="flex-1 px-4 py-2.5 rounded-full font-medium transition-all ease-in-out duration-300"
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
                    MP3, WAV, OGG, or M4A (5-30 seconds recommended)
                  </p>
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.ogg,.m4a"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              ) : (
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
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-2 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetModal}
                className="flex-1 px-4 py-2.5 rounded-full border-2 font-medium transition-all ease-in-out duration-300"
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
                disabled={!selectedFile}
                className="flex-1 px-4 py-2.5 rounded-full font-medium transition-all ease-in-out duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: colors.emeraldGreen,
                  color: colors.white
                }}
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
