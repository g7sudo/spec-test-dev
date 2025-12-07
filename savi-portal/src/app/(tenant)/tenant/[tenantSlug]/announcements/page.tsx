'use client';

/**
 * Announcements Dashboard & List Page
 * Admin view for managing community announcements
 * Entry point: /tenant/[tenantSlug]/announcements
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Megaphone,
  Search,
  Loader2,
  ChevronRight,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle,
  Archive,
  Filter,
  Pin,
  Calendar,
  Heart,
  MessageCircle,
  Eye,
  Send,
  MoreVertical,
  Pencil,
  Trash2,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/store/auth-store';
import {
  listAnnouncements,
  deleteAnnouncement,
  archiveAnnouncement,
  pinAnnouncement,
} from '@/lib/api/announcements';
import {
  AnnouncementSummary,
  AnnouncementStatus,
  AnnouncementCategory,
  AnnouncementPriority,
  getStatusLabel,
  getStatusColor,
  getCategoryLabel,
  getCategoryColor,
  getPriorityLabel,
  getPriorityColor,
  ANNOUNCEMENT_STATUS_OPTIONS,
  ANNOUNCEMENT_CATEGORY_OPTIONS,
} from '@/types/announcement';
import { AnnouncementFormDialog, PublishAnnouncementDialog } from '@/components/announcements';

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
        flex items-center gap-4 rounded-xl border p-4 transition-all w-full text-left
        ${onClick ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}
        ${color}
      `}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/80">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm opacity-80">{title}</p>
      </div>
    </button>
  );
}

// ============================================
// Main Component
// ============================================

export default function AnnouncementsPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;

  // Refs for Strict Mode guard
  const announcementsFetchedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Auth & permissions
  const { profile } = useAuthStore();
  const permissions = profile?.permissions || {};
  const canManage = permissions['TENANT_ANNOUNCEMENT_MANAGE'] === true;
  const canView = permissions['TENANT_ANNOUNCEMENT_VIEW'] === true || canManage;

  // Data state
  const [announcements, setAnnouncements] = useState<AnnouncementSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // KPI counts
  const [kpis, setKpis] = useState({
    draft: 0,
    scheduled: 0,
    published: 0,
    archived: 0,
  });

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Dialog state
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishingAnnouncement, setPublishingAnnouncement] = useState<AnnouncementSummary | null>(null);

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ============================================
  // Data Loading
  // ============================================

  const loadAnnouncements = useCallback(async (force = false) => {
    if (!canView) return;
    if (!force && announcementsFetchedRef.current) return;
    announcementsFetchedRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const result = await listAnnouncements({
        searchTerm: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? (statusFilter as AnnouncementStatus) : undefined,
        category: categoryFilter !== 'all' ? (categoryFilter as AnnouncementCategory) : undefined,
        page,
        pageSize,
      });

      setAnnouncements(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(Math.ceil(result.totalCount / pageSize));

      // Load all announcements for KPI counts (could be optimized with a separate endpoint)
      const allResult = await listAnnouncements({ pageSize: 1000 });
      const items = allResult.items;
      setKpis({
        draft: items.filter(a => a.status === AnnouncementStatus.Draft || a.status === 'Draft').length,
        scheduled: items.filter(a => a.status === AnnouncementStatus.Scheduled || a.status === 'Scheduled').length,
        published: items.filter(a => a.status === AnnouncementStatus.Published || a.status === 'Published').length,
        archived: items.filter(a => a.status === AnnouncementStatus.Archived || a.status === 'Archived').length,
      });
    } catch (err) {
      console.error('Failed to load announcements:', err);
      setError('Failed to load announcements. Please try again.');
      announcementsFetchedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [canView, debouncedSearch, statusFilter, categoryFilter, page, pageSize]);

  // Initial load
  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
      announcementsFetchedRef.current = false;
    }, 300);
  };

  // Handle filter changes
  const handleFilterChange = (filterType: 'status' | 'category', value: string) => {
    if (filterType === 'status') {
      setStatusFilter(value);
    } else {
      setCategoryFilter(value);
    }
    setPage(1);
    announcementsFetchedRef.current = false;
  };

  // Quick filter by status (from KPI cards)
  const handleKpiClick = (status: AnnouncementStatus) => {
    setStatusFilter(status);
    setPage(1);
    announcementsFetchedRef.current = false;
  };

  // Reload when filters change
  useEffect(() => {
    loadAnnouncements(true);
  }, [debouncedSearch, statusFilter, categoryFilter, page]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // ============================================
  // Actions
  // ============================================

  const handleViewAnnouncement = (announcement: AnnouncementSummary) => {
    router.push(`/tenant/${tenantSlug}/announcements/${announcement.id}`);
  };

  const handleEdit = (announcement: AnnouncementSummary) => {
    setEditingAnnouncementId(announcement.id);
    setShowFormDialog(true);
  };

  const handlePublish = (announcement: AnnouncementSummary) => {
    setPublishingAnnouncement(announcement);
    setShowPublishDialog(true);
  };

  const handleArchive = async (announcement: AnnouncementSummary) => {
    if (!confirm('Are you sure you want to archive this announcement?')) return;

    setActionLoading(announcement.id);
    try {
      await archiveAnnouncement(announcement.id);
      announcementsFetchedRef.current = false;
      loadAnnouncements(true);
    } catch (err) {
      console.error('Failed to archive:', err);
      setError('Failed to archive announcement');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePin = async (announcement: AnnouncementSummary) => {
    setActionLoading(announcement.id);
    try {
      await pinAnnouncement(announcement.id, { isPinned: !announcement.isPinned });
      announcementsFetchedRef.current = false;
      loadAnnouncements(true);
    } catch (err) {
      console.error('Failed to toggle pin:', err);
      setError('Failed to update pin status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (announcement: AnnouncementSummary) => {
    if (!confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) return;

    setActionLoading(announcement.id);
    try {
      await deleteAnnouncement(announcement.id);
      announcementsFetchedRef.current = false;
      loadAnnouncements(true);
    } catch (err) {
      console.error('Failed to delete:', err);
      setError('Failed to delete announcement');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFormSuccess = () => {
    setShowFormDialog(false);
    setEditingAnnouncementId(null);
    announcementsFetchedRef.current = false;
    loadAnnouncements(true);
  };

  const handlePublishSuccess = () => {
    setShowPublishDialog(false);
    setPublishingAnnouncement(null);
    announcementsFetchedRef.current = false;
    loadAnnouncements(true);
  };

  // ============================================
  // Get status icon
  // ============================================

  const getStatusIcon = (status: AnnouncementStatus | string) => {
    switch (status) {
      case AnnouncementStatus.Draft:
      case 'Draft':
        return <Pencil className="h-4 w-4 text-gray-500" />;
      case AnnouncementStatus.Scheduled:
      case 'Scheduled':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case AnnouncementStatus.Published:
      case 'Published':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case AnnouncementStatus.Archived:
      case 'Archived':
        return <Archive className="h-4 w-4 text-gray-400" />;
      default:
        return <Megaphone className="h-4 w-4 text-gray-400" />;
    }
  };

  // ============================================
  // No permission view
  // ============================================

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Megaphone className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">You don&apos;t have permission to view announcements.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 mt-1">Manage community announcements and notifications</p>
        </div>
        {canManage && (
          <Button onClick={() => { setEditingAnnouncementId(null); setShowFormDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        )}
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Drafts"
          value={kpis.draft}
          icon={<Pencil className="h-6 w-6 text-gray-600" />}
          color="bg-gray-50 border-gray-200 text-gray-900"
          onClick={() => handleKpiClick(AnnouncementStatus.Draft)}
        />
        <KpiCard
          title="Scheduled"
          value={kpis.scheduled}
          icon={<Clock className="h-6 w-6 text-blue-600" />}
          color="bg-blue-50 border-blue-200 text-blue-900"
          onClick={() => handleKpiClick(AnnouncementStatus.Scheduled)}
        />
        <KpiCard
          title="Published"
          value={kpis.published}
          icon={<CheckCircle className="h-6 w-6 text-green-600" />}
          color="bg-green-50 border-green-200 text-green-900"
          onClick={() => handleKpiClick(AnnouncementStatus.Published)}
        />
        <KpiCard
          title="Archived"
          value={kpis.archived}
          icon={<Archive className="h-6 w-6 text-slate-500" />}
          color="bg-slate-50 border-slate-200 text-slate-900"
          onClick={() => handleKpiClick(AnnouncementStatus.Archived)}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search announcements..."
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
                  {ANNOUNCEMENT_STATUS_OPTIONS.map((opt) => (
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
                  {ANNOUNCEMENT_CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {(statusFilter !== 'all' || categoryFilter !== 'all' || searchTerm) && (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm('');
                  setDebouncedSearch('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setPage(1);
                  announcementsFetchedRef.current = false;
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <Card>
        <CardHeader
          title="Announcements"
          description={
            isLoading
              ? 'Loading...'
              : `${totalCount} announcement${totalCount !== 1 ? 's' : ''} found`
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
                  announcementsFetchedRef.current = false;
                  loadAnnouncements(true);
                }}
              >
                Retry
              </Button>
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Megaphone className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'No announcements match your filters'
                  : 'No announcements yet'}
              </p>
              {canManage && !searchTerm && statusFilter === 'all' && (
                <Button className="mt-4" onClick={() => setShowFormDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Announcement
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="flex items-center justify-between p-4 hover:bg-surface-50 transition-colors group"
                >
                  {/* Left Section - Click to view */}
                  <button
                    type="button"
                    className="flex items-center gap-4 flex-1 text-left"
                    onClick={() => handleViewAnnouncement(announcement)}
                  >
                    {/* Thumbnail or Status Icon */}
                    <div className="relative flex-shrink-0">
                      {announcement.primaryImageUrl ? (
                        <img
                          src={announcement.primaryImageUrl}
                          alt=""
                          className="h-14 w-14 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-lg bg-gray-100 flex items-center justify-center">
                          {getStatusIcon(announcement.status)}
                        </div>
                      )}
                      {announcement.isPinned && (
                        <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5">
                          <Pin className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Announcement Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-gray-900 truncate">
                          {announcement.title}
                        </span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(announcement.status)}`}>
                          {getStatusLabel(announcement.status)}
                        </span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getCategoryColor(announcement.category)}`}>
                          {getCategoryLabel(announcement.category)}
                        </span>
                        {announcement.priority !== AnnouncementPriority.Normal && announcement.priority !== 'Normal' && (
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                            {getPriorityLabel(announcement.priority)}
                          </span>
                        )}
                        {announcement.isEvent && (
                          <span className="inline-flex items-center gap-1 text-xs text-violet-600">
                            <Calendar className="h-3 w-3" />
                            Event
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {/* Time ago */}
                        <span>{announcement.timeAgo}</span>

                        {/* Engagement stats */}
                        {(announcement.status === AnnouncementStatus.Published || announcement.status === 'Published') && (
                          <>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3.5 w-3.5" />
                              {announcement.likeCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3.5 w-3.5" />
                              {announcement.commentCount}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Right Section - Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canManage && (
                      <>
                        {/* Quick Publish for drafts */}
                        {(announcement.status === AnnouncementStatus.Draft || announcement.status === 'Draft') && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handlePublish(announcement)}
                            disabled={actionLoading === announcement.id}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Publish
                          </Button>
                        )}

                        {/* Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="sm">
                              {actionLoading === announcement.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreVertical className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewAnnouncement(announcement)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            {(announcement.status === AnnouncementStatus.Draft || 
                              announcement.status === 'Draft' ||
                              announcement.status === AnnouncementStatus.Scheduled ||
                              announcement.status === 'Scheduled') && (
                              <DropdownMenuItem onClick={() => handleEdit(announcement)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {(announcement.status === AnnouncementStatus.Published || announcement.status === 'Published') && (
                              <>
                                <DropdownMenuItem onClick={() => handleTogglePin(announcement)}>
                                  <Pin className="h-4 w-4 mr-2" />
                                  {announcement.isPinned ? 'Unpin' : 'Pin'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleArchive(announcement)}>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              </>
                            )}
                            {(announcement.status === AnnouncementStatus.Draft || announcement.status === 'Draft') && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(announcement)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}

                    {/* View Arrow */}
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
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
                    announcementsFetchedRef.current = false;
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
                    announcementsFetchedRef.current = false;
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      {showFormDialog && (
        <AnnouncementFormDialog
          open={showFormDialog}
          onClose={() => { setShowFormDialog(false); setEditingAnnouncementId(null); }}
          onSuccess={handleFormSuccess}
          announcementId={editingAnnouncementId}
        />
      )}

      {/* Publish Dialog */}
      {showPublishDialog && publishingAnnouncement && (
        <PublishAnnouncementDialog
          open={showPublishDialog}
          onClose={() => { setShowPublishDialog(false); setPublishingAnnouncement(null); }}
          onSuccess={handlePublishSuccess}
          announcementId={publishingAnnouncement.id}
          announcementTitle={publishingAnnouncement.title}
        />
      )}
    </div>
  );
}

