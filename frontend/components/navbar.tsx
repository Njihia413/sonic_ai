'use client';
import { ThemeToggle } from './theme-toggle';
import { LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { colors } from '@/lib/colors';
import { logout } from '@/lib/auth';

export function Navbar() {
  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <a href="/home" className="cursor-pointer">
              <h1 className="text-xl sm:text-2xl font-bold hover:opacity-80 transition-opacity">
                <span style={{ color: colors.emeraldGreen }}>Sonic</span>{' '}
                <span className="text-black dark:text-white">AI</span>
              </h1>
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="relative h-9 w-9 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all hover:opacity-80"
                  style={{
                    focusRing: colors.emeraldGreen,
                    '--tw-ring-color': colors.emeraldGreen
                  } as React.CSSProperties}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback
                      className="text-white font-semibold text-sm"
                      style={{ backgroundColor: colors.emeraldGreen }}
                    >
                      AC
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-gray-800"
              >
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-800"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
