'use client';

/**
 * App Shell - main layout wrapper
 * Includes sidebar, top bar, and main content area
 */

import { useState, useCallback, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TopBar } from './TopBar';
import { SideNav } from './SideNav';
import { Button } from '@/components/ui/button';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  // Mobile sidebar open state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex min-h-screen bg-surface-50">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden w-64 flex-col',
          'border-r border-surface-200 bg-white',
          'lg:flex'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-surface-200 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white font-bold">
            S
          </div>
          <span className="font-display text-xl font-bold text-gray-900">SAVI</span>
        </div>
        
        {/* Nav */}
        <div className="flex-1 overflow-y-auto">
          <SideNav />
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 flex-col bg-white transition-transform duration-300',
          'lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile header with close button */}
        <div className="flex h-16 items-center justify-between border-b border-surface-200 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white font-bold">
              S
            </div>
            <span className="font-display text-xl font-bold text-gray-900">SAVI</span>
          </div>
          <Button variant="ghost" size="icon" onClick={closeSidebar}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Nav */}
        <div className="flex-1 overflow-y-auto">
          <SideNav onNavItemClick={closeSidebar} />
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top bar */}
        <TopBar onMenuClick={openSidebar} />
        
        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

