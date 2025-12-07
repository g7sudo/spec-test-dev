/**
 * Ads API functions
 * Handles platform-level advertiser, campaign, and analytics operations
 */

import { httpClient } from '@/lib/http';
import { PagedResult } from '@/types/http';
import {
  Advertiser,
  CreateAdvertiserRequest,
  UpdateAdvertiserRequest,
  ListAdvertisersParams,
  Campaign,
  CampaignCreative,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  UpdateCampaignStatusRequest,
  CreateBannerCreativeRequest,
  CreateStorySlideRequest,
  ListCampaignsParams,
  CampaignAnalytics,
  AdvertiserAnalytics,
  PlatformAnalyticsOverview,
  CampaignType,
  CampaignStatus,
} from '@/types/ads';

// ============================================
// API Endpoints
// ============================================

const ADVERTISERS_BASE = '/api/v1/platform/ads/advertisers';
const CAMPAIGNS_BASE = '/api/v1/platform/ads/campaigns';
const ANALYTICS_BASE = '/api/v1/platform/ads/analytics';

// ============================================
// Advertiser CRUD
// ============================================

/**
 * Lists advertisers with pagination and search
 */
export async function listAdvertisers(
  params: ListAdvertisersParams = {}
): Promise<PagedResult<Advertiser>> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  if (params.searchTerm) searchParams.set('searchTerm', params.searchTerm);

  const query = searchParams.toString();
  const url = query ? `${ADVERTISERS_BASE}?${query}` : ADVERTISERS_BASE;

  return httpClient.get<PagedResult<Advertiser>>(url);
}

/**
 * Gets an advertiser by ID
 */
export async function getAdvertiserById(id: string): Promise<Advertiser> {
  return httpClient.get<Advertiser>(`${ADVERTISERS_BASE}/${id}`);
}

/**
 * Creates a new advertiser
 */
export async function createAdvertiser(
  data: CreateAdvertiserRequest
): Promise<string> {
  return httpClient.post<string>(ADVERTISERS_BASE, data);
}

/**
 * Updates an existing advertiser
 */
export async function updateAdvertiser(
  id: string,
  data: UpdateAdvertiserRequest
): Promise<string> {
  return httpClient.put<string>(`${ADVERTISERS_BASE}/${id}`, data);
}

/**
 * Deletes an advertiser
 */
export async function deleteAdvertiser(id: string): Promise<void> {
  return httpClient.delete<void>(`${ADVERTISERS_BASE}/${id}`);
}

// ============================================
// Campaign CRUD
// ============================================

/**
 * Lists campaigns with pagination and filters
 */
export async function listCampaigns(
  params: ListCampaignsParams = {}
): Promise<PagedResult<Campaign>> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  if (params.advertiserId) searchParams.set('advertiserId', params.advertiserId);
  if (params.type !== undefined) searchParams.set('type', params.type.toString());
  if (params.status !== undefined) searchParams.set('status', params.status.toString());
  if (params.searchTerm) searchParams.set('searchTerm', params.searchTerm);

  const query = searchParams.toString();
  const url = query ? `${CAMPAIGNS_BASE}?${query}` : CAMPAIGNS_BASE;

  return httpClient.get<PagedResult<Campaign>>(url);
}

/**
 * Gets a campaign by ID
 */
export async function getCampaignById(id: string): Promise<Campaign> {
  return httpClient.get<Campaign>(`${CAMPAIGNS_BASE}/${id}`);
}

/**
 * Creates a new campaign
 */
export async function createCampaign(
  data: CreateCampaignRequest
): Promise<string> {
  return httpClient.post<string>(CAMPAIGNS_BASE, data);
}

/**
 * Updates an existing campaign
 */
export async function updateCampaign(
  id: string,
  data: UpdateCampaignRequest
): Promise<string> {
  return httpClient.put<string>(`${CAMPAIGNS_BASE}/${id}`, data);
}

/**
 * Updates campaign status (activate, pause, end)
 */
export async function updateCampaignStatus(
  id: string,
  data: UpdateCampaignStatusRequest
): Promise<{ message: string }> {
  return httpClient.patch<{ message: string }>(`${CAMPAIGNS_BASE}/${id}/status`, data);
}

/**
 * Deletes a campaign
 */
export async function deleteCampaign(id: string): Promise<void> {
  return httpClient.delete<void>(`${CAMPAIGNS_BASE}/${id}`);
}

// ============================================
// Campaign Creatives
// ============================================

/**
 * Gets all creatives for a campaign
 */
export async function getCampaignCreatives(
  campaignId: string
): Promise<CampaignCreative[]> {
  return httpClient.get<CampaignCreative[]>(`${CAMPAIGNS_BASE}/${campaignId}/creatives`);
}

/**
 * Adds a banner creative to a campaign
 */
export async function addBannerCreative(
  campaignId: string,
  data: CreateBannerCreativeRequest
): Promise<string> {
  return httpClient.post<string>(`${CAMPAIGNS_BASE}/${campaignId}/creatives/banner`, data);
}

/**
 * Adds a story slide creative to a campaign
 */
export async function addStorySlide(
  campaignId: string,
  data: CreateStorySlideRequest
): Promise<string> {
  return httpClient.post<string>(`${CAMPAIGNS_BASE}/${campaignId}/creatives/story-slide`, data);
}

/**
 * Deletes a creative from a campaign
 */
export async function deleteCreative(creativeId: string): Promise<void> {
  return httpClient.delete<void>(`${CAMPAIGNS_BASE}/creatives/${creativeId}`);
}

// ============================================
// Analytics
// ============================================

/**
 * Gets detailed analytics for a campaign
 */
export async function getCampaignAnalytics(
  campaignId: string,
  fromDate?: string,
  toDate?: string
): Promise<CampaignAnalytics> {
  const searchParams = new URLSearchParams();
  if (fromDate) searchParams.set('fromDate', fromDate);
  if (toDate) searchParams.set('toDate', toDate);

  const query = searchParams.toString();
  const url = query
    ? `${CAMPAIGNS_BASE}/${campaignId}/analytics?${query}`
    : `${CAMPAIGNS_BASE}/${campaignId}/analytics`;

  return httpClient.get<CampaignAnalytics>(url);
}

/**
 * Gets platform-wide analytics overview
 */
export async function getPlatformAnalyticsOverview(
  fromDate?: string,
  toDate?: string,
  topCount: number = 5
): Promise<PlatformAnalyticsOverview> {
  const searchParams = new URLSearchParams();
  if (fromDate) searchParams.set('fromDate', fromDate);
  if (toDate) searchParams.set('toDate', toDate);
  searchParams.set('topCount', topCount.toString());

  const query = searchParams.toString();
  const url = `${ANALYTICS_BASE}/overview?${query}`;

  return httpClient.get<PlatformAnalyticsOverview>(url);
}

/**
 * Gets analytics for a specific advertiser
 */
export async function getAdvertiserAnalytics(
  advertiserId: string,
  fromDate?: string,
  toDate?: string
): Promise<AdvertiserAnalytics> {
  const searchParams = new URLSearchParams();
  if (fromDate) searchParams.set('fromDate', fromDate);
  if (toDate) searchParams.set('toDate', toDate);

  const query = searchParams.toString();
  const url = query
    ? `${ANALYTICS_BASE}/advertisers/${advertiserId}?${query}`
    : `${ANALYTICS_BASE}/advertisers/${advertiserId}`;

  return httpClient.get<AdvertiserAnalytics>(url);
}

