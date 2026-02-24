'use client';

/**
 * No Access Page
 * Shown when user is authenticated but has no platform or tenant access
 * This is a rare edge case (user exists but has no roles anywhere)
 */

import { LogOut, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/providers/AuthProvider';
import { useAuthStore } from '@/lib/store/auth-store';

export default function NoAccessPage() {
  const { logout } = useAuth();
  const { profile } = useAuthStore();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface-50 via-white to-accent-50 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-accent-100/50 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-primary-100/50 blur-3xl" />
      </div>

      <Card className="relative z-10 max-w-md text-center shadow-xl">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent-100">
          <HelpCircle className="h-10 w-10 text-accent-600" />
        </div>

        {/* Title */}
        <h1 className="font-display text-2xl font-bold text-gray-900">
          No Access Yet
        </h1>

        {/* Description */}
        <p className="mt-3 text-gray-500">
          Your account has been created, but you haven&apos;t been assigned access
          to any communities or platform areas yet.
        </p>

        {/* User info */}
        {profile && (
          <div className="mt-4 rounded-lg bg-surface-50 p-3 text-sm">
            <p className="text-gray-600">
              Signed in as <span className="font-medium text-gray-900">{profile.email}</span>
            </p>
          </div>
        )}

        {/* What to do */}
        <div className="mt-6 rounded-lg border border-accent-200 bg-accent-50 p-4 text-left text-sm">
          <p className="font-medium text-accent-800">What should I do?</p>
          <ul className="mt-2 space-y-1 text-accent-700">
            <li>• Contact your community administrator</li>
            <li>• Ask them to invite you to a community</li>
            <li>• Check if you used the correct email</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="mt-6">
          <Button variant="secondary" onClick={logout} className="w-full">
            <LogOut className="h-4 w-4" />
            Sign out and try another account
          </Button>
        </div>
      </Card>
    </div>
  );
}

