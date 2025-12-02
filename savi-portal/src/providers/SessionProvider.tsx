'use client';

/**
 * Session Provider
 * Manages session expiry detection and refresh flow
 */

import { useEffect, ReactNode } from 'react';
import { setSessionExpiredHandler } from '@/lib/http';
import { useSessionStore } from '@/lib/store/session-store';
import { SessionExpiredDialog } from '@/components/feedback/SessionExpiredDialog';

// ============================================
// Provider Component
// ============================================

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { setSessionExpired, isSessionExpired } = useSessionStore();

  /**
   * Sets up session expiry handler for HTTP client
   */
  useEffect(() => {
    // Register handler with HTTP client
    setSessionExpiredHandler(() => {
      setSessionExpired(true);
    });
  }, [setSessionExpired]);

  return (
    <>
      {children}
      
      {/* Session expired dialog - shown when 401 received */}
      {isSessionExpired && <SessionExpiredDialog />}
    </>
  );
}

