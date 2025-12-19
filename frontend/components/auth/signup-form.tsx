'use client';

import { Mail, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { colors } from '@/lib/colors';

interface SignUpFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginClick?: () => void;
}

export function SignUpForm({ open, onOpenChange, onLoginClick }: SignUpFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    toast.success('Account created successfully', {
      position: 'top-right',
    });

    setTimeout(() => {
      onOpenChange(false);
      onLoginClick?.();
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100%-2rem)]! sm:w-full! rounded-xl bg-white dark:bg-[#0A0A0A] text-black dark:text-white border-gray-300 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-left mb-2">
            <span style={{ color: colors.emeraldGreen }}>Sign</span>{' '}
            <span className="text-black dark:text-white">Up</span>
          </DialogTitle>
          <p className="text-sm font-medium text-left text-gray-600 dark:text-gray-400">
            Create an account to get started
          </p>
        </DialogHeader>

        <form onSubmit={handleSignUp} className="space-y-6 mt-4">
          <div>
            <label
              htmlFor="name"
              className="block text-[15px] font-semibold mb-3 text-black dark:text-white"
            >
              Your Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black dark:text-white" />
              <input
                id="name"
                type="text"
                placeholder="Alex Carter"
                className="w-full h-14 bg-transparent border border-gray-400 dark:border-gray-600 rounded-full pl-14 pr-4 placeholder:text-xs placeholder:tracking-wider focus:outline-none transition-colors text-black dark:text-white"
                style={{ '--tw-ring-color': colors.emeraldGreen } as React.CSSProperties}
                onFocus={(e) => e.target.style.borderColor = colors.emeraldGreen}
                onBlur={(e) => e.target.style.borderColor = ''}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email-signup"
              className="block text-[15px] font-semibold mb-3 text-black dark:text-white"
            >
              Your Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
              <input
                id="email-signup"
                type="email"
                placeholder="alex.carter@gmail.com"
                className="w-full h-14 bg-transparent border border-gray-400 dark:border-gray-600 rounded-full pl-14 pr-4 placeholder:text-xs placeholder:tracking-wider focus:outline-none transition-colors text-black dark:text-white"
                style={{ '--tw-ring-color': colors.emeraldGreen } as React.CSSProperties}
                onFocus={(e) => e.target.style.borderColor = colors.emeraldGreen}
                onBlur={(e) => e.target.style.borderColor = ''}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password-signup"
              className="block text-[15px] font-semibold mb-3 text-black dark:text-white"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black dark:text-white" />
              <input
                id="password-signup"
                type={showPassword ? 'text' : 'password'}
                placeholder="**********"
                className="w-full h-14 bg-transparent border border-gray-400 dark:border-gray-600 rounded-full pl-14 pr-14 placeholder:text-xs placeholder:tracking-wider focus:outline-none transition-colors text-black dark:text-white"
                style={{ '--tw-ring-color': colors.emeraldGreen } as React.CSSProperties}
                onFocus={(e) => e.target.style.borderColor = colors.emeraldGreen}
                onBlur={(e) => e.target.style.borderColor = ''}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80 text-black dark:text-white"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 font-bold text-sm rounded-full hover:opacity-90 transition-all mt-8 text-white disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ backgroundColor: colors.emeraldGreen }}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-xs mt-6">
          <span className="text-black dark:text-white">Already have an account? </span>
          <button
            type="button"
            className="font-bold hover:underline"
            style={{ color: colors.emeraldGreen }}
            onClick={() => {
              onOpenChange(false);
              onLoginClick?.();
            }}
          >
            Log in
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}
