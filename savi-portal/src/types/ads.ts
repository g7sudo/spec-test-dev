/**
 * Ads Module Types
 * Platform-level advertising/campaign management types
 * Maps to backend DTOs from Savi.Application.Platform.Ads
 */

// Re-export PagedResult from http.ts
export type { PagedResult } from './http';

// ============================================
// Enums (values match C# enum integers)
// ============================================

/**
 * Type of advertising campaign
 */
export enum CampaignType {
  Banner = 0,  // Standard banner placements on screens
  Story = 1,   // WhatsApp/Instagram-style story campaigns
}

/**
 * Status of an advertising campaign
 */
export enum CampaignStatus {
  Draft = 0,   // Campaign is being prepared, not yet active
  Active = 1,  // Campaign is currently running
  Paused = 2,  // Campaign is temporarily paused
  Ended = 3,   // Campaign has ended (manually or by end date)
}

/**
 * Type of creative asset in a campaign
 */
export enum CreativeType {
  Banner = 0,     // Single banner creative for placement on screens
  StorySlide = 1, // One slide in a multi-slide story campaign
}

/**
 * Where an ad creative can be displayed in the app
 */
export enum AdPlacement {
  HomeTop = 0,      // Top section of the home screen
  HomeMiddle = 1,   // Middle section of the home screen
  HomeBottom = 2,   // Bottom section of the home screen
  StoryFeed = 3,    // Story tray or story viewer
  VisitorsFlow = 4, // Visitor screen placement (future use)
}

/**
 * Type of call-to-action for an ad creative
 */
export enum CTAType {
  None = 0,     // No call-to-action
  Call = 1,     // Opens phone dialer
  WhatsApp = 2, // Opens WhatsApp chat
  Link = 3,     // Opens a generic URL or deep link
}

// ============================================
// Helper functions for enums
// ============================================

/**
 * Gets display label for campaign type
 */
export function getCampaignTypeLabel(type: CampaignType): string {
  switch (type) {
    case CampaignType.Banner:
      return 'Banner';
    case CampaignType.Story:
      return 'Story';
    default:
      return 'Unknown';
  }
}

/**
 * Gets display label for campaign status
 */
export function getCampaignStatusLabel(status: CampaignStatus): string {
  switch (status) {
    case CampaignStatus.Draft:
      return 'Draft';
    case CampaignStatus.Active:
      return 'Active';
    case CampaignStatus.Paused:
      return 'Paused';
    case CampaignStatus.Ended:
      return 'Ended';
    default:
      return 'Unknown';
  }
}

/**
 * Gets status badge color classes for campaign status
 */
