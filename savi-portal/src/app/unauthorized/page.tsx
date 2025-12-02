'use client';

/**
 * Unauthorized Page
 * Shown when user tries to access an area they don't have permission for
 * 
 * Cases:
 * - Non-platform-admin trying to access /platform/*
 * - User trying to access a tenant they're not a member of
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldX, Home, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store/auth-store';
import { buildRequestContext, getDefaultRoute } from '@/lib/auth';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { status, profile } = useAuthStore();
  const [defaultRoute, setDefaultRoute] = useState('/');

  // Calculate the user's default route
  useEffect(() => {
    if (status === 'authenticated' && profile) {
      const context = buildRequestContext(profile, '/unauthorized');
      setDefaultRoute(getDefaultRoute(context));
    }
  }, [status, profile]);

  /**
   * Navigate to user's default dashboard
   */
  const handleGoToDashboard = () => {
    router.push(defaultRoute);
  };

  /**
   * Go back to previous page
   */
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface-50 via-white to-primary-50 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-error/5 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-primary-100/50 blur-3xl" />
      </div>

      <Card className="relative z-10 max-w-md text-center shadow-xl">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-error/10">
          <ShieldX className="h-10 w-10 text-error" />
        </div>

        {/* Title */}
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Access Denied
        </h1>

        {/* Description */}
        <p className="mt-3 text-gray-500">
          You don't have permission to access this area.
          Please contact your administrator if you believe this is a mistake.
        </p>

        {/* User info (if authenticated) */}
        {profile && (
          <div className="mt-4 rounded-lg bg-surface-50 p-3 text-sm">
            <p className="text-gray-600">
              Signed in as <span className="font-medium text-gray-900">{profile.email}</span>
            </p>
            {profile.globalRoles.length > 0 && (
              <p className="mt-1 text-gray-500">
                Roles: {profile.globalRoles.join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="primary" onClick={handleGoToDashboard}>
            <Home className="h-4 w-4" />
            Go to my dashboard
          </Button>
          
          <Button variant="secondary" onClick={handleGoBack}>
            <ArrowRight className="h-4 w-4 rotate-180" />
            Go back
          </Button>
        </div>

        {/* Help text */}
        <p className="mt-6 text-xs text-gray-400">
          If you need access, please contact your system administrator.
        </p>
      </Card>
    </div>
  );
}

