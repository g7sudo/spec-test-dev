'use client';

/**
 * Campaigns List Page
 * Platform-level campaign management
 * Permission: PLATFORM_CAMPAIGNS_VIEW
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Megaphone,
  MoreVertical,
  Loader2,
  AlertCircle,
  Edit,
  Eye,
  Trash2,
  Play,
  Pause,
  ArrowLeft,
  Building,
  Image,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/store/auth-store';
import { listCampaigns, deleteCampaign, listAdvertisers } from '@/lib/api/ads';
import {
  Campaign,
  Advertiser,
  CampaignStatus,
  CampaignType,
  getCampaignStatusLabel,
  getCampaignStatusColor,
  getCampaignTypeLabel,
} from '@/types/ads';
import { CampaignFormDialog, CampaignStatusDialog } from '@/components/ads';

// ============================================
// Constants
// ============================================

const PAGE_SIZE = 20;

// ============================================
// Campaign Row Component
// ============================================

interface CampaignRowProps {
  campaign: Campaign;
  canManage: boolean;
  onView: () => void;
  onEdit: () => void;
  onUpdateStatus: () => void;
  onDelete: () => void;
}

function CampaignRow({
  campaign,
  canManage,
  onView,
  onEdit,
  onUpdateStatus,
  onDelete,
}: CampaignRowProps) {
  return (
    <tr className="hover:bg-surface-50 cursor-pointer transition-colors" onClick={onView}>
      {/* Name & Type */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{campaign.name}</p>
            <p className="text-sm text-gray-500">
              {getCampaignTypeLabel(campaign.type)} • {campaign.advertiserName}
            </p>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getCampaignStatusColor(
            campaign.status
          )}`}
        >
          {getCampaignStatusLabel(campaign.status)}
        </span>
      </td>

      {/* Schedule */}
      <td className="px-4 py-3">
        <div className="text-sm">
          <p className="text-gray-600">{new Date(campaign.startsAt).toLocaleDateString()}</p>
          {campaign.endsAt && (
            <p className="text-gray-400">
              to {new Date(campaign.endsAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </td>

      {/* Targeting */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Building className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {campaign.targetTenantCount} communities
          </span>
        </div>
      </td>

      {/* Creatives */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Image className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">{campaign.creativeCount} creatives</span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>

            {canManage && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus();
                  }}
                >
                  {campaign.status === CampaignStatus.Active ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Campaign
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Update Status
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-error"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// ============================================
// Empty State
// ============================================

interface EmptyStateProps {
  canManage: boolean;
  onCreateClick: () => void;
}

function EmptyState({ canManage, onCreateClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
        <Megaphone className="h-8 w-8 text-primary-600" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No campaigns yet</h3>
      <p className="mt-1 text-sm text-gray-500">
        Create a campaign to start advertising to your communities.
      </p>
      {canManage && (
        <Button className="mt-4" onClick={onCreateClick}>
          <Plus className="h-4 w-4" />
          Create Campaign
        </Button>
      )}
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function CampaignsPage() {
  const router = useRouter();
  const { profile } = useAuthStore();

  // Guard to prevent double-fetch in React Strict Mode
  const fetchedRef = useRef(false);
  const advertisersFetchedRef = useRef(false);

  // State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAdvertiser, setFilterAdvertiser] = useState<string>('all');

  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [statusCampaign, setStatusCampaign] = useState<Campaign | null>(null);

  // Permissions (singular form: PLATFORM_CAMPAIGN_*)
  const permissions = profile?.permissions || {};
  const canCreate = permissions['PLATFORM_CAMPAIGN_CREATE'] === true;
  const canUpdate = permissions['PLATFORM_CAMPAIGN_UPDATE'] === true;
  const canDelete = permissions['PLATFORM_CAMPAIGN_DELETE'] === true;
  const canManage = canCreate || canUpdate || canDelete;

  // Fetch advertisers (for filter)
  const fetchAdvertisers = useCallback(async () => {
    if (advertisersFetchedRef.current) return;
    advertisersFetchedRef.current = true;

    try {
      const result = await listAdvertisers({ pageSize: 100 });
      setAdvertisers(result.items);
    } catch (err) {
      console.error('Failed to fetch advertisers:', err);
    }
  }, []);

  // Fetch campaigns
  const fetchCampaigns = useCallback(
    async (force = false) => {
      if (fetchedRef.current && !force) return;
      fetchedRef.current = true;

      setIsLoading(true);
      setError(null);

      try {
        const result = await listCampaigns({
          page,
          pageSize: PAGE_SIZE,
          searchTerm: searchTerm || undefined,
          status: filterStatus !== 'all' ? (parseInt(filterStatus) as CampaignStatus) : undefined,
          type: filterType !== 'all' ? (parseInt(filterType) as CampaignType) : undefined,
          advertiserId: filterAdvertiser !== 'all' ? filterAdvertiser : undefined,
        });

        setCampaigns(result.items);
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error('Failed to fetch campaigns:', err);
        setError('Failed to load campaigns');
        fetchedRef.current = false;
      } finally {
        setIsLoading(false);
      }
    },
    [page, searchTerm, filterStatus, filterType, filterAdvertiser]
  );

  useEffect(() => {
    fetchAdvertisers();
  }, [fetchAdvertisers]);

  useEffect(() => {
    fetchedRef.current = false;
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  // Handle filter changes
  const handleFilterChange = (type: 'status' | 'type' | 'advertiser', value: string) => {
    if (type === 'status') setFilterStatus(value);
    if (type === 'type') setFilterType(value);
    if (type === 'advertiser') setFilterAdvertiser(value);
    setPage(1);
  };

  // Handle delete
  const handleDelete = async (campaign: Campaign) => {
    if (!confirm(`Are you sure you want to delete "${campaign.name}"?`)) {
      return;
    }

    try {
      await deleteCampaign(campaign.id);
      fetchCampaigns(true);
    } catch (err) {
      console.error('Failed to delete campaign:', err);
      alert('Failed to delete campaign. Please try again.');
    }
  };

  // Navigate to detail
  const navigateToDetail = (campaignId: string) => {
    router.push(`/platform/ads/campaigns/${campaignId}`);
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingCampaignId(null);
    fetchCampaigns(true);
  };

  // Handle status update success
  const handleStatusSuccess = () => {
    setStatusCampaign(null);
    fetchCampaigns(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/platform/ads')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-sm text-gray-500">Manage advertising campaigns</p>
          </div>
        </div>

        {canCreate && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Campaign
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="grid gap-4 sm:grid-cols-4">
            {/* Search */}
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              leftAddon={<Search className="h-4 w-4" />}
            />

            {/* Status Filter */}
            <Select
              value={filterStatus}
              onValueChange={(v) => handleFilterChange('status', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={CampaignStatus.Draft.toString()}>Draft</SelectItem>
                <SelectItem value={CampaignStatus.Active.toString()}>Active</SelectItem>
                <SelectItem value={CampaignStatus.Paused.toString()}>Paused</SelectItem>
                <SelectItem value={CampaignStatus.Ended.toString()}>Ended</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={(v) => handleFilterChange('type', v)}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value={CampaignType.Banner.toString()}>Banner</SelectItem>
                <SelectItem value={CampaignType.Story.toString()}>Story</SelectItem>
              </SelectContent>
            </Select>

            {/* Advertiser Filter */}
            <Select
              value={filterAdvertiser}
              onValueChange={(v) => handleFilterChange('advertiser', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Advertisers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Advertisers</SelectItem>
                {advertisers.map((adv) => (
                  <SelectItem key={adv.id} value={adv.id}>
                    {adv.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        {isLoading ? (
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <p className="mt-3 text-gray-500">Loading campaigns...</p>
            </div>
          </CardContent>
        ) : error ? (
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-8 w-8 text-error" />
              <p className="mt-3 font-medium text-gray-900">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchCampaigns(true)}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        ) : campaigns.length === 0 ? (
          <CardContent>
            <EmptyState canManage={canCreate} onCreateClick={() => setIsFormOpen(true)} />
          </CardContent>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-50 text-left text-sm font-medium text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Campaign</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Schedule</th>
                    <th className="px-4 py-3">Targeting</th>
                    <th className="px-4 py-3">Creatives</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {campaigns.map((campaign) => (
                    <CampaignRow
                      key={campaign.id}
                      campaign={campaign}
                      canManage={canManage}
                      onView={() => navigateToDetail(campaign.id)}
                      onEdit={() => setEditingCampaignId(campaign.id)}
                      onUpdateStatus={() => setStatusCampaign(campaign)}
                      onDelete={() => handleDelete(campaign)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <CampaignFormDialog
        open={isFormOpen || !!editingCampaignId}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCampaignId(null);
        }}
        onSuccess={handleFormSuccess}
        campaignId={editingCampaignId}
      />

      {/* Status Dialog */}
      <CampaignStatusDialog
        open={!!statusCampaign}
        onClose={() => setStatusCampaign(null)}
        onSuccess={handleStatusSuccess}
        campaign={statusCampaign}
      />
    </div>
  );
}

