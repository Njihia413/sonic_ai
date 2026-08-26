'use client';

import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { colors } from '@/lib/colors';
import { loginWithArgus } from '@/lib/auth';

interface LoginFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignUpClick?: () => void;
}

export function LoginForm({ open, onOpenChange }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter your username and password')
      return
    }

    setIsLoading(true)

    const result = await loginWithArgus(username.trim(), password)

    if (!result.success) {
      toast.error(result.message || 'Login failed')
      setIsLoading(false)
      return
    }

    try {
      const verifyRes = await fetch('/api/verify', { method: 'POST' })
      const verifyData = await verifyRes.json()

      if (!verifyData.allowed) {
        await fetch('/api/logout', { method: 'POST' })
        toast.error(verifyData.error || verifyData.message || 'You do not have access to Sonic AI.')
        setIsLoading(false)
        return
      }
    } catch {
      await fetch('/api/logout', { method: 'POST' })
      toast.error('Could not reach the auth service. Please try again.')
      setIsLoading(false)
      return
    }

    toast.success('Logged in successfully')
    setTimeout(() => {
      window.location.href = '/home'
    }, 400)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100%-2rem)]! sm:w-full! rounded-xl bg-white dark:bg-[#0A0A0A] text-black dark:text-white border-gray-300 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-left mb-2">
            <span style={{ color: colors.emeraldGreen }}>Log</span>{' '}
            <span className="text-black dark:text-white">In</span>
          </DialogTitle>
          <p className="text-sm font-medium text-left text-gray-600 dark:text-gray-400">
            Enter your credentials to access Sonic AI
          </p>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-6 mt-4">
          <div>
            <label
              htmlFor="username"
              className="block text-[15px] font-semibold mb-3 text-black dark:text-white"
            >
              Username
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                autoComplete="username"
                className="w-full h-14 bg-transparent border border-gray-400 dark:border-gray-600 rounded-full pl-14 pr-4 placeholder:text-xs placeholder:tracking-wider focus:outline-none transition-colors text-black dark:text-white"
                onFocus={(e) => (e.target.style.borderColor = colors.emeraldGreen)}
                onBlur={(e) => (e.target.style.borderColor = '')}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[15px] font-semibold mb-3 text-black dark:text-white"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black dark:text-white" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="**********"
                autoComplete="current-password"
                className="w-full h-14 bg-transparent border border-gray-400 dark:border-gray-600 rounded-full pl-14 pr-14 placeholder:text-xs placeholder:tracking-wider focus:outline-none transition-colors text-black dark:text-white"
                onFocus={(e) => (e.target.style.borderColor = colors.emeraldGreen)}
                onBlur={(e) => (e.target.style.borderColor = '')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80 text-black dark:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 font-bold text-sm rounded-full hover:opacity-90 transition-all mt-8 text-white disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ backgroundColor: colors.emeraldGreen }}
          >
            {isLoading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
