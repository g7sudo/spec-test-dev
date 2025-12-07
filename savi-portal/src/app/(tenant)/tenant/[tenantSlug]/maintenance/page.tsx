'use client';

/**
 * Maintenance Dashboard & List Page
 * Shows KPIs, worklist, and filters for maintenance requests
 * Entry point: /tenant/[tenantSlug]/maintenance
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Wrench,
  Search,
  Loader2,
  ChevronRight,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  Home,
  User,
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
import { listMaintenanceRequests, listMaintenanceCategories } from '@/lib/api/maintenance';
import {
  MaintenanceRequestSummary,
  MaintenanceCategorySummary,
  MaintenanceStatus,
  MaintenancePriority,
  getMaintenanceStatusLabel,
  getMaintenanceStatusColor,
  getMaintenancePriorityLabel,
  getMaintenancePriorityColor,
  formatDateTime,
  MAINTENANCE_STATUS_OPTIONS,
  MAINTENANCE_PRIORITY_OPTIONS,
} from '@/types/maintenance';
import { CreateMaintenanceRequestDialog } from '@/components/maintenance/CreateMaintenanceRequestDialog';

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

export default function MaintenancePage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  
  // Refs for Strict Mode guard (separate for each fetch)
  const requestsFetchedRef = useRef(false);
  const categoriesFetchedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Auth & permissions
  const { profile } = useAuthStore();
  const permissions = profile?.permissions || {};
  const canView = permissions['TENANT_MAINTENANCE_REQUEST_VIEW'] === true;
  const canCreate = permissions['TENANT_MAINTENANCE_REQUEST_CREATE'] === true;

  // Data state
  const [requests, setRequests] = useState<MaintenanceRequestSummary[]>([]);
  const [categories, setCategories] = useState<MaintenanceCategorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // KPI counts
  const [kpis, setKpis] = useState({
    new: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
  });

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // ============================================
  // Data Loading
  // ============================================

  // Load categories for filter dropdown
  const loadCategories = useCallback(async (force = false) => {
    if (!canView) return;
    if (!force && categoriesFetchedRef.current) return;
    categoriesFetchedRef.current = true;

    try {
      const result = await listMaintenanceCategories({ pageSize: 100 });
      setCategories(result.items);
    } catch (err) {
      console.error('Failed to load categories:', err);
      categoriesFetchedRef.current = false;
    }
  }, [canView]);

  // Load requests with filters
  const loadRequests = useCallback(async (force = false) => {
    if (!canView) return;
    if (!force && requestsFetchedRef.current) return;
    requestsFetchedRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const result = await listMaintenanceRequests({
        searchTerm: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? (statusFilter as MaintenanceStatus) : undefined,
        priority: priorityFilter !== 'all' ? (priorityFilter as MaintenancePriority) : undefined,
        categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
        page,
        pageSize,
      });

      setRequests(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(Math.ceil(result.totalCount / pageSize));

      // Calculate KPIs from all data (could also be separate API call)
      // For now, calculate from current page - ideally backend would provide KPIs
      const allResult = await listMaintenanceRequests({ pageSize: 1000 });
      const items = allResult.items;
      setKpis({
        new: items.filter(r => r.status === MaintenanceStatus.New || r.status === 'New').length,
        assigned: items.filter(r => r.status === MaintenanceStatus.Assigned || r.status === 'Assigned').length,
        inProgress: items.filter(r => r.status === MaintenanceStatus.InProgress || r.status === 'InProgress').length,
        completed: items.filter(r => r.status === MaintenanceStatus.Completed || r.status === 'Completed').length,
      });
    } catch (err) {
      console.error('Failed to load requests:', err);
      setError('Failed to load maintenance requests. Please try again.');
      requestsFetchedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [canView, debouncedSearch, statusFilter, priorityFilter, categoryFilter, page, pageSize]);

  // Initial load
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
      requestsFetchedRef.current = false;
    }, 300);
  };

  // Handle filter changes
  const handleFilterChange = (filterType: 'status' | 'priority' | 'category', value: string) => {
    switch (filterType) {
      case 'status':
        setStatusFilter(value);
        break;
      case 'priority':
        setPriorityFilter(value);
        break;
      case 'category':
        setCategoryFilter(value);
        break;
    }
    setPage(1);
    requestsFetchedRef.current = false;
  };

  // Quick filter by status (from KPI cards)
  const handleKpiClick = (status: MaintenanceStatus) => {
    setStatusFilter(status);
    setPage(1);
    requestsFetchedRef.current = false;
  };

  // Reload when filters change
  useEffect(() => {
    loadRequests(true);
  }, [debouncedSearch, statusFilter, priorityFilter, categoryFilter, page]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Navigate to request detail
  const handleViewRequest = (request: MaintenanceRequestSummary) => {
    router.push(`/tenant/${tenantSlug}/maintenance/${request.id}`);
  };

  // Handle create success
  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    requestsFetchedRef.current = false;
    loadRequests(true);
  };

  // ============================================
  // Get status icon
  // ============================================

  const getStatusIcon = (status: MaintenanceStatus | string) => {
    switch (status) {
      case MaintenanceStatus.New:
      case 'New':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case MaintenanceStatus.Assigned:
      case 'Assigned':
        return <User className="h-4 w-4 text-indigo-500" />;
      case MaintenanceStatus.InProgress:
      case 'InProgress':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case MaintenanceStatus.WaitingForResident:
      case 'WaitingForResident':
        return <AlertTriangle className="h-4 w-4 text-purple-500" />;
      case MaintenanceStatus.Completed:
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case MaintenanceStatus.Rejected:
      case 'Rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case MaintenanceStatus.Cancelled:
      case 'Cancelled':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <Wrench className="h-4 w-4 text-gray-400" />;
    }
  };

  // ============================================
  // No permission view
  // ============================================

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Wrench className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">You don&apos;t have permission to view maintenance requests.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-500 mt-1">Manage unit maintenance requests</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        )}
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="New"
          value={kpis.new}
          icon={<AlertCircle className="h-6 w-6 text-blue-600" />}
          color="bg-blue-50 border-blue-200 text-blue-900"
          onClick={() => handleKpiClick(MaintenanceStatus.New)}
        />
        <KpiCard
          title="Assigned"
          value={kpis.assigned}
          icon={<User className="h-6 w-6 text-indigo-600" />}
          color="bg-indigo-50 border-indigo-200 text-indigo-900"
          onClick={() => handleKpiClick(MaintenanceStatus.Assigned)}
        />
        <KpiCard
          title="In Progress"
          value={kpis.inProgress}
          icon={<Clock className="h-6 w-6 text-amber-600" />}
          color="bg-amber-50 border-amber-200 text-amber-900"
          onClick={() => handleKpiClick(MaintenanceStatus.InProgress)}
        />
        <KpiCard
          title="Completed"
          value={kpis.completed}
          icon={<CheckCircle className="h-6 w-6 text-green-600" />}
          color="bg-green-50 border-green-200 text-green-900"
          onClick={() => handleKpiClick(MaintenanceStatus.Completed)}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search by ticket #, unit, or title..."
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
                  {MAINTENANCE_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="w-full lg:w-40">
              <Select value={priorityFilter} onValueChange={(v) => handleFilterChange('priority', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {MAINTENANCE_PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="w-full lg:w-44">
              <Select value={categoryFilter} onValueChange={(v) => handleFilterChange('category', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {(statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || searchTerm) && (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm('');
                  setDebouncedSearch('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setCategoryFilter('all');
                  setPage(1);
                  requestsFetchedRef.current = false;
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardHeader
          title="Maintenance Requests"
          description={
            isLoading
              ? 'Loading...'
              : `${totalCount} request${totalCount !== 1 ? 's' : ''} found`
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
                  requestsFetchedRef.current = false;
                  loadRequests(true);
                }}
              >
                Retry
              </Button>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wrench className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
                  ? 'No requests match your filters'
                  : 'No maintenance requests yet'}
              </p>
              {canCreate && !searchTerm && statusFilter === 'all' && (
                <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Request
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {requests.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-50 transition-colors text-left"
                  onClick={() => handleViewRequest(request)}
                >
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      {getStatusIcon(request.status)}
                    </div>

                    {/* Request Info */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm text-gray-500">
                          {request.ticketNumber}
                        </span>
                        <span className="font-medium text-gray-900">
                          {request.title}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getMaintenanceStatusColor(
                            request.status
                          )}`}
                        >
                          {getMaintenanceStatusLabel(request.status)}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getMaintenancePriorityColor(
                            request.priority
                          )}`}
                        >
                          {getMaintenancePriorityLabel(request.priority)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        {/* Unit */}
                        {request.unitNumber && (
                          <span className="flex items-center gap-1">
                            <Home className="h-3.5 w-3.5" />
                            Unit {request.unitNumber}
                          </span>
                        )}

                        {/* Category */}
                        {request.categoryName && (
                          <span>{request.categoryName}</span>
                        )}

                        {/* Assigned To */}
                        {request.assignedToUserName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {request.assignedToUserName}
                          </span>
                        )}

                        {/* Requested At */}
                        <span className="text-gray-400">
                          {formatDateTime(request.requestedAt)}
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
                    requestsFetchedRef.current = false;
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
                    requestsFetchedRef.current = false;
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
        <CreateMaintenanceRequestDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}

