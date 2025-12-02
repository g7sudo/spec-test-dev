'use client';

/**
 * App Providers - wraps the entire app with required context providers
 * Order matters: outer providers are available to inner ones
 * 
 * Provider hierarchy:
 * 1. ToastProvider - for notifications
 * 2. AuthProvider - for Firebase auth + profile
 * 3. ScopeProvider - for platform/tenant scope (depends on auth)
 * 4. SessionProvider - for session expiry handling
 */

import { ReactNode } from 'react';
import { AuthProvider } from './AuthProvider';
import { ScopeProvider } from './ScopeProvider';
import { SessionProvider } from './SessionProvider';
import { ToastProvider } from './ToastProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ToastProvider>
      <AuthProvider>
        <ScopeProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ScopeProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
