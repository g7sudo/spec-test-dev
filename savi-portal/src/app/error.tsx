'use client';

/**
 * Global Error Page
 * Catches React rendering errors at the app level
 */

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  // Log the error for debugging
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 p-4">
      <Card className="max-w-md text-center">
        {/* Error icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
          <AlertTriangle className="h-8 w-8 text-error" />
        </div>

        {/* Title */}
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Something went wrong
        </h1>

        {/* Description */}
        <p className="mt-2 text-gray-500">
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>

        {/* Error details (dev only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 rounded-lg bg-surface-100 p-4 text-left">
            <p className="text-xs font-medium text-gray-500">Error details:</p>
            <p className="mt-1 text-sm text-error">{error.message}</p>
            {error.digest && (
              <p className="mt-1 text-xs text-gray-400">Digest: {error.digest}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="primary" onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          
          <Button variant="secondary" onClick={() => window.location.href = '/'}>
            <Home className="h-4 w-4" />
            Go home
          </Button>
        </div>
      </Card>
    </div>
  );
}

