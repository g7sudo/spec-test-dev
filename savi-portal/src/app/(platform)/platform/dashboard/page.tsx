'use client';

/**
 * Platform Dashboard
 * Main dashboard for Platform Admins
 * Shows overview of all tenants and platform stats
 */

import { Building2, Users, Activity, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store/auth-store';

// ============================================
// Stats Card Component
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: { value: number; label: string };
}

function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary-50/50" />
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="rounded-lg bg-primary-100 p-2">
            <Icon className="h-5 w-5 text-primary-600" />
          </div>
          
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${trend.value >= 0 ? 'text-success' : 'text-error'}`}>
              <TrendingUp className={`h-4 w-4 ${trend.value < 0 ? 'rotate-180' : ''}`} />
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-gray-400">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Main Dashboard Page
// ============================================

export default function PlatformDashboardPage() {
  const { profile } = useAuthStore();
  
  // Get tenant count from profile
  const tenantCount = profile?.tenantMemberships?.length || 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Dashboard</h1>
          <p className="page-description">
            Welcome back, {profile?.displayName || 'Admin'}! Here&apos;s your platform overview.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="stats-grid stagger-animation">
        <StatCard
          title="Total Communities"
          value={tenantCount}
          description="Active communities on platform"
          icon={Building2}
          trend={{ value: 12, label: 'vs last month' }}
        />
        
        <StatCard
          title="Total Users"
          value="—"
          description="Across all communities"
          icon={Users}
          trend={{ value: 8, label: 'vs last month' }}
        />
        
        <StatCard
          title="Active Sessions"
          value="—"
          description="Users online now"
          icon={Activity}
        />
        
        <StatCard
          title="System Health"
          value="100%"
          description="All systems operational"
          icon={TrendingUp}
        />
      </div>

      {/* Quick access cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent tenants */}
        <Card>
          <CardHeader
            title="Communities"
            description="Communities you have access to"
          />
          <CardContent>
            {profile?.tenantMemberships && profile.tenantMemberships.length > 0 ? (
              <ul className="space-y-3">
                {profile.tenantMemberships.slice(0, 5).map((membership) => (
                  <li
                    key={membership.tenantId}
                    className="flex items-center justify-between rounded-lg bg-surface-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                        <Building2 className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{membership.tenantName}</p>
                        <p className="text-sm text-gray-500">{membership.tenantSlug}</p>
                      </div>
                    </div>
                    <a
                      href={`/tenant/${membership.tenantSlug}/dashboard`}
                      className="text-sm text-primary-600 hover:underline"
                    >
                      Open →
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No communities found
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader
            title="Quick Actions"
            description="Common platform management tasks"
          />
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href="/platform/tenants"
                className="flex items-center gap-3 rounded-lg border border-surface-200 p-4 transition-colors hover:bg-surface-50"
              >
                <Building2 className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Manage Communities</p>
                  <p className="text-sm text-gray-500">View & edit communities</p>
                </div>
              </a>
              
              <a
                href="/platform/users"
                className="flex items-center gap-3 rounded-lg border border-surface-200 p-4 transition-colors hover:bg-surface-50"
              >
                <Users className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Manage Users</p>
                  <p className="text-sm text-gray-500">Platform user access</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