export function getCampaignStatusColor(status: CampaignStatus): string {
  switch (status) {
    case CampaignStatus.Draft:
      return 'bg-gray-100 text-gray-700';
    case CampaignStatus.Active:
      return 'bg-green-100 text-green-700';
    case CampaignStatus.Paused:
      return 'bg-yellow-100 text-yellow-700';
    case CampaignStatus.Ended:
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Gets display label for creative type
 */
export function getCreativeTypeLabel(type: CreativeType): string {
  switch (type) {
    case CreativeType.Banner:
      return 'Banner';
    case CreativeType.StorySlide:
      return 'Story Slide';
    default:
      return 'Unknown';
  }
}

/**
 * Gets display label for ad placement
 */
export function getAdPlacementLabel(placement: AdPlacement): string {
  switch (placement) {
    case AdPlacement.HomeTop:
      return 'Home Top';
    case AdPlacement.HomeMiddle:
      return 'Home Middle';
    case AdPlacement.HomeBottom:
      return 'Home Bottom';
    case AdPlacement.StoryFeed:
      return 'Story Feed';
    case AdPlacement.VisitorsFlow:
      return 'Visitors Flow';
    default:
      return 'Unknown';
  }
}

/**
 * Gets display label for CTA type
 */
export function getCTATypeLabel(ctaType: CTAType): string {
  switch (ctaType) {
    case CTAType.None:
      return 'None';
    case CTAType.Call:
      return 'Call';
    case CTAType.WhatsApp:
      return 'WhatsApp';
    case CTAType.Link:
      return 'Link';
    default:
      return 'Unknown';
  }
}

// ============================================
// Advertiser DTOs
// ============================================

/**
 * Full advertiser data
 */
export interface Advertiser {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  campaignCount: number;
}

/**
 * Request DTO for creating an advertiser
 */
export interface CreateAdvertiserRequest {
  name: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
}

/**
 * Request DTO for updating an advertiser
 */
export interface UpdateAdvertiserRequest {
  name: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
}

/**
 * Query params for listing advertisers
 */
export interface ListAdvertisersParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

// ============================================
// Campaign DTOs
// ============================================

/**
 * Full campaign data
 */
export interface Campaign {
  id: string;
  advertiserId: string;
  advertiserName: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  startsAt: string;
  endsAt: string | null;
  maxImpressions: number | null;
  maxClicks: number | null;
  dailyImpressionCap: number | null;
  priority: number;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  creativeCount: number;
  targetTenantCount: number;
  targetTenantIds: string[];
}

/**
 * Campaign creative data
 */
export interface CampaignCreative {
  id: string;
  campaignId: string;
  type: CreativeType;
  placement: AdPlacement | null;
  sizeCode: string | null;
  sequence: number | null;
  mediaUrl: string;
  caption: string | null;
  ctaType: CTAType;
  ctaValue: string | null;
  isActive: boolean;
  createdAt: string;
}

/**
 * Request DTO for creating a campaign
 */
export interface CreateCampaignRequest {
  advertiserId: string;
  name: string;
  type: CampaignType;
  startsAt: string;
  endsAt?: string | null;
  maxImpressions?: number | null;
  maxClicks?: number | null;
  dailyImpressionCap?: number | null;
  priority: number;
  notes?: string | null;
  targetTenantIds: string[];
}

/**
 * Request DTO for updating a campaign
 */
export interface UpdateCampaignRequest {
  name: string;
  startsAt: string;
  endsAt?: string | null;
  maxImpressions?: number | null;
  maxClicks?: number | null;
  dailyImpressionCap?: number | null;
  priority: number;
  notes?: string | null;
  targetTenantIds: string[];
}

/**
 * Request DTO for updating campaign status
 */
export interface UpdateCampaignStatusRequest {
  status: CampaignStatus;
}

/**
 * Request DTO for creating a banner creative
 */
export interface CreateBannerCreativeRequest {
  mediaUrl: string;
  placement: AdPlacement;
  sizeCode?: string | null;
  caption?: string | null;
  ctaType: CTAType;
  ctaValue?: string | null;
}

/**
 * Request DTO for creating a story slide creative
 */
export interface CreateStorySlideRequest {
  mediaUrl: string;
  sequence: number;
  caption?: string | null;
  ctaType: CTAType;
  ctaValue?: string | null;
}

/**
 * Query params for listing campaigns
 */
export interface ListCampaignsParams {
  page?: number;
  pageSize?: number;
  advertiserId?: string;
  type?: CampaignType;
  status?: CampaignStatus;
  searchTerm?: string;
}

// ============================================
// Analytics DTOs
// ============================================

/**
 * Campaign analytics response with aggregated metrics
 */
export interface CampaignAnalytics {
  campaignId: string;
  campaignName: string;
  type: CampaignType;
  status: CampaignStatus;
  startsAt: string;
  endsAt: string | null;
  // Overall metrics
  totalImpressions: number;
  totalClicks: number;
  clickThroughRate: number; // CTR = Clicks / Impressions * 100
  uniqueUsers: number;
  // Breakdowns
  byTenant: TenantAnalytics[];
  byPlacement: PlacementAnalytics[];
  byCreative: CreativeAnalytics[];
  byDate: DailyAnalytics[];
}

/**
 * Analytics breakdown by tenant
 */
export interface TenantAnalytics {
  tenantId: string;
  tenantName: string;
  impressions: number;
  clicks: number;
  clickThroughRate: number;
  uniqueUsers: number;
}

/**
 * Analytics breakdown by placement
 */
export interface PlacementAnalytics {
  placement: string;
  impressions: number;
  clicks: number;
  clickThroughRate: number;
}

/**
 * Analytics breakdown by creative
 */
export interface CreativeAnalytics {
  creativeId: string;
  type: CreativeType;
  placement: string | null;
  sequence: number | null;
  impressions: number;
  clicks: number;
  clickThroughRate: number;
}

/**
 * Analytics breakdown by date
 */
export interface DailyAnalytics {
  date: string;
  impressions: number;
  clicks: number;
  clickThroughRate: number;
}

/**
 * Advertiser analytics with all campaigns summary
 */
export interface AdvertiserAnalytics {
  advertiserId: string;
  advertiserName: string;
  // Overall metrics across all campaigns
  totalCampaigns: number;
  activeCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  clickThroughRate: number;
  // Per-campaign breakdown
  campaigns: CampaignSummary[];
}

/**
 * Campaign summary for advertiser analytics
 */
export interface CampaignSummary {
  campaignId: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  startsAt: string;
  endsAt: string | null;
  impressions: number;
  clicks: number;
  clickThroughRate: number;
}

/**
 * Platform-wide analytics overview
 */
export interface PlatformAnalyticsOverview {
  fromDate: string;
  toDate: string;
  // Overall platform metrics
  totalAdvertisers: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  clickThroughRate: number;
  // Top performers
  topCampaignsByImpressions: TopCampaign[];
  topCampaignsByClicks: TopCampaign[];
  topTenantsByImpressions: TopTenant[];
  // Trends
  dailyTrend: DailyAnalytics[];
}

/**
 * Top campaign for platform overview
 */
export interface TopCampaign {
  campaignId: string;
  campaignName: string;
  advertiserName: string;
  impressions: number;
  clicks: number;
  clickThroughRate: number;
}

/**
 * Top tenant for platform overview
 */
export interface TopTenant {
  tenantId: string;
  tenantName: string;
  impressions: number;
  clicks: number;
  activeCampaigns: number;
}

