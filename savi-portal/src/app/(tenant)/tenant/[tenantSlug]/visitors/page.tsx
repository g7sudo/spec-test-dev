'use client';

/**
 * Visitors Dashboard & List Page
 * Shows KPIs from overview, filterable pass list, and create/walk-in actions
 * Entry point: /tenant/[tenantSlug]/visitors
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Loader2,
  ChevronRight,
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  LogIn,
  LogOut,
  Shield,
  Filter,
  Home,
  Hash,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useAuthStore } from '@/lib/store/auth-store';
import { getVisitorOverview, listVisitorPasses } from '@/lib/api/visitors';
import {
  VisitorPassSummary,
  VisitorOverview,
  VisitorPassStatus,
  getVisitorPassStatusLabel,
  getVisitorPassStatusColor,
  getVisitorTypeLabel,
  getVisitorTypeColor,
  getVisitorSourceLabel,
  formatDateTime,
  VISITOR_PASS_STATUS_OPTIONS,
  VISITOR_TYPE_OPTIONS,
  VISITOR_SOURCE_OPTIONS,
} from '@/types/visitor';
import { CreateVisitorPassDialog, WalkInPassDialog } from '@/components/visitors';

// ============================================
// KPI Card Component
// ============================================

interface KpiCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

function KpiCard({ title, value, icon, color, onClick }: KpiCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-4 rounded-xl border p-4 transition-all
        ${onClick ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}
        ${color}
      `}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/80">
        {icon}
      </div>
      <div className="text-left">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm opacity-80">{title}</p>
      </div>
    </button>
  );
}

// ============================================
// Main Component
// ============================================

export default function VisitorsPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;

  // Refs for Strict Mode guard (separate for each fetch)
  const passesFetchedRef = useRef(false);
  const overviewFetchedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Auth & permissions
  const { profile } = useAuthStore();
  const permissions = profile?.permissions || {};
  const canView = permissions['TENANT_VISITOR_VIEW'] === true || permissions['TENANT_VISITOR_MANAGE'] === true;
  const canCreate = permissions['TENANT_VISITOR_CREATE'] === true || permissions['TENANT_VISITOR_CREATE_OWN'] === true || permissions['TENANT_VISITOR_CREATE_UNIT'] === true;
  const canManage = permissions['TENANT_VISITOR_MANAGE'] === true;

  // Data state
  const [passes, setPasses] = useState<VisitorPassSummary[]>([]);
  const [overview, setOverview] = useState<VisitorOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showWalkInDialog, setShowWalkInDialog] = useState(false);

  // ============================================
  // Data Loading
  // ============================================

  // Load overview KPIs
  const loadOverview = useCallback(async (force = false) => {
    if (!canView) return;
    if (!force && overviewFetchedRef.current) return;
    overviewFetchedRef.current = true;

    try {
      const data = await getVisitorOverview();
      setOverview(data);
    } catch (err) {
      console.error('Failed to load overview:', err);
      overviewFetchedRef.current = false;
    }
  }, [canView]);

  // Load passes with filters
  const loadPasses = useCallback(async (force = false) => {
    if (!canView) return;
    if (!force && passesFetchedRef.current) return;
    passesFetchedRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const result = await listVisitorPasses({
        searchTerm: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        visitType: typeFilter !== 'all' ? typeFilter : undefined,
        source: sourceFilter !== 'all' ? sourceFilter : undefined,
        page,
        pageSize,
      });

      setPasses(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(Math.ceil(result.totalCount / pageSize));
    } catch (err) {
      console.error('Failed to load passes:', err);
      setError('Failed to load visitor passes. Please try again.');
      passesFetchedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [canView, debouncedSearch, statusFilter, typeFilter, sourceFilter, page, pageSize]);

  // Initial load
  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadPasses();
  }, [loadPasses]);

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
      passesFetchedRef.current = false;
    }, 300);
  };

  // Handle filter changes
  const handleFilterChange = (filterType: 'status' | 'type' | 'source', value: string) => {
    switch (filterType) {
      case 'status':
        setStatusFilter(value);
        break;
      case 'type':
        setTypeFilter(value);
        break;
      case 'source':
        setSourceFilter(value);
        break;
    }
    setPage(1);
    passesFetchedRef.current = false;
  };

  // Quick filter by status (from KPI cards)
  const handleKpiClick = (status: string) => {
    setStatusFilter(status);
    setPage(1);
    passesFetchedRef.current = false;
  };

  // Reload when filters change
  useEffect(() => {
    loadPasses(true);
  }, [debouncedSearch, statusFilter, typeFilter, sourceFilter, page]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Navigate to pass detail
  const handleViewPass = (pass: VisitorPassSummary) => {
    router.push(`/tenant/${tenantSlug}/visitors/${pass.id}`);
  };

  // Handle create/walk-in success
  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    setShowWalkInDialog(false);
    passesFetchedRef.current = false;
    overviewFetchedRef.current = false;
    loadPasses(true);
    loadOverview(true);
  };

  // ============================================
  // Get status icon
  // ============================================

  const getStatusIcon = (status: VisitorPassStatus | string) => {
    switch (status) {
      case VisitorPassStatus.PreRegistered:
      case 'PreRegistered':
        return <Clock className="h-4 w-4 text-slate-500" />;
      case VisitorPassStatus.AtGatePendingApproval:
      case 'AtGatePendingApproval':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case VisitorPassStatus.Approved:
      case 'Approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case VisitorPassStatus.Rejected:
      case 'Rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case VisitorPassStatus.CheckedIn:
      case 'CheckedIn':
        return <LogIn className="h-4 w-4 text-blue-500" />;
      case VisitorPassStatus.CheckedOut:
      case 'CheckedOut':
        return <LogOut className="h-4 w-4 text-gray-500" />;
      case VisitorPassStatus.Expired:
      case 'Expired':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case VisitorPassStatus.Cancelled:
      case 'Cancelled':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <Users className="h-4 w-4 text-gray-400" />;
    }
  };

  // ============================================
  // No permission view
  // ============================================

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Users className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">You don&apos;t have permission to view visitor passes.</p>
      </div>
    );
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visitors</h1>
          <p className="text-gray-500 mt-1">Manage visitor passes and access control</p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <Button variant="secondary" onClick={() => setShowWalkInDialog(true)}>
              <Shield className="h-4 w-4 mr-2" />
              Walk-In
            </Button>
          )}
          {canCreate && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Pass
            </Button>
          )}
        </div>
      </div>

      {/* KPI Dashboard */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title="Pending Approval"
            value={overview.pendingApproval}
            icon={<AlertCircle className="h-6 w-6 text-amber-600" />}
            color="bg-amber-50 border-amber-200 text-amber-900"
            onClick={() => handleKpiClick(VisitorPassStatus.AtGatePendingApproval)}
          />
          <KpiCard
            title="Pre-Registered"
            value={overview.preRegisteredPending}
            icon={<Clock className="h-6 w-6 text-slate-600" />}
            color="bg-slate-50 border-slate-200 text-slate-900"
            onClick={() => handleKpiClick(VisitorPassStatus.PreRegistered)}
          />
          <KpiCard
            title="Currently Inside"
            value={overview.currentlyInside}
            icon={<LogIn className="h-6 w-6 text-blue-600" />}
            color="bg-blue-50 border-blue-200 text-blue-900"
            onClick={() => handleKpiClick(VisitorPassStatus.CheckedIn)}
          />
          <KpiCard
            title="Checked Out Today"
            value={overview.checkedOutToday}
            icon={<LogOut className="h-6 w-6 text-green-600" />}
            color="bg-green-50 border-green-200 text-green-900"
            onClick={() => handleKpiClick(VisitorPassStatus.CheckedOut)}
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search by name, phone, access code, or vehicle..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                leftAddon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-44">
              <Select value={statusFilter} onValueChange={(v) => handleFilterChange('status', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {VISITOR_PASS_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="w-full lg:w-40">
              <Select value={typeFilter} onValueChange={(v) => handleFilterChange('type', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {VISITOR_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source Filter */}
            <div className="w-full lg:w-44">
              <Select value={sourceFilter} onValueChange={(v) => handleFilterChange('source', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {VISITOR_SOURCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {(statusFilter !== 'all' || typeFilter !== 'all' || sourceFilter !== 'all' || searchTerm) && (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm('');
                  setDebouncedSearch('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setSourceFilter('all');
                  setPage(1);
                  passesFetchedRef.current = false;
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Passes List */}
      <Card>
        <CardHeader
          title="Visitor Passes"
          description={
            isLoading
              ? 'Loading...'
              : `${totalCount} pass${totalCount !== 1 ? 'es' : ''} found`
          }
        />
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-300 mb-3" />
              <p className="text-red-600">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => {
                  passesFetchedRef.current = false;
                  loadPasses(true);
                }}
              >
                Retry
              </Button>
            </div>
          ) : passes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || sourceFilter !== 'all'
                  ? 'No passes match your filters'
                  : 'No visitor passes yet'}
              </p>
              {canCreate && !searchTerm && statusFilter === 'all' && (
                <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Pass
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {passes.map((pass) => (
                <button
                  key={pass.id}
                  type="button"
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-50 transition-colors text-left"
                  onClick={() => handleViewPass(pass)}
                >
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      {getStatusIcon(pass.status)}
                    </div>

                    {/* Pass Info */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">
                          {pass.visitorName}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getVisitorPassStatusColor(
                            pass.status
                          )}`}
                        >
                          {getVisitorPassStatusLabel(pass.status)}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getVisitorTypeColor(
                            pass.visitType
                          )}`}
                        >
                          {getVisitorTypeLabel(pass.visitType)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        {/* Unit */}
                        {pass.unitNumber && (
                          <span className="flex items-center gap-1">
                            <Home className="h-3.5 w-3.5" />
                            Unit {pass.unitNumber}
                          </span>
                        )}

                        {/* Source */}
                        <span>{getVisitorSourceLabel(pass.source)}</span>

                        {/* Access Code */}
                        {pass.accessCode && (
                          <span className="flex items-center gap-1 font-mono text-xs">
                            <Hash className="h-3.5 w-3.5" />
                            {pass.accessCode}
                          </span>
                        )}

                        {/* Time */}
                        <span className="text-gray-400">
                          {pass.checkInAt
                            ? `In: ${formatDateTime(pass.checkInAt)}`
                            : pass.expectedFrom
                            ? `Expected: ${formatDateTime(pass.expectedFrom)}`
                            : formatDateTime(pass.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((p) => p - 1);
                    passesFetchedRef.current = false;
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => {
                    setPage((p) => p + 1);
                    passesFetchedRef.current = false;
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      {showCreateDialog && (
        <CreateVisitorPassDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Walk-In Dialog */}
      {showWalkInDialog && (
        <WalkInPassDialog
          open={showWalkInDialog}
          onClose={() => setShowWalkInDialog(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
