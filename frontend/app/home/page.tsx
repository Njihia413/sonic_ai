'use client';

import { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { CreateVoiceModal } from '@/components/create-voice-modal';
import { colors } from '@/lib/colors';

export default function HomePage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

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
              <span style={{ color: colors.emeraldGreen }}>(List)</span>
            </h2>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 cursor-pointer"
              style={{
                backgroundColor: `${colors.emeraldGreen}30`,
                color: colors.emeraldGreen
              }}
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            <VoiceCard
              title="Podcast Intro"
              duration="1:20"
              imageUrl="https://images.pexels.com/photos/7088534/pexels-photo-7088534.jpeg?auto=compress&cs=tinysrgb&w=800"
            />
            <VoiceCard
              title="Audiobook Narration"
              duration="1:20"
              imageUrl="https://images.pexels.com/photos/159581/dictionary-reference-book-learning-meaning-159581.jpeg?auto=compress&cs=tinysrgb&w=800"
            />
            <VoiceCard
              title="Custom Greeting"
              duration="1:20"
              imageUrl="https://images.pexels.com/photos/887751/pexels-photo-887751.jpeg?auto=compress&cs=tinysrgb&w=800"
            />
          </div>
        </section>

        <section>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white">
              Create Voice
            </h2>
          </div>

          <div className="bg-gray-100 dark:bg-[#202020] rounded-2xl p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8">
              <div className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-2xl bg-gray-200 dark:bg-[#121212] flex items-center justify-center">
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
                  Generate personalized AI voices from text with customizable options.
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

function VoiceCard({ title, duration, imageUrl }: { title: string; duration: string; imageUrl: string }) {
  return (
    <div className="rounded-2xl overflow-hidden flex flex-col h-full cursor-pointer transition-all ease-in-out duration-300 hover:scale-105">
      <div className="relative h-48 bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="bg-gray-100 dark:bg-[#202020] p-4 sm:p-5 flex flex-col flex-1">
        <h3 className="text-base sm:text-lg font-semibold text-black dark:text-white mb-2">{title}</h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
          Duration: <span style={{ color: colors.emeraldGreen }}>{duration}</span>
        </p>

        <div className="mt-auto space-y-3">
          <div className="flex gap-2">
            <button
              className="flex-1 py-2 rounded-full text-sm font-medium border-2 transition-all ease-in-out duration-300 cursor-pointer"
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
              Play
            </button>
            <button
              className="flex-1 py-2 rounded-full text-sm font-medium border-2 transition-all ease-in-out duration-300 cursor-pointer"
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
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
