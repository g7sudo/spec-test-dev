'use client';

/**
 * Account Layout
 * Layout for account pages (profile, settings)
 * 
 * Guards:
 * - Must be authenticated → redirect to /login
 */

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AppShell } from '@/components/layout';
import { PageLoader } from '@/components/feedback/LoadingSpinner';
import { useAuthStore } from '@/lib/store/auth-store';
import { buildRequestContext, requireAuthenticated } from '@/lib/auth';

export default function AccountLayout({
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

    // Build request context
    const context = buildRequestContext(profile, pathname);
    
    // Check authentication
    const guardResult = requireAuthenticated(context);
    
    if (!guardResult.allowed) {
      sessionStorage.setItem('redirectAfterLogin', pathname);
      router.replace(guardResult.redirect);
      return;
    }
    
    // Access granted
    setIsAuthorized(true);
  }, [status, profile, pathname, router]);

  // Show loading while checking auth
  if (status === 'loading') {
    return <PageLoader text="Loading..." />;
  }

  // Show loading while redirecting
  if (!isAuthorized) {
    return <PageLoader text="Verifying access..." />;
  }

  // Render with app shell
  return <AppShell>{children}</AppShell>;
}
