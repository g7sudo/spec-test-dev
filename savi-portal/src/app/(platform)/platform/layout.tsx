'use client';

/**
 * Platform Layout
 * Layout for all /platform/* routes
 * 
 * Guards:
 * - Must be authenticated → redirect to /login
 * - Must have platform admin role → redirect to /unauthorized
 */

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AppShell } from '@/components/layout';
import { PageLoader } from '@/components/feedback/LoadingSpinner';
import { useAuthStore } from '@/lib/store/auth-store';
import { buildRequestContext, requirePlatformAccess, getDefaultRoute } from '@/lib/auth';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, profile } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Wait for auth to load
    if (status === 'loading') return;

    // Build request context from current state
    const context = buildRequestContext(profile, pathname);
    
    // Check platform access
    const guardResult = requirePlatformAccess(context);
    
    if (!guardResult.allowed) {
      // Store intended destination for post-login redirect
      if (guardResult.reason === 'not_authenticated') {
        sessionStorage.setItem('redirectAfterLogin', pathname);
      }
      router.replace(guardResult.redirect);
      return;
    }
    
    // Access granted
    setIsAuthorized(true);
  }, [status, profile, pathname, router]);

  // Show loading while checking auth
  if (status === 'loading') {
    return <PageLoader text="Loading platform..." />;
  }

  // Show loading while checking authorization or redirecting
  if (!isAuthorized) {
    return <PageLoader text="Verifying access..." />;
  }

  // Render platform layout with shell
  return <AppShell>{children}</AppShell>;
}
