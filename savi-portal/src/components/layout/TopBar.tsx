'use client';

/**
 * Top Bar / Header component
 * Contains scope dropdown and user menu
 */

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScopeDropdown } from './ScopeDropdown';
import { UserMenu } from './UserMenu';
import { Button } from '@/components/ui/button';

interface TopBarProps {
  // Callback to toggle mobile sidebar
  onMenuClick?: () => void;
  // Additional classes
  className?: string;
}

export function TopBar({ onMenuClick, className }: TopBarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-16 items-center justify-between gap-4',
        'border-b border-surface-200 bg-white/80 px-4 backdrop-blur-sm',
        'lg:px-6',
        className
      )}
    >
      {/* Left side - Menu button (mobile) + Scope dropdown */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Scope dropdown */}
        <ScopeDropdown />
      </div>

      {/* Right side - User menu */}
      <div className="flex items-center gap-3">
        <UserMenu />
      </div>
    </header>
  );
}

