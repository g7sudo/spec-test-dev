'use client';

/**
 * User Menu Dropdown
 * Shows avatar with profile and logout options
 */

import { useRouter } from 'next/navigation';
import { User, LogOut, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar } from '@/components/ui/avatar';
import { useAuthStore } from '@/lib/store/auth-store';
import { useAuth } from '@/providers/AuthProvider';
import { ROUTES } from '@/config/routes';

export function UserMenu() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { logout } = useAuth();

  // Get display info
  const displayName = profile?.displayName || user?.displayName || 'User';
  const email = profile?.email || user?.email || '';
  const photoUrl = user?.photoURL;

  /**
   * Navigate to profile page
   */
  const handleProfileClick = () => {
    router.push(ROUTES.ACCOUNT.PROFILE);
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    await logout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="User menu"
        >
          <Avatar
            src={photoUrl}
            name={displayName}
            size="md"
          />
          
          {/* Name - hidden on mobile */}
          <span className="hidden text-sm font-medium text-gray-700 sm:block">
            {displayName}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* User info header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{email}</p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        {/* Profile link */}
        <DropdownMenuItem onClick={handleProfileClick}>
          <User className="mr-2 h-4 w-4" />
          <span>My Profile</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-error focus:text-error"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

