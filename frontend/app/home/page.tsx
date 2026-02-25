'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { CreateVoiceModal } from '@/components/create-voice-modal';
import { colors } from '@/lib/colors';
import { toast } from 'sonner';
import { BounceLoader } from 'react-spinners';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Play } from 'lucide-react';

interface Voice {
  id: string;
  name: string;
  duration?: number;
  duration_sec?: number;
  uploaded_at: string;
  original_filename: string;
}

export default function HomePage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVoices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/voices`);
      if (!response.ok) {
        throw new Error('Failed to fetch voices');
      }
      const data = await response.json();
      setVoices(data.voices || []);
    } catch (error) {
      console.error('Error fetching voices:', error);
      toast.error((error as Error).message || 'Could not fetch voices.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVoices();
  }, []);

  const handleDelete = async (voiceId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/voices/${voiceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete voice');
      }
      
      const result = await response.json();
      toast.success(result.message || 'Voice deleted successfully!');
      fetchVoices(); // Refresh the list after deletion
    } catch (error) {
      console.error('Error deleting voice:', error);
      toast.error((error as Error).message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <section className="mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            <span className="text-black dark:text-white">Unleash Your </span>
            <span style={{ color: colors.emeraldGreen }}>Creativity</span>
            <span className="text-black dark:text-white">!</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            <span style={{ color: colors.emeraldGreen }}>Transform</span> text into voice with ease
          </p>
        </section>

        <section className="mb-12 sm:mb-16">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold">
              <span className="text-black dark:text-white">Your Voices </span>
              <span style={{ color: colors.emeraldGreen }}>({voices.length})</span>
            </h2>
            <button
              onClick={fetchVoices}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 cursor-pointer"
              style={{
                backgroundColor: `${colors.emeraldGreen}30`,
                color: colors.emeraldGreen
              }}
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <BounceLoader
                color={colors.emeraldGreen}
                loading={isLoading}
                size={60}
                aria-label="Loading Spinner"
                data-testid="loader"
              />
            </div>
          ) : voices.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400">No voices found. Create one!</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {voices.map((voice) => (
                <VoiceCard key={voice.id} voice={voice} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white">
              Create Voice
            </h2>
          </div>

          <div className="bg-gray-100 dark:bg-[#202020] rounded-2xl p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8">
              <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-2xl bg-gray-200 dark:bg-[#121212] flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="w-12 h-12 sm:w-14 sm:h-14">
                  <path d="M12 15C13.66 15 15 13.66 15 12V6C15 4.34 13.66 3 12 3C10.34 3 9 4.34 9 6V12C9 13.66 10.34 15 12 15Z" fill={colors.emeraldGreen} stroke={colors.emeraldGreen} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 12V13C19 16.866 15.866 20 12 20C8.13401 20 5 16.866 5 13V12" stroke={colors.emeraldGreen} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 20V23M12 23H15M12 23H9" stroke={colors.emeraldGreen} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <div className="flex-1 flex flex-col justify-center w-full lg:w-auto">
                <h3 className="text-xl sm:text-2xl font-semibold mb-2">
                  <span className="text-black dark:text-white">Voice </span>
                  <span style={{ color: colors.emeraldGreen }}>Creation</span>
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 max-w-xl">
                  Generate personalized AI voices from text.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full lg:w-auto px-8 py-2.5 rounded-full text-white font-medium transition-all self-start hover:bg-transparent border-2 hover:border-2 cursor-pointer"
                  style={{ backgroundColor: colors.emeraldGreen, borderColor: colors.emeraldGreen }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = colors.emeraldGreen;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.emeraldGreen;
                    e.currentTarget.style.color = 'white';
                  }}
                >
                  Create Voice
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <CreateVoiceModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  );
}

function VoiceCard({ voice, onDelete }: { voice: Voice; onDelete: (voiceId: string) => void }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePlay = () => {
    // This is a placeholder. To make this work, we need a way to serve the audio files.
    // For now, let's just log to the console.
    console.log("Playing audio for", voice.id);
    toast.info("Play functionality is not yet implemented for voice cards.");
  };

  const handleDeleteClick = async () => {
    setIsDeleting(true);
    await onDelete(voice.id);
    // No need to set isDeleting to false if the component unmounts after deletion
  };
  
  return (
    <div className="rounded-2xl overflow-hidden flex flex-col h-full bg-gray-100 dark:bg-[#202020] transition-all ease-in-out duration-300 hover:scale-105">
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h3 className="text-base sm:text-lg font-semibold text-black dark:text-white mb-2">{voice.name}</h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
          Duration: <span style={{ color: colors.emeraldGreen }}>{(voice.duration ?? voice.duration_sec) != null ? (voice.duration ?? voice.duration_sec)!.toFixed(1) : 'N/A'}s</span>
        </p>
         <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
          ID: <span className="font-mono">{voice.id}</span>
        </p>

        <div className="mt-auto space-y-3">
          <div className="flex gap-2">
             <button
              onClick={handlePlay}
              className="flex-1 py-2 rounded-full text-sm font-medium border-2 transition-all ease-in-out duration-300 cursor-pointer flex items-center justify-center"
              style={{
                borderColor: colors.emeraldGreen,
                color: colors.emeraldGreen
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.emeraldGreen;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.emeraldGreen;
              }}
            >
              <Play className="w-4 h-4 mr-1" />
              Play
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  disabled={isDeleting}
                  className="flex-1 py-2 rounded-full text-sm font-medium border-2 transition-all ease-in-out duration-300 cursor-pointer disabled:opacity-50"
                   style={{
                    borderColor: colors.emeraldGreen,
                    color: colors.emeraldGreen
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.emeraldGreen;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = colors.emeraldGreen;
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the voice &ldquo;{voice.name}&rdquo;.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteClick}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
