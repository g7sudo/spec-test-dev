'use client';

/**
 * Global 404 Page
 * Shown for non-existent routes
 * 
 * Provides:
 * - Clear 404 message
 * - Link back to user's dashboard
 * - Go back option
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store/auth-store';
import { buildRequestContext, getDefaultRoute } from '@/lib/auth';

export default function NotFoundPage() {
  const { status, profile } = useAuthStore();
  const [dashboardLink, setDashboardLink] = useState('/');

  // Calculate the user's default dashboard
  useEffect(() => {
    if (status === 'authenticated' && profile) {
      const context = buildRequestContext(profile, '/not-found');
      setDashboardLink(getDefaultRoute(context));
    } else {
      setDashboardLink('/login');
    }
  }, [status, profile]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface-50 via-white to-primary-50 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary-100/50 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-accent-100/50 blur-3xl" />
      </div>

      <Card className="relative z-10 max-w-md text-center shadow-xl">
        {/* 404 illustration */}
        <div className="mb-4 flex items-center justify-center">
          <div className="relative">
            <span className="font-display text-[120px] font-bold leading-none text-primary-100">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="h-16 w-16 text-primary-300" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Page not found
        </h1>

        {/* Description */}
        <p className="mt-2 text-gray-500">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={dashboardLink}>
            <Button variant="primary">
              <Home className="h-4 w-4" />
              {status === 'authenticated' ? 'Back to dashboard' : 'Go to login'}
            </Button>
          </Link>
          
          <Button variant="secondary" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Button>
        </div>

        {/* Help text */}
        <p className="mt-6 text-xs text-gray-400">
          If you followed a link here, please let us know so we can fix it.
        </p>
      </Card>
    </div>
  );
}
