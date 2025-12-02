'use client';

/**
 * Side Navigation component
 * Shows different nav items based on scope (platform vs tenant)
 * Filters items based on user permissions from /auth/me response
 */

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Building2,
  Users,
  Home,
  Wrench,
  Calendar,
  Settings,
  FileText,
  CreditCard,
  ParkingCircle,
  ClipboardList,
  Car,
  Store,
  Megaphone,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { extractTenantSlug, isPlatformPath } from '@/config/routes';
import { useAuthStore } from '@/lib/store/auth-store';

// ============================================
// Nav Item Types
// ============================================

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  // Permission required to see this item (optional - if not set, always visible)
  permission?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

// ============================================
// Platform Navigation
// Uses PLATFORM_* permissions
// ============================================

const platformNavItems: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/platform/dashboard', icon: LayoutDashboard },
      { 
        label: 'Communities', 
        href: '/platform/tenants', 
        icon: Building2,
        permission: 'PLATFORM_TENANT_VIEW',
      },
      { 
        label: 'Users', 
        href: '/platform/users', 
        icon: Users,
        permission: 'PLATFORM_USER_VIEW',
      },
    ],
  },
  {
    title: 'System',
    items: [
      { 
        label: 'Plans', 
        href: '/platform/plans', 
        icon: ClipboardList,
        permission: 'PLATFORM_PLAN_VIEW',
      },
      { label: 'Settings', href: '/platform/settings', icon: Settings },
    ],
  },
];

// ============================================
// Tenant Navigation
// Uses TENANT_* permissions (fetched with X-Tenant-Id header)
// ============================================

function getTenantNavItems(slug: string): NavSection[] {
  return [
    {
      items: [
        { label: 'Dashboard', href: `/tenant/${slug}/dashboard`, icon: LayoutDashboard },
      ],
    },
    {
      title: 'Community',
      items: [
        { 
          label: 'Units', 
          href: `/tenant/${slug}/units`, 
          icon: Home,
          permission: 'TENANT_COMMUNITY_VIEW',
        },
        { 
          label: 'Residents', 
          href: `/tenant/${slug}/residents`, 
          icon: Users,
          permission: 'TENANT_USER_VIEW',
        },
        { 
          label: 'Parties', 
          href: `/tenant/${slug}/parties`, 
          icon: UserCircle,
          permission: 'TENANT_PARTY_VIEW',
        },
        { 
          label: 'Parking', 
          href: `/tenant/${slug}/parking`, 
          icon: ParkingCircle,
          permission: 'TENANT_COMMUNITY_VIEW',
        },
      ],
    },
    {
      title: 'Operations',
      items: [
        { 
          label: 'Maintenance', 
          href: `/tenant/${slug}/maintenance`, 
          icon: Wrench,
          permission: 'TENANT_MAINTENANCE_REQUEST_VIEW',
        },
        { 
          label: 'Visitors', 
          href: `/tenant/${slug}/visitors`, 
          icon: Car,
          permission: 'TENANT_VISITOR_VIEW',
        },
        { 
          label: 'Amenities', 
          href: `/tenant/${slug}/amenities`, 
          icon: Calendar,
          permission: 'TENANT_AMENITY_VIEW',
        },
        { 
          label: 'Announcements', 
          href: `/tenant/${slug}/announcements`, 
          icon: Megaphone,
          permission: 'TENANT_ANNOUNCEMENT_VIEW',
        },
      ],
    },
    {
      title: 'Marketplace',
      items: [
        { 
          label: 'Marketplace', 
          href: `/tenant/${slug}/marketplace`, 
          icon: Store,
          permission: 'TENANT_MARKETPLACE_VIEW',
        },
      ],
    },
    {
      title: 'Finance',
      items: [
        { 
          label: 'Leases', 
          href: `/tenant/${slug}/leases`, 
          icon: FileText,
          permission: 'TENANT_LEASE_VIEW',
        },
        { 
          label: 'Billing', 
          href: `/tenant/${slug}/billing`, 
          icon: CreditCard,
          // No permission check - visible to all tenant members
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        { 
          label: 'Team', 
          href: `/tenant/${slug}/team`, 
          icon: Users,
          permission: 'TENANT_USER_MANAGE',
        },
        { label: 'Settings', href: `/tenant/${slug}/settings`, icon: Settings },
      ],
    },
  ];
}

// ============================================
// Permission Filter
// ============================================

/**
 * Filters nav items based on user permissions
 * Permissions come directly from profile.permissions object
 */
function filterNavByPermissions(
  sections: NavSection[],
  permissions: Record<string, boolean>
): NavSection[] {
  return sections
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        // If no permission required, show the item
        if (!item.permission) return true;
        // Check if user has the required permission (must be explicitly true)
        return permissions[item.permission] === true;
      }),
    }))
    // Remove empty sections
    .filter(section => section.items.length > 0);
}

// ============================================
// Component
// ============================================

interface SideNavProps {
  // Callback when nav item clicked (for mobile close)
  onNavItemClick?: () => void;
  // Additional classes
  className?: string;
}

export function SideNav({ onNavItemClick, className }: SideNavProps) {
  const pathname = usePathname();
  const { profile, status } = useAuthStore();
  
  // Get permissions directly from profile
  // This is reactive - will update when profile changes
  const permissions = profile?.permissions || {};
  
  // Determine which nav to show based on path
  const isPlatform = isPlatformPath(pathname);
  const tenantSlug = extractTenantSlug(pathname);
  
  // Get and filter nav items based on permissions
  const navSections = useMemo(() => {
    // Get raw nav items for current scope
    const rawSections = isPlatform
      ? platformNavItems
      : tenantSlug
      ? getTenantNavItems(tenantSlug)
      : [];
    
    // Filter based on permissions from profile
    return filterNavByPermissions(rawSections, permissions);
  }, [isPlatform, tenantSlug, permissions]);

  // Show loading state while auth is checking
  if (status === 'loading') {
    return (
      <nav className={cn('flex flex-col gap-2 p-4', className)}>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-surface-100 rounded-lg" />
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav className={cn('flex flex-col gap-2 p-4', className)}>
      {navSections.map((section, idx) => (
        <div key={idx} className="mb-2">
          {/* Section title */}
          {section.title && (
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {section.title}
            </h3>
          )}
          
          {/* Nav items */}
          <ul className="space-y-1">
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavItemClick}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                      'transition-all duration-200',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-surface-100 hover:text-gray-900'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 flex-shrink-0',
                        isActive ? 'text-primary-600' : 'text-gray-400'
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      
      {/* Empty state - no visible nav items */}
      {navSections.length === 0 && status === 'authenticated' && (
        <div className="px-3 py-4 text-center text-sm text-gray-400">
          No menu items available
        </div>
      )}
    </nav>
  );
}
