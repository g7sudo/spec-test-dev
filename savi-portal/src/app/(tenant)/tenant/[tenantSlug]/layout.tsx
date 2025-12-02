'use client';

/**
 * Tenant Layout
 * Layout for all /tenant/[slug]/* routes
 * 
 * Guards:
 * - Must be authenticated → redirect to /login
 * - Tenant slug must be valid (user has membership) → show not-found
 * - User must have access to this tenant → redirect to /unauthorized
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams, usePathname, notFound } from 'next/navigation';
import { AppShell } from '@/components/layout';
import { PageLoader } from '@/components/feedback/LoadingSpinner';
import { useAuthStore } from '@/lib/store/auth-store';
import { buildRequestContext, requireTenantAccess } from '@/lib/auth';

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  
  const { status, profile } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);

  useEffect(() => {
    // Wait for auth to load
    if (status === 'loading') return;

    // Build request context
    const context = buildRequestContext(profile, pathname);
    
    // Check tenant access
    const guardResult = requireTenantAccess(context, tenantSlug);
    
    if (!guardResult.allowed) {
      if (guardResult.reason === 'not_authenticated') {
        // Store intended destination for post-login redirect
        sessionStorage.setItem('redirectAfterLogin', pathname);
        router.replace(guardResult.redirect);
        return;
      }
      
      if (guardResult.reason === 'tenant_not_found') {
        // Tenant doesn't exist - show 404
        setShowNotFound(true);
        return;
      }
      
      if (guardResult.reason === 'no_tenant_access') {
        // User doesn't have access to this tenant
        router.replace(guardResult.redirect);
        return;
      }
    }
    
    // Access granted
    setIsAuthorized(true);
  }, [status, profile, pathname, tenantSlug, router]);

  // Trigger Next.js notFound() for invalid tenants
  if (showNotFound) {
    notFound();
  }

  // Show loading while checking auth
  if (status === 'loading') {
    return <PageLoader text="Loading community..." />;
  }

  // Show loading while checking authorization
  if (!isAuthorized) {
    return <PageLoader text="Verifying access..." />;
  }

  // Render tenant layout with shell
  return <AppShell>{children}</AppShell>;
}
