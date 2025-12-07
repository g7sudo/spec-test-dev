'use client';

/**
 * Advertiser Detail Page
 * View advertiser details, campaigns, and analytics
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  FileText,
  Edit,
  Megaphone,
  BarChart3,
  Loader2,
  AlertCircle,
  Plus,
  Eye,
  MousePointer,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuthStore } from '@/lib/store/auth-store';
import { getAdvertiserById, getAdvertiserAnalytics, listCampaigns } from '@/lib/api/ads';
import {
  Advertiser,
  AdvertiserAnalytics,
  Campaign,
  getCampaignStatusLabel,
  getCampaignStatusColor,
  getCampaignTypeLabel,
} from '@/types/ads';
import { AdvertiserFormDialog, CampaignFormDialog } from '@/components/ads';

// ============================================
// Main Page Component
// ============================================

export default function AdvertiserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const advertiserId = params.id as string;
  const initialTab = searchParams.get('tab') || 'overview';

  const { profile } = useAuthStore();

  // Refs for Strict Mode guard
  const advertiserFetchedRef = useRef(false);
  const campaignsFetchedRef = useRef(false);
  const analyticsFetchedRef = useRef(false);

  // State
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [analytics, setAnalytics] = useState<AdvertiserAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCampaignFormOpen, setIsCampaignFormOpen] = useState(false);

  // Permissions (singular form: PLATFORM_ADVERTISER_*, PLATFORM_CAMPAIGN_*)
  const permissions = profile?.permissions || {};
  const canUpdate = permissions['PLATFORM_ADVERTISER_UPDATE'] === true;
  const canCreateCampaign = permissions['PLATFORM_CAMPAIGN_CREATE'] === true;

  // Fetch advertiser
  const fetchAdvertiser = useCallback(async () => {
    if (advertiserFetchedRef.current) return;
    advertiserFetchedRef.current = true;

    try {
      const result = await getAdvertiserById(advertiserId);
      setAdvertiser(result);
    } catch (err) {
      console.error('Failed to fetch advertiser:', err);
      setError('Failed to load advertiser details');
      advertiserFetchedRef.current = false;
    }
  }, [advertiserId]);

  // Fetch campaigns
  const fetchCampaigns = useCallback(async (force = false) => {
    if (!force && campaignsFetchedRef.current) return;
    campaignsFetchedRef.current = true;

    try {
      const result = await listCampaigns({
        advertiserId,
        pageSize: 50,
      });
      setCampaigns(result.items);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
      campaignsFetchedRef.current = false;
    }
  }, [advertiserId]);

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    if (analyticsFetchedRef.current) return;
    analyticsFetchedRef.current = true;

    try {
      const result = await getAdvertiserAnalytics(advertiserId);
      setAnalytics(result);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      analyticsFetchedRef.current = false;
    }
  }, [advertiserId]);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchAdvertiser(), fetchCampaigns(), fetchAnalytics()]).finally(() => {
      setIsLoading(false);
    });
  }, [fetchAdvertiser, fetchCampaigns, fetchAnalytics]);

  // Handle edit success
  const handleEditSuccess = () => {
    setIsEditOpen(false);
    advertiserFetchedRef.current = false;
    fetchAdvertiser();
  };

  // Handle campaign form success
  const handleCampaignFormSuccess = () => {
    setIsCampaignFormOpen(false);
    campaignsFetchedRef.current = false;
    fetchCampaigns(true);
    // Also refresh analytics
    analyticsFetchedRef.current = false;
    fetchAnalytics();
  };

  // Navigate to campaign detail
  const navigateToCampaign = (campaignId: string) => {
    router.push(`/platform/ads/campaigns/${campaignId}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="mt-3 text-gray-500">Loading advertiser...</p>
      </div>
    );
  }

  if (error || !advertiser) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-8 w-8 text-error" />
        <p className="mt-3 font-medium text-gray-900">{error || 'Advertiser not found'}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push('/platform/ads/advertisers')}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Advertisers
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
            onClick={() => router.push('/platform/ads/advertisers')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <Building className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{advertiser.name}</h1>
              <p className="text-sm text-gray-500">
                Created {new Date(advertiser.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {canCreateCampaign && (
            <Button variant="secondary" onClick={() => setIsCampaignFormOpen(true)}>
              <Plus className="h-4 w-4" />
              New Campaign
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">
            <Building className="h-4 w-4 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Megaphone className="h-4 w-4 mr-1" />
            Campaigns ({campaigns.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-1" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Contact Info */}
            <Card>
              <CardContent className="py-5">
                <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {advertiser.contactName && (
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{advertiser.contactName}</span>
                    </div>
                  )}
                  {advertiser.contactEmail && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a
                        href={`mailto:${advertiser.contactEmail}`}
                        className="text-primary-600 hover:underline"
                      >
                        {advertiser.contactEmail}
                      </a>
                    </div>
                  )}
                  {advertiser.contactPhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a
                        href={`tel:${advertiser.contactPhone}`}
                        className="text-primary-600 hover:underline"
                      >
                        {advertiser.contactPhone}
                      </a>
                    </div>
                  )}
                  {!advertiser.contactName &&
                    !advertiser.contactEmail &&
                    !advertiser.contactPhone && (
                      <p className="text-gray-400">No contact information provided</p>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardContent className="py-5">
                <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
                  <FileText className="h-4 w-4" />
                  Notes
                </h3>
                {advertiser.notes ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{advertiser.notes}</p>
                ) : (
                  <p className="text-gray-400">No notes</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          {analytics && (
            <div className="grid gap-4 sm:grid-cols-4">
              <Card>
                <CardContent className="py-4 text-center">
                  <Megaphone className="h-6 w-6 text-primary-500 mx-auto" />
                  <p className="mt-2 text-2xl font-bold">{analytics.totalCampaigns}</p>
                  <p className="text-sm text-gray-500">Total Campaigns</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <TrendingUp className="h-6 w-6 text-green-500 mx-auto" />
                  <p className="mt-2 text-2xl font-bold">{analytics.activeCampaigns}</p>
                  <p className="text-sm text-gray-500">Active Campaigns</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <Eye className="h-6 w-6 text-blue-500 mx-auto" />
                  <p className="mt-2 text-2xl font-bold">
                    {analytics.totalImpressions.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">Total Impressions</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <MousePointer className="h-6 w-6 text-purple-500 mx-auto" />
                  <p className="mt-2 text-2xl font-bold">
                    {analytics.clickThroughRate.toFixed(2)}%
                  </p>
                  <p className="text-sm text-gray-500">Avg. CTR</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns">
          <Card>
            {campaigns.length === 0 ? (
              <CardContent className="py-16 text-center">
                <Megaphone className="h-12 w-12 text-gray-300 mx-auto" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No campaigns yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create a campaign to start advertising.
                </p>
                {canCreateCampaign && (
                  <Button className="mt-4" onClick={() => setIsCampaignFormOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Create Campaign
                  </Button>
                )}
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-50 text-left text-sm font-medium text-gray-600">
                    <tr>
                      <th className="px-4 py-3">Campaign</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Schedule</th>
                      <th className="px-4 py-3">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {campaigns.map((campaign) => (
                      <tr
                        key={campaign.id}
                        className="hover:bg-surface-50 cursor-pointer transition-colors"
                        onClick={() => navigateToCampaign(campaign.id)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{campaign.name}</p>
                          <p className="text-sm text-gray-500">
                            {campaign.targetTenantCount} communities
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {getCampaignTypeLabel(campaign.type)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getCampaignStatusColor(
                              campaign.status
                            )}`}
                          >
                            {getCampaignStatusLabel(campaign.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <p>{new Date(campaign.startsAt).toLocaleDateString()}</p>
                          {campaign.endsAt && (
                            <p className="text-xs">
                              to {new Date(campaign.endsAt).toLocaleDateString()}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-600">
                            {campaign.creativeCount} creatives
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          {analytics ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid gap-4 sm:grid-cols-4">
                <Card>
                  <CardContent className="py-4">
                    <p className="text-sm font-medium text-gray-500">Total Impressions</p>
                    <p className="mt-1 text-2xl font-bold">
                      {analytics.totalImpressions.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <p className="text-sm font-medium text-gray-500">Total Clicks</p>
                    <p className="mt-1 text-2xl font-bold">
                      {analytics.totalClicks.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <p className="text-sm font-medium text-gray-500">Click-Through Rate</p>
                    <p className="mt-1 text-2xl font-bold">
                      {analytics.clickThroughRate.toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <p className="text-sm font-medium text-gray-500">Active Campaigns</p>
                    <p className="mt-1 text-2xl font-bold">
                      {analytics.activeCampaigns} / {analytics.totalCampaigns}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Per-Campaign Breakdown */}
              <Card>
                <CardContent className="py-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Campaign Performance</h3>
                  {analytics.campaigns.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No campaign data available</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="text-left text-sm font-medium text-gray-500">
                          <tr>
                            <th className="pb-3">Campaign</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3 text-right">Impressions</th>
                            <th className="pb-3 text-right">Clicks</th>
                            <th className="pb-3 text-right">CTR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {analytics.campaigns.map((camp) => (
                            <tr
                              key={camp.campaignId}
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => navigateToCampaign(camp.campaignId)}
                            >
                              <td className="py-3 font-medium text-gray-900">{camp.name}</td>
                              <td className="py-3">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getCampaignStatusColor(
                                    camp.status
                                  )}`}
                                >
                                  {getCampaignStatusLabel(camp.status)}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                {camp.impressions.toLocaleString()}
                              </td>
                              <td className="py-3 text-right">{camp.clicks.toLocaleString()}</td>
                              <td className="py-3 text-right">
                                {camp.clickThroughRate.toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No analytics data</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Analytics will appear once campaigns start running.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <AdvertiserFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        advertiser={advertiser}
        onSuccess={handleEditSuccess}
      />

      {/* Campaign Form Dialog */}
      <CampaignFormDialog
        open={isCampaignFormOpen}
        onClose={() => setIsCampaignFormOpen(false)}
        onSuccess={handleCampaignFormSuccess}
        preselectedAdvertiserId={advertiserId}
      />
    </div>
  );
}

