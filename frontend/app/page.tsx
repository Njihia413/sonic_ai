'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { LoginForm } from '@/components/auth/login-form';
import { SignUpForm } from '@/components/auth/signup-form';
import { colors } from '@/lib/colors';

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-between px-6 py-12">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center space-y-8 max-w-2xl w-full">
            <div className="text-center space-y-3">
              <h1 className="text-5xl md:text-7xl font-semibold tracking-tight">
                <span className="text-white">Sonic</span>
                <span style={{ color: colors.emeraldGreen }}>AI</span>
              </h1>
              <p className="text-gray-300 text-base md:text-lg font-light tracking-wide">
                Bringing Your Words to Life
              </p>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2 mt-12">
              <div className="w-1 h-8 md:w-1.5 md:h-12 rounded-full animate-pulse" style={{ backgroundColor: colors.emeraldGreen, animationDelay: '0ms', animationDuration: '800ms' }}></div>
              <div className="w-1 h-12 md:w-1.5 md:h-16 rounded-full animate-pulse" style={{ backgroundColor: colors.emeraldGreen, animationDelay: '100ms', animationDuration: '800ms' }}></div>
              <div className="w-1 h-6 md:w-1.5 md:h-10 rounded-full animate-pulse" style={{ backgroundColor: colors.emeraldGreen, animationDelay: '200ms', animationDuration: '800ms' }}></div>
              <div className="w-1 h-14 md:w-1.5 md:h-20 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms', animationDuration: '800ms' }}></div>
              <div className="w-1 h-8 md:w-1.5 md:h-12 rounded-full animate-pulse" style={{ backgroundColor: colors.emeraldGreen, animationDelay: '350ms', animationDuration: '800ms' }}></div>
              <div className="w-1 h-10 md:w-1.5 md:h-14 bg-white rounded-full animate-pulse" style={{ animationDelay: '400ms', animationDuration: '800ms' }}></div>
              <div className="w-1 h-12 md:w-1.5 md:h-16 bg-white rounded-full animate-pulse" style={{ animationDelay: '450ms', animationDuration: '800ms' }}></div>
              <div className="w-1 h-6 md:w-1.5 md:h-10 rounded-full animate-pulse" style={{ backgroundColor: colors.emeraldGreen, animationDelay: '500ms', animationDuration: '800ms' }}></div>
              <div className="w-1 h-14 md:w-1.5 md:h-20 bg-white rounded-full animate-pulse" style={{ animationDelay: '550ms', animationDuration: '800ms' }}></div>
              <div className="w-1 h-8 md:w-1.5 md:h-12 bg-white rounded-full animate-pulse" style={{ animationDelay: '600ms', animationDuration: '800ms' }}></div>
              <div className="w-1 h-12 md:w-1.5 md:h-16 rounded-full animate-pulse" style={{ backgroundColor: colors.emeraldGreen, animationDelay: '650ms', animationDuration: '800ms' }}></div>
              <div className="w-1 h-6 md:w-1.5 md:h-10 bg-white rounded-full animate-pulse" style={{ animationDelay: '700ms', animationDuration: '800ms' }}></div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowLoginModal(true)}
          className="flex items-center gap-2 font-bold hover:underline group"
          style={{ color: colors.emeraldGreen }}
        >
          Get Started
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <LoginForm
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onSignUpClick={() => setShowSignUpModal(true)}
      />
      <SignUpForm
        open={showSignUpModal}
        onOpenChange={setShowSignUpModal}
        onSignInClick={() => setShowLoginModal(true)}
      />
    </>
  );
}
