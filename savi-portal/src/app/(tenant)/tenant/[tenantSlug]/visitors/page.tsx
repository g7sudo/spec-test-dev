'use client';

/**
 * Visitors Overview Dashboard Page
 * Shows visitor statistics, KPIs, and breakdowns by type/source
 * Entry point: /tenant/[tenantSlug]/visitors
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Users,
  Loader2,
  AlertCircle,
  LogIn,
  LogOut,
  Clock,
  XCircle,
  Timer,
  RefreshCw,
  Truck,
  Wrench,
  User,
  Smartphone,
  Shield,
  Monitor,
  HelpCircle,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth-store';
import { getVisitorOverview } from '@/lib/api/visitors';
import {
  VisitorOverview,
  VisitorType,
  VisitorSource,
  getVisitorTypeLabel,
  getVisitorTypeIconColor,
  getVisitorSourceLabel,
  getVisitorSourceIconColor,
} from '@/types/visitor';

// ============================================
// KPI Stat Card Component
// ============================================

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

function StatCard({ title, value, icon, color, description }: StatCardProps) {
  return (
    <div
      className={`
        flex items-center gap-4 rounded-xl border p-4 transition-all
        ${color}
      `}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/80 shadow-sm">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm font-medium opacity-80">{title}</p>
        {description && (
          <p className="text-xs opacity-60">{description}</p>
        )}
      </div>
    </div>
  );
}

// ============================================
// Breakdown Bar Component
// ============================================

interface BreakdownItem {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}

interface BreakdownBarProps {
  items: BreakdownItem[];
  total: number;
}

function BreakdownBar({ items, total }: BreakdownBarProps) {
  // Avoid division by zero
  const safeTotal = total || 1;

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
        {items.map((item, idx) => {
          const percentage = (item.value / safeTotal) * 100;
          if (percentage === 0) return null;
          return (
            <div
              key={idx}
              className="h-full transition-all duration-300"
              style={{
                width: `${percentage}%`,
                backgroundColor: item.color,
              }}
              title={`${item.label}: ${item.value} (${percentage.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${item.color}20` }}>
              {item.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Helper: Get icon for visitor type
// ============================================

function getVisitorTypeIcon(type: VisitorType | string, className: string = "h-4 w-4") {
  const color = getVisitorTypeIconColor(type);
  switch (type) {
    case VisitorType.Guest:
    case 'Guest':
      return <User className={className} style={{ color }} />;
    case VisitorType.Delivery:
    case 'Delivery':
      return <Truck className={className} style={{ color }} />;
    case VisitorType.Service:
    case 'Service':
      return <Wrench className={className} style={{ color }} />;
    case VisitorType.Other:
    case 'Other':
    default:
      return <HelpCircle className={className} style={{ color }} />;
  }
}

// ============================================
// Helper: Get icon for visitor source
// ============================================

function getVisitorSourceIcon(source: VisitorSource | string, className: string = "h-4 w-4") {
  const color = getVisitorSourceIconColor(source);
  switch (source) {
    case VisitorSource.MobileApp:
    case 'MobileApp':
      return <Smartphone className={className} style={{ color }} />;
    case VisitorSource.SecurityApp:
    case 'SecurityApp':
      return <Shield className={className} style={{ color }} />;
    case VisitorSource.AdminPortal:
    case 'AdminPortal':
      return <Monitor className={className} style={{ color }} />;
    case VisitorSource.Other:
    case 'Other':
    default:
      return <HelpCircle className={className} style={{ color }} />;
  }
}

// ============================================
// Main Component
// ============================================

export default function VisitorsOverviewPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  // Ref for Strict Mode guard
  const fetchedRef = useRef(false);

  // Auth & permissions
  const { profile } = useAuthStore();
  const permissions = profile?.permissions || {};
  // Check for visitor management permission
  const canView = permissions['TENANT_VISITOR_MANAGE'] === true || permissions['TENANT_VISITOR_VIEW'] === true;

  // Data state
  const [overview, setOverview] = useState<VisitorOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // ============================================
  // Data Loading
  // ============================================

  const loadOverview = useCallback(async (force = false) => {
    if (!canView) return;
    if (!force && fetchedRef.current) return;
    fetchedRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getVisitorOverview();
      setOverview(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to load visitor overview:', err);
      setError('Failed to load visitor statistics. Please try again.');
      fetchedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [canView]);

  // Initial load
  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchedRef.current = false;
    loadOverview(true);
  };

  // ============================================
  // No permission view
  // ============================================

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Users className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">You don&apos;t have permission to view visitor management.</p>
      </div>
    );
  }

  // ============================================
  // Loading state
  // ============================================

  if (isLoading && !overview) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // ============================================
  // Error state
  // ============================================

  if (error && !overview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="h-12 w-12 text-red-300 mb-3" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="secondary" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // ============================================
  // Prepare breakdown data
  // ============================================

  // Helper to convert object/array breakdown to BreakdownItem[]
  // Backend may return { Guest: 5, Delivery: 3 } or [{ type: 'Guest', count: 5 }]
  const normalizeTypeBreakdown = (data: unknown): BreakdownItem[] => {
    if (!data) return [];
    
    // If it's an array, use as-is
    if (Array.isArray(data)) {
      return data.map((item) => ({
        label: getVisitorTypeLabel(item.type),
        value: item.count || 0,
        color: getVisitorTypeIconColor(item.type),
        icon: getVisitorTypeIcon(item.type),
      }));
    }
    
    // If it's an object, convert keys to items
    if (typeof data === 'object') {
      return Object.entries(data as Record<string, number>).map(([type, count]) => ({
        label: getVisitorTypeLabel(type),
        value: count || 0,
        color: getVisitorTypeIconColor(type),
        icon: getVisitorTypeIcon(type),
      }));
    }
    
    return [];
  };

  const normalizeSourceBreakdown = (data: unknown): BreakdownItem[] => {
    if (!data) return [];
    
    // If it's an array, use as-is
    if (Array.isArray(data)) {
      return data.map((item) => ({
        label: getVisitorSourceLabel(item.source),
        value: item.count || 0,
        color: getVisitorSourceIconColor(item.source),
        icon: getVisitorSourceIcon(item.source),
      }));
    }
    
    // If it's an object, convert keys to items
    if (typeof data === 'object') {
      return Object.entries(data as Record<string, number>).map(([source, count]) => ({
        label: getVisitorSourceLabel(source),
        value: count || 0,
        color: getVisitorSourceIconColor(source),
        icon: getVisitorSourceIcon(source),
      }));
    }
    
    return [];
  };

  // Prepare breakdown items (handles both object and array formats from backend)
  const typeBreakdownItems: BreakdownItem[] = normalizeTypeBreakdown(overview?.byType);
  const sourceBreakdownItems: BreakdownItem[] = normalizeSourceBreakdown(overview?.bySource);

  // Total for type breakdown (sum of all types)
  const typesTotal = typeBreakdownItems.reduce((sum, item) => sum + item.value, 0);
  // Total for source breakdown
  const sourcesTotal = sourceBreakdownItems.reduce((sum, item) => sum + item.value, 0);

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visitors</h1>
          <p className="text-gray-500 mt-1">
            Overview of today&apos;s visitor activity
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Last refresh time */}
          <span className="text-xs text-gray-400">
            Updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards - Top Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-animation">
        <StatCard
          title="Total Today"
          value={overview?.totalToday || 0}
          icon={<Users className="h-6 w-6 text-slate-600" />}
          color="bg-slate-50 border-slate-200 text-slate-900"
          description="Passes created"
        />
        <StatCard
          title="Currently Inside"
          value={overview?.currentlyInside || 0}
          icon={<LogIn className="h-6 w-6 text-emerald-600" />}
          color="bg-emerald-50 border-emerald-200 text-emerald-900"
          description="Active visitors"
        />
        <StatCard
          title="Pending Approval"
          value={overview?.pendingApproval || 0}
          icon={<Clock className="h-6 w-6 text-amber-600" />}
          color="bg-amber-50 border-amber-200 text-amber-900"
          description="Walk-in visitors"
        />
        <StatCard
          title="Pre-Registered"
          value={overview?.preRegisteredPending || 0}
          icon={<Timer className="h-6 w-6 text-blue-600" />}
          color="bg-blue-50 border-blue-200 text-blue-900"
          description="Not yet used"
        />
      </div>

      {/* Secondary KPI Cards - Activity Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Checked In"
          value={overview?.checkedInToday || 0}
          icon={<LogIn className="h-6 w-6 text-green-600" />}
          color="bg-green-50 border-green-200 text-green-900"
          description="Today"
        />
        <StatCard
          title="Checked Out"
          value={overview?.checkedOutToday || 0}
          icon={<LogOut className="h-6 w-6 text-gray-600" />}
          color="bg-gray-50 border-gray-200 text-gray-900"
          description="Today"
        />
        <StatCard
          title="Rejected"
          value={overview?.rejectedToday || 0}
          icon={<XCircle className="h-6 w-6 text-red-600" />}
          color="bg-red-50 border-red-200 text-red-900"
          description="Today"
        />
        <StatCard
          title="Expired"
          value={overview?.expiredToday || 0}
          icon={<Timer className="h-6 w-6 text-orange-600" />}
          color="bg-orange-50 border-orange-200 text-orange-900"
          description="Today"
        />
      </div>

      {/* Breakdown Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Type */}
        <Card>
          <CardHeader
            title="By Visitor Type"
            description="Distribution of visitors by type"
          />
          <CardContent>
            {typeBreakdownItems.length > 0 ? (
              <BreakdownBar items={typeBreakdownItems} total={typesTotal} />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">No visitor data for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Source */}
        <Card>
          <CardHeader
            title="By Source"
            description="Where visitors were registered from"
          />
          <CardContent>
            {sourceBreakdownItems.length > 0 ? (
              <BreakdownBar items={sourceBreakdownItems} total={sourcesTotal} />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Smartphone className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">No source data for today</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Summary */}
      <Card>
        <CardHeader
          title="Today&apos;s Summary"
          description="Quick snapshot of visitor activity"
        />
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Conversion Rate */}
            <div className="text-center p-4 rounded-lg bg-surface-50">
              <p className="text-2xl font-bold text-gray-900">
                {overview?.totalToday
                  ? Math.round(((overview.checkedInToday || 0) / overview.totalToday) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Check-in Rate</p>
            </div>

            {/* Average Inside */}
            <div className="text-center p-4 rounded-lg bg-surface-50">
              <p className="text-2xl font-bold text-gray-900">
                {overview?.currentlyInside || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Inside Now</p>
            </div>

            {/* Pending Actions */}
            <div className="text-center p-4 rounded-lg bg-surface-50">
              <p className="text-2xl font-bold text-gray-900">
                {(overview?.pendingApproval || 0) + (overview?.preRegisteredPending || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Pending Actions</p>
            </div>

            {/* Completed */}
            <div className="text-center p-4 rounded-lg bg-surface-50">
              <p className="text-2xl font-bold text-gray-900">
                {overview?.checkedOutToday || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Visits Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

