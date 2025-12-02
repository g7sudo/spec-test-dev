'use client';

/**
 * Session Expired Dialog
 * Shown when the user's session expires (401 from API)
 * Offers options to continue session or sign out
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSessionStore } from '@/lib/store/session-store';
import { getIdToken, signOut as firebaseSignOut, clearLastScope } from '@/lib/auth';
import { ROUTES } from '@/config/routes';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

export function SessionExpiredDialog() {
  const router = useRouter();
  const { isSessionExpired, setSessionExpired, setRefreshing, isRefreshing } =
    useSessionStore();
  const [error, setError] = useState<string | null>(null);

  /**
   * Attempts to refresh the session by getting a new token
   */
  const handleContinueSession = async () => {
    setRefreshing(true);
    setError(null);

    try {
      // Try to get a fresh token from Firebase
      const token = await getIdToken(true); // Force refresh
      
      if (token) {
        // Success - close dialog and let user continue
        setSessionExpired(false);
        setRefreshing(false);
        
        // Reload the page to refresh data
        window.location.reload();
      } else {
        // No token available - need to sign in again
        setError('Unable to refresh session. Please sign in again.');
      }
    } catch {
      setError('Session refresh failed. Please sign in again.');
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Signs out and redirects to login
   */
  const handleSignOut = async () => {
    try {
      await firebaseSignOut();
      clearLastScope();
    } catch {
      // Ignore errors - redirect anyway
    }
    
    // Hard redirect to login
    window.location.href = ROUTES.LOGIN;
  };

  return (
    <Dialog open={isSessionExpired} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-100">
            <Clock className="h-6 w-6 text-accent-600" />
          </div>
          <DialogTitle className="text-center">Session Expired</DialogTitle>
          <DialogDescription className="text-center">
            Your session has timed out for security reasons.
            Would you like to continue working or sign out?
          </DialogDescription>
        </DialogHeader>

        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            onClick={handleSignOut}
            disabled={isRefreshing}
            className="w-full sm:w-auto"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
          
          <Button
            variant="primary"
            onClick={handleContinueSession}
            isLoading={isRefreshing}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Continue Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

