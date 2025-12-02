'use client';

/**
 * Tenant Dashboard
 * Main dashboard for Tenant Admins / Community Managers
 * Shows overview of the specific community
 */

import { useParams } from 'next/navigation';
import { Home, Users, ParkingCircle, Wrench, TrendingUp, Bell } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store/auth-store';
import { hasAccessToTenant } from '@/lib/auth';

// ============================================
// Stats Card Component
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
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
            <div className={`flex items-center gap-1 text-sm ${trend.isPositive ? 'text-success' : 'text-error'}`}>
              <TrendingUp className={`h-4 w-4 ${!trend.isPositive ? 'rotate-180' : ''}`} />
              <span>{trend.value}%</span>
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

export default function TenantDashboardPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { profile } = useAuthStore();
  
  // Get tenant info from membership
  const membership = profile ? hasAccessToTenant(profile, tenantSlug) : null;
  const tenantName = membership?.tenantName || tenantSlug;
  const userRoles = membership?.roles || [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{tenantName}</h1>
          <p className="page-description">
            Welcome back! Here&apos;s your community overview.
          </p>
        </div>
        
        {/* Role badge */}
        {userRoles.length > 0 && (
          <div className="flex gap-2">
            {userRoles.map((role) => (
              <span
                key={role}
                className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700"
              >
                {role}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="stats-grid stagger-animation">
        <StatCard
          title="Total Units"
          value="—"
          description="Residential units"
          icon={Home}
        />
        
        <StatCard
          title="Residents"
          value="—"
          description="Active residents"
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />
        
        <StatCard
          title="Parking Slots"
          value="—"
          description="Available / Total"
          icon={ParkingCircle}
        />
        
        <StatCard
          title="Open Requests"
          value="—"
          description="Pending maintenance"
          icon={Wrench}
        />
      </div>

      {/* Content sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent activity */}
        <Card>
          <CardHeader
            title="Recent Activity"
            description="Latest updates in your community"
          />
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-gray-500">No recent activity</p>
              <p className="text-sm text-gray-400">
                Activity will appear here as residents interact
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader
            title="Quick Actions"
            description="Common community management tasks"
          />
          <CardContent>
            <div className="grid gap-3">
              <a
                href={`/tenant/${tenantSlug}/units`}
                className="flex items-center gap-3 rounded-lg border border-surface-200 p-4 transition-colors hover:bg-surface-50"
              >
                <Home className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Manage Units</p>
                  <p className="text-sm text-gray-500">View & edit units</p>
                </div>
              </a>
              
              <a
                href={`/tenant/${tenantSlug}/residents`}
                className="flex items-center gap-3 rounded-lg border border-surface-200 p-4 transition-colors hover:bg-surface-50"
              >
                <Users className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Manage Residents</p>
                  <p className="text-sm text-gray-500">Resident directory</p>
                </div>
              </a>
              
              <a
                href={`/tenant/${tenantSlug}/maintenance`}
                className="flex items-center gap-3 rounded-lg border border-surface-200 p-4 transition-colors hover:bg-surface-50"
              >
                <Wrench className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Maintenance</p>
                  <p className="text-sm text-gray-500">Handle service requests</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

