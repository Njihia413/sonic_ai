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
      <DialogContent className="text-white max-w-md !w-[calc(100%-2rem)] sm:!w-full rounded-xl" style={{ backgroundColor: colors.darkBlack, borderColor: colors.grey }}>
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-left mb-2">
            <span style={{ color: colors.white }}>Create an </span>
            <span style={{ color: colors.emeraldGreen }}>Account</span>
          </DialogTitle>
          <p className="text-sm font-medium text-left" style={{ color: colors.grey }}>
            Join us and start creating today
          </p>
        </DialogHeader>

        <form onSubmit={handleSignUp} className="space-y-6 mt-4">
          <div>
            <label
              htmlFor="username"
              className="block text-[15px] font-semibold mb-3"
              style={{ color: colors.white }}
            >
              Username
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.grey }} />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Alex Carter"
                className="w-full h-14 bg-transparent border rounded-full pl-14 pr-4 placeholder:text-xs placeholder:tracking-wider focus:outline-none focus:border-white transition-colors"
                style={{ borderColor: colors.grey, color: colors.white }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-email"
              className="block text-[15px] font-semibold mb-3"
              style={{ color: colors.white }}
            >
              Your Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.grey }} />
              <input
                id="signup-email"
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
              htmlFor="signup-password"
              className="block text-[15px] font-semibold mb-3"
              style={{ color: colors.white }}
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.white }} />
              <input
                id="signup-password"
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
            Sign Up
          </button>
        </form>

        <p className="text-center text-xs mt-6">
          <span style={{ color: colors.white }}>Already have account? </span>
          <button
            type="button"
            className="font-bold hover:underline"
            style={{ color: colors.emeraldGreen }}
            onClick={() => {
              onOpenChange(false);
              onSignInClick?.();
            }}
          >
            Sign In
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}
