'use client';

import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
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
  onSignInClick?: () => void;
}

export function SignUpForm({ open, onOpenChange, onSignInClick }: SignUpFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md !w-[calc(100%-2rem)] sm:!w-full rounded-xl bg-white dark:bg-[#0A0A0A] text-black dark:text-white border-gray-300 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-left mb-2">
            <span className="text-black dark:text-white">Create an </span>
            <span style={{ color: colors.emeraldGreen }}>Account</span>
          </DialogTitle>
          <p className="text-sm font-medium text-left text-gray-600 dark:text-gray-400">
            Join us and start creating today
          </p>
        </DialogHeader>

        <form onSubmit={handleSignUp} className="space-y-6 mt-4">
          <div>
            <label
              htmlFor="username"
              className="block text-[15px] font-semibold mb-3 text-black dark:text-white"
            >
              Username
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Alex Carter"
                className="w-full h-14 bg-transparent border border-gray-400 dark:border-gray-600 rounded-full pl-14 pr-4 placeholder:text-xs placeholder:tracking-wider focus:outline-none focus:border-black dark:focus:border-white transition-colors text-black dark:text-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-email"
              className="block text-[15px] font-semibold mb-3 text-black dark:text-white"
            >
              Your Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.carter@email.com"
                className="w-full h-14 bg-transparent border border-gray-400 dark:border-gray-600 rounded-full pl-14 pr-4 placeholder:text-xs placeholder:tracking-wider focus:outline-none focus:border-black dark:focus:border-white transition-colors text-black dark:text-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="block text-[15px] font-semibold mb-3 text-black dark:text-white"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black dark:text-white" />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="**********"
                className="w-full h-14 bg-transparent border border-black dark:border-white rounded-full pl-14 pr-14 placeholder:text-xs placeholder:tracking-wider focus:outline-none transition-colors text-black dark:text-white"
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
            className="w-full h-14 font-bold text-sm rounded-full hover:opacity-90 transition-all mt-8 text-white"
            style={{ backgroundColor: colors.emeraldGreen }}
          >
            Sign Up
          </button>
        </form>

        <p className="text-center text-xs mt-6">
          <span className="text-black dark:text-white">Already have account? </span>
          <button
            type="button"
            className="font-bold hover:underline"
            style={{ color: colors.emeraldGreen }}
            onClick={() => {
              onOpenChange(false);
              onSignInClick?.();
            }}
          >
            Login
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}
