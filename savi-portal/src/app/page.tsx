'use client';

/**
 * Root page - redirects to appropriate location
 * - If authenticated: goes to default landing (platform or tenant)
 * - If not: goes to login
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { useAuth } from '@/providers/AuthProvider';
import { PageLoader } from '@/components/feedback/LoadingSpinner';
import { ROUTES } from '@/config/routes';

export default function RootPage() {
  const router = useRouter();
  const { status, profile } = useAuthStore();
  const { getLandingRoute } = useAuth();

  useEffect(() => {
    // Wait for auth to load
    if (status === 'loading') return;

    // Redirect based on auth status
    if (status === 'authenticated' && profile) {
      // Go to default landing based on roles
      const landingRoute = getLandingRoute();
      router.replace(landingRoute);
    } else {
      // Not authenticated - go to login
      router.replace(ROUTES.LOGIN);
    }
  }, [status, profile, router, getLandingRoute]);

  // Show loading while determining redirect
  return <PageLoader text="Loading SAVI..." />;
}

