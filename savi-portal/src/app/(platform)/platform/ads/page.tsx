'use client';

/**
 * Ads Dashboard Page
 * Platform-wide analytics overview for the ads module
 * Permission: PLATFORM_AD_ANALYTICS_VIEW
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Users,
  Megaphone,
  MousePointer,
  Eye,
  Loader2,
  AlertCircle,
  ArrowRight,
  Building,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth-store';
import { getPlatformAnalyticsOverview } from '@/lib/api/ads';
import {
  PlatformAnalyticsOverview,
  TopCampaign,
  TopTenant,
  DailyAnalytics,
} from '@/types/ads';

// ============================================
// Constants
// ============================================

const PAGE_SIZE = 5;

// ============================================
// Metric Card Component
// ============================================

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
}

function MetricCard({ title, value, subtitle, icon, trend }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
            {icon}
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp
              className={`h-4 w-4 mr-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}
            />
            <span className={trend >= 0 ? 'text-green-600' : 'text-red-600'}>
              {trend >= 0 ? '+' : ''}
              {trend.toFixed(1)}%
            </span>
            <span className="ml-1 text-gray-400">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Top Campaigns Table
// ============================================

interface TopCampaignsTableProps {
  title: string;
  campaigns: TopCampaign[];
  metricKey: 'impressions' | 'clicks';
  onViewCampaign: (id: string) => void;
}

function TopCampaignsTable({ title, campaigns, metricKey, onViewCampaign }: TopCampaignsTableProps) {
  return (
    <Card>
      <CardContent className="py-4">
        <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
        {campaigns.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No campaigns yet</p>
        ) : (
          <div className="space-y-2">
            {campaigns.map((campaign, idx) => (
              <div
                key={campaign.campaignId}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => onViewCampaign(campaign.campaignId)}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {campaign.campaignName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{campaign.advertiserName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {metricKey === 'impressions'
                      ? campaign.impressions.toLocaleString()
                      : campaign.clicks.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {campaign.clickThroughRate.toFixed(2)}% CTR
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Top Tenants Table
// ============================================

interface TopTenantsTableProps {
  tenants: TopTenant[];
}

function TopTenantsTable({ tenants }: TopTenantsTableProps) {
  return (
    <Card>
      <CardContent className="py-4">
        <h3 className="font-semibold text-gray-900 mb-3">Top Communities by Impressions</h3>
        {tenants.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No data yet</p>
        ) : (
          <div className="space-y-2">
            {tenants.map((tenant, idx) => (
              <div
                key={tenant.tenantId}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                  {idx + 1}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                  <Building className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {tenant.tenantName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {tenant.activeCampaigns} active campaigns
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {tenant.impressions.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">{tenant.clicks.toLocaleString()} clicks</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function AdsPage() {
  const router = useRouter();
  const { profile } = useAuthStore();

  // Guard to prevent double-fetch in React Strict Mode
  const fetchedRef = useRef(false);

  // State
  const [analytics, setAnalytics] = useState<PlatformAnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Permissions
  const permissions = profile?.permissions || {};
  const canViewAnalytics = permissions['PLATFORM_AD_ANALYTICS_VIEW'] === true;

  // Fetch analytics
  const fetchAnalytics = useCallback(async (force = false) => {
    if (fetchedRef.current && !force) return;
    fetchedRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      // Default to last 30 days
      const toDate = new Date().toISOString();
      const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const result = await getPlatformAnalyticsOverview(fromDate, toDate, PAGE_SIZE);
      setAnalytics(result);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Failed to load analytics');
      fetchedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchedRef.current = false;
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Navigate to campaign detail
  const handleViewCampaign = (campaignId: string) => {
    router.push(`/platform/ads/campaigns/${campaignId}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ads & Monetization</h1>
          <p className="text-sm text-gray-500">
            Platform-wide analytics for advertising campaigns
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push('/platform/ads/advertisers')}>
            <Users className="h-4 w-4" />
            Advertisers
          </Button>
          <Button onClick={() => router.push('/platform/ads/campaigns')}>
            <Megaphone className="h-4 w-4" />
            Campaigns
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <p className="mt-3 text-gray-500">Loading analytics...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-8 w-8 text-error" />
              <p className="mt-3 font-medium text-gray-900">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchAnalytics(true)}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : analytics ? (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard
              title="Total Advertisers"
              value={analytics.totalAdvertisers}
              icon={<Users className="h-5 w-5" />}
            />
            <MetricCard
              title="Active Campaigns"
              value={analytics.activeCampaigns}
              subtitle={`of ${analytics.totalCampaigns} total`}
              icon={<Megaphone className="h-5 w-5" />}
            />
            <MetricCard
              title="Total Impressions"
              value={analytics.totalImpressions.toLocaleString()}
              icon={<Eye className="h-5 w-5" />}
            />
            <MetricCard
              title="Total Clicks"
              value={analytics.totalClicks.toLocaleString()}
              subtitle={`${analytics.clickThroughRate.toFixed(2)}% CTR`}
              icon={<MousePointer className="h-5 w-5" />}
            />
          </div>

          {/* Top Performers Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            <TopCampaignsTable
              title="Top Campaigns by Impressions"
              campaigns={analytics.topCampaignsByImpressions}
              metricKey="impressions"
              onViewCampaign={handleViewCampaign}
            />
            <TopCampaignsTable
              title="Top Campaigns by Clicks"
              campaigns={analytics.topCampaignsByClicks}
              metricKey="clicks"
              onViewCampaign={handleViewCampaign}
            />
            <TopTenantsTable tenants={analytics.topTenantsByImpressions} />
          </div>

          {/* Quick Actions */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Quick Actions</h3>
                  <p className="text-sm text-gray-500">
                    Manage advertisers, campaigns, and creatives
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push('/platform/ads/advertisers')}
                  >
                    Manage Advertisers
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={() => router.push('/platform/ads/campaigns')}>
                    Manage Campaigns
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Megaphone className="h-12 w-12 text-gray-300 mx-auto" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No Analytics Data</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start by creating advertisers and campaigns to see analytics.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="secondary" onClick={() => router.push('/platform/ads/advertisers')}>
                Add Advertiser
              </Button>
              <Button onClick={() => router.push('/platform/ads/campaigns')}>
                Create Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

