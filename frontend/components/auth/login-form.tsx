'use client';

import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { colors } from '@/lib/colors';

interface LoginFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignUpClick?: () => void;
}

export function LoginForm({ open, onOpenChange, onSignUpClick }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-white max-w-md !w-[calc(100%-2rem)] sm:!w-full rounded-xl" style={{ backgroundColor: colors.darkBlack, borderColor: colors.grey }}>
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-left mb-2">
            <span style={{ color: colors.emeraldGreen }}>Log</span>{' '}
            <span style={{ color: colors.white }}>In</span>
          </DialogTitle>
          <p className="text-sm font-medium text-left" style={{ color: colors.grey }}>
            Enter your credentials to access your account
          </p>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-6 mt-4">
          <div>
            <label
              htmlFor="email"
              className="block text-[15px] font-semibold mb-3"
              style={{ color: colors.white }}
            >
              Your Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.grey }} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.carter@email.com"
                className="w-full h-14 bg-transparent border rounded-full pl-14 pr-4 placeholder:text-xs placeholder:tracking-wider focus:outline-none focus:border-white transition-colors"
                style={{ borderColor: colors.grey, color: colors.white }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[15px] font-semibold mb-3"
              style={{ color: colors.white }}
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.white }} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="**********"
                className="w-full h-14 bg-transparent border rounded-full pl-14 pr-14 placeholder:text-xs placeholder:tracking-wider focus:outline-none transition-colors"
                style={{ borderColor: colors.white, color: colors.white }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
                style={{ color: colors.white }}
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
            className="w-full h-14 font-bold text-sm rounded-full hover:opacity-90 transition-all mt-8"
            style={{ backgroundColor: colors.emeraldGreen, color: colors.white }}
          >
            Login
          </button>
        </form>

        <p className="text-center text-xs mt-6">
          <span style={{ color: colors.white }}>Don't have account? </span>
          <button
            type="button"
            className="font-bold hover:underline"
            style={{ color: colors.emeraldGreen }}
            onClick={() => {
              onOpenChange(false);
              onSignUpClick?.();
            }}
          >
            Sign up
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}
