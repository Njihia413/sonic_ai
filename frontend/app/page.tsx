'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { LoginForm } from '@/components/auth/login-form';
import { SignUpForm } from '@/components/auth/signup-form';
import { ThemeToggle } from '@/components/theme-toggle';
import { colors } from '@/lib/colors';

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex flex-col items-center justify-between px-6 py-12">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center space-y-8 max-w-2xl w-full">
            <div className="text-center space-y-3">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-5xl md:text-7xl font-semibold tracking-tight"
              >
                <span className="dark:text-white text-black">Sonic</span>
                <span style={{ color: colors.emeraldGreen }}>AI</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="text-gray-700 dark:text-gray-300 text-base md:text-lg font-light tracking-wide"
              >
                Bringing Your Words to Life
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="flex items-center gap-1.5 md:gap-2 mt-12 h-20 md:h-24"
            >
              {[...Array(12)].map((_, i) => {
                const isEmerald = [0, 1, 2, 4, 7, 10].includes(i);
                // Fixed pseudo-random heights for aesthetic wave feeling
                const heights = [
                  ["30%", "60%", "30%"],
                  ["40%", "80%", "40%"],
                  ["20%", "50%", "20%"],
                  ["50%", "100%", "50%"],
                  ["30%", "70%", "30%"],
                  ["60%", "90%", "60%"],
                  ["40%", "100%", "40%"],
                  ["20%", "60%", "20%"],
                  ["70%", "100%", "70%"],
                  ["30%", "80%", "30%"],
                  ["50%", "90%", "50%"],
                  ["20%", "60%", "20%"],
                ][i];

                return (
                  <motion.div
                    key={i}
                    className={`w-1 md:w-1.5 rounded-full ${isEmerald ? '' : 'bg-black dark:bg-white'}`}
                    style={{
                      backgroundColor: isEmerald ? colors.emeraldGreen : undefined,
                    }}
                    animate={{ height: heights }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.1,
                    }}
                  />
                );
              })}
            </motion.div>
          </div>
        </div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          onClick={() => setShowLoginModal(true)}
          className="flex items-center gap-2 font-bold hover:underline group"
          style={{ color: colors.emeraldGreen }}
        >
          Get Started
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>

      <LoginForm
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onSignUpClick={() => setShowSignUpModal(true)}
      />
      <SignUpForm
        open={showSignUpModal}
        onOpenChange={setShowSignUpModal}
        onLoginClick={() => setShowLoginModal(true)}
      />
    </>
  );
}
