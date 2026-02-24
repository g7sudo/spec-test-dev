'use client';

/**
 * Campaign Detail Page
 * View campaign details, creatives, and analytics
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Megaphone,
  Calendar,
  Building,
  Edit,
  Plus,
  Trash2,
  Image,
  Play,
  Pause,
  Eye,
  MousePointer,
  BarChart3,
  Loader2,
  AlertCircle,
  Link,
  Phone,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuthStore } from '@/lib/store/auth-store';
import {
  getCampaignById,
  getCampaignCreatives,
  getCampaignAnalytics,
  deleteCreative,
} from '@/lib/api/ads';
import {
  Campaign,
  CampaignCreative,
  CampaignAnalytics,
  CampaignType,
  CampaignStatus,
  getCampaignStatusLabel,
  getCampaignStatusColor,
  getCampaignTypeLabel,
  getCreativeTypeLabel,
  getAdPlacementLabel,
  getCTATypeLabel,
  CTAType,
} from '@/types/ads';
import {
  CampaignFormDialog,
  CreativeFormDialog,
  CampaignStatusDialog,
} from '@/components/ads';

// ============================================
// Creative Card Component
// ============================================

interface CreativeCardProps {
  creative: CampaignCreative;
  campaignType: CampaignType;
  canManage: boolean;
  onDelete: () => void;
}

function CreativeCard({ creative, campaignType, canManage, onDelete }: CreativeCardProps) {
  const isBanner = campaignType === CampaignType.Banner;

  // Get CTA icon
  const getCTAIcon = (type: CTAType) => {
    switch (type) {
      case CTAType.Call:
        return <Phone className="h-3 w-3" />;
      case CTAType.WhatsApp:
        return <MessageSquare className="h-3 w-3" />;
      case CTAType.Link:
        return <Link className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Preview Image */}
      <div className="aspect-video bg-gray-100 relative">
        <img
          src={creative.mediaUrl}
          alt={creative.caption || 'Creative preview'}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-image.svg';
          }}
        />
        {!isBanner && creative.sequence && (
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            Slide {creative.sequence}
          </div>
        )}
      </div>

      <CardContent className="py-3">
        <div className="space-y-2">
          {/* Type & Placement */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              {getCreativeTypeLabel(creative.type)}
              {creative.placement !== null && ` • ${getAdPlacementLabel(creative.placement)}`}
            </span>
            {creative.sizeCode && (
              <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                {creative.sizeCode}
              </span>
            )}
          </div>

          {/* Caption */}
          {creative.caption && (
            <p className="text-sm text-gray-700 line-clamp-2">{creative.caption}</p>
          )}

          {/* CTA */}
          {creative.ctaType !== CTAType.None && (
            <div className="flex items-center gap-1.5 text-xs text-primary-600">
              {getCTAIcon(creative.ctaType)}
              <span>
                {getCTATypeLabel(creative.ctaType)}
                {creative.ctaValue && `: ${creative.ctaValue.substring(0, 30)}...`}
              </span>
            </div>
          )}

          {/* Actions */}
          {canManage && (
            <div className="pt-2 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                className="text-error w-full"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const { profile } = useAuthStore();

  // Refs for Strict Mode guard
  const campaignFetchedRef = useRef(false);
  const creativesFetchedRef = useRef(false);
  const analyticsFetchedRef = useRef(false);

  // State
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [creatives, setCreatives] = useState<CampaignCreative[]>([]);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreativeFormOpen, setIsCreativeFormOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

  // Permissions (singular form: PLATFORM_CAMPAIGN_*)
  const permissions = profile?.permissions || {};
  const canUpdate = permissions['PLATFORM_CAMPAIGN_UPDATE'] === true;
  const canManageStatus = permissions['PLATFORM_CAMPAIGN_MANAGE_STATUS'] === true;

  // Fetch campaign
  const fetchCampaign = useCallback(async () => {
    if (campaignFetchedRef.current) return;
    campaignFetchedRef.current = true;

    try {
      const result = await getCampaignById(campaignId);
      setCampaign(result);
    } catch (err) {
      console.error('Failed to fetch campaign:', err);
      setError('Failed to load campaign details');
      campaignFetchedRef.current = false;
    }
  }, [campaignId]);

  // Fetch creatives
  const fetchCreatives = useCallback(
    async (force = false) => {
      if (!force && creativesFetchedRef.current) return;
      creativesFetchedRef.current = true;

      try {
        const result = await getCampaignCreatives(campaignId);
        setCreatives(result);
      } catch (err) {
        console.error('Failed to fetch creatives:', err);
        creativesFetchedRef.current = false;
      }
    },
    [campaignId]
  );

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    if (analyticsFetchedRef.current) return;
    analyticsFetchedRef.current = true;

    try {
      const result = await getCampaignAnalytics(campaignId);
      setAnalytics(result);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      analyticsFetchedRef.current = false;
    }
  }, [campaignId]);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchCampaign(), fetchCreatives(), fetchAnalytics()]).finally(() => {
      setIsLoading(false);
    });
  }, [fetchCampaign, fetchCreatives, fetchAnalytics]);

  // Handle edit success
  const handleEditSuccess = () => {
    setIsEditOpen(false);
    campaignFetchedRef.current = false;
    fetchCampaign();
  };

  // Handle creative form success
  const handleCreativeSuccess = () => {
    setIsCreativeFormOpen(false);
    creativesFetchedRef.current = false;
    fetchCreatives(true);
    // Refresh campaign to get updated creative count
    campaignFetchedRef.current = false;
    fetchCampaign();
  };

  // Handle status update success
  const handleStatusSuccess = () => {
    setIsStatusDialogOpen(false);
    campaignFetchedRef.current = false;
    fetchCampaign();
  };

  // Handle delete creative
  const handleDeleteCreative = async (creativeId: string) => {
    if (!confirm('Are you sure you want to delete this creative?')) return;

    try {
      await deleteCreative(creativeId);
      fetchCreatives(true);
      campaignFetchedRef.current = false;
      fetchCampaign();
    } catch (err) {
      console.error('Failed to delete creative:', err);
      alert('Failed to delete creative. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="mt-3 text-gray-500">Loading campaign...</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-8 w-8 text-error" />
        <p className="mt-3 font-medium text-gray-900">{error || 'Campaign not found'}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push('/platform/ads/campaigns')}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Campaigns
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/platform/ads/campaigns')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <Megaphone className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getCampaignStatusColor(
                    campaign.status
                  )}`}
                >
                  {getCampaignStatusLabel(campaign.status)}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {getCampaignTypeLabel(campaign.type)} • {campaign.advertiserName}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {canManageStatus && campaign.status !== CampaignStatus.Ended && (
            <Button variant="secondary" onClick={() => setIsStatusDialogOpen(true)}>
              {campaign.status === CampaignStatus.Active ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Activate
                </>
              )}
            </Button>
          )}
          {canUpdate && (
            <Button onClick={() => setIsEditOpen(true)}>
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">
            <FileText className="h-4 w-4 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="creatives">
            <Image className="h-4 w-4 mr-1" />
            Creatives ({creatives.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-1" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Schedule */}
            <Card>
              <CardContent className="py-5">
                <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
                  <Calendar className="h-4 w-4" />
                  Schedule
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Starts</p>
                    <p className="font-medium text-gray-900">
                      {new Date(campaign.startsAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ends</p>
                    <p className="font-medium text-gray-900">
                      {campaign.endsAt
                        ? new Date(campaign.endsAt).toLocaleString()
                        : 'No end date'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Targeting */}
            <Card>
              <CardContent className="py-5">
                <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
                  <Building className="h-4 w-4" />
                  Target Communities
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {campaign.targetTenantCount} communities
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Campaign will be shown in these selected communities
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Limits & Priority */}
          <Card>
            <CardContent className="py-5">
              <h3 className="font-semibold text-gray-900 mb-4">Limits & Priority</h3>
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <p className="font-medium text-gray-900">{campaign.priority}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Max Impressions</p>
                  <p className="font-medium text-gray-900">
                    {campaign.maxImpressions?.toLocaleString() || 'No limit'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Max Clicks</p>
                  <p className="font-medium text-gray-900">
                    {campaign.maxClicks?.toLocaleString() || 'No limit'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Daily Imp. Cap</p>
                  <p className="font-medium text-gray-900">
                    {campaign.dailyImpressionCap?.toLocaleString() || 'No limit'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {campaign.notes && (
            <Card>
              <CardContent className="py-5">
                <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{campaign.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Creatives Tab */}
        <TabsContent value="creatives">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {creatives.length} creative{creatives.length !== 1 ? 's' : ''} in this campaign
              </p>
              {canUpdate && (
                <Button onClick={() => setIsCreativeFormOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add {campaign.type === CampaignType.Banner ? 'Banner' : 'Story Slide'}
                </Button>
              )}
            </div>

            {/* Creatives Grid */}
            {creatives.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Image className="h-12 w-12 text-gray-300 mx-auto" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    No creatives yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add{' '}
                    {campaign.type === CampaignType.Banner
                      ? 'banner creatives'
                      : 'story slides'}{' '}
                    to this campaign.
                  </p>
                  {canUpdate && (
                    <Button className="mt-4" onClick={() => setIsCreativeFormOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Add Creative
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {creatives.map((creative) => (
                  <CreativeCard
                    key={creative.id}
                    creative={creative}
                    campaignType={campaign.type}
                    canManage={canUpdate}
                    onDelete={() => handleDeleteCreative(creative.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          {analytics ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid gap-4 sm:grid-cols-4">
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <Eye className="h-6 w-6 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {analytics.totalImpressions.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">Impressions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <MousePointer className="h-6 w-6 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {analytics.totalClicks.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">Clicks</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-6 w-6 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {analytics.clickThroughRate.toFixed(2)}%
                        </p>
                        <p className="text-sm text-gray-500">CTR</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <Building className="h-6 w-6 text-orange-500" />
                      <div>
                        <p className="text-2xl font-bold">{analytics.uniqueUsers}</p>
                        <p className="text-sm text-gray-500">Unique Users</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Breakdown by Tenant */}
              {analytics.byTenant.length > 0 && (
                <Card>
                  <CardContent className="py-5">
                    <h3 className="font-semibold text-gray-900 mb-4">By Community</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="text-left text-sm font-medium text-gray-500">
                          <tr>
                            <th className="pb-3">Community</th>
                            <th className="pb-3 text-right">Impressions</th>
                            <th className="pb-3 text-right">Clicks</th>
                            <th className="pb-3 text-right">CTR</th>
                            <th className="pb-3 text-right">Unique Users</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {analytics.byTenant.map((tenant) => (
                            <tr key={tenant.tenantId}>
                              <td className="py-3 font-medium text-gray-900">
                                {tenant.tenantName}
                              </td>
                              <td className="py-3 text-right">
                                {tenant.impressions.toLocaleString()}
                              </td>
                              <td className="py-3 text-right">
                                {tenant.clicks.toLocaleString()}
                              </td>
                              <td className="py-3 text-right">
                                {tenant.clickThroughRate.toFixed(2)}%
                              </td>
                              <td className="py-3 text-right">{tenant.uniqueUsers}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Breakdown by Placement */}
              {analytics.byPlacement.length > 0 && (
                <Card>
                  <CardContent className="py-5">
                    <h3 className="font-semibold text-gray-900 mb-4">By Placement</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="text-left text-sm font-medium text-gray-500">
                          <tr>
                            <th className="pb-3">Placement</th>
                            <th className="pb-3 text-right">Impressions</th>
                            <th className="pb-3 text-right">Clicks</th>
                            <th className="pb-3 text-right">CTR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {analytics.byPlacement.map((placement) => (
                            <tr key={placement.placement}>
                              <td className="py-3 font-medium text-gray-900">
                                {placement.placement}
                              </td>
                              <td className="py-3 text-right">
                                {placement.impressions.toLocaleString()}
                              </td>
                              <td className="py-3 text-right">
                                {placement.clicks.toLocaleString()}
                              </td>
                              <td className="py-3 text-right">
                                {placement.clickThroughRate.toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No analytics data</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Analytics will appear once the campaign starts receiving impressions.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <CampaignFormDialog
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={handleEditSuccess}
        campaignId={campaignId}
      />

      {/* Creative Form Dialog */}
      <CreativeFormDialog
        open={isCreativeFormOpen}
        onClose={() => setIsCreativeFormOpen(false)}
        onSuccess={handleCreativeSuccess}
        campaignId={campaignId}
        campaignType={campaign.type}
        existingSequences={creatives
          .filter((c) => c.sequence !== null)
          .map((c) => c.sequence as number)}
      />

      {/* Status Dialog */}
      <CampaignStatusDialog
        open={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        onSuccess={handleStatusSuccess}
        campaign={campaign}
      />
    </div>
  );
}

