/**
 * Announcements API Service
 * 
 * Handles announcement-related API calls including listing feed,
 * viewing details, liking, commenting, and engagement features.
 * 
 * Backend Endpoints (Resident API):
 * - GET /v1/tenant/announcements/feed - List published announcements
 * - GET /v1/tenant/announcements/{id}/view - View announcement (marks as read)
 * - POST /v1/tenant/announcements/{id}/like - Like announcement
 * - DELETE /v1/tenant/announcements/{id}/like - Unlike announcement
 * - GET /v1/tenant/announcements/{id}/comments - List comments
 * - POST /v1/tenant/announcements/{id}/comments - Add comment
 * - DELETE /v1/tenant/announcements/{id}/comments/{commentId} - Delete own comment
 */

import apiClient from './apiClient';

// ============================================================================
// ENUMS - Match backend exactly
// ============================================================================

/**
 * Announcement Category enum matching backend
 * Used for filtering announcements by type
 */
export enum AnnouncementCategory {
  General = 'General',
  Maintenance = 'Maintenance',
  Emergency = 'Emergency',
  Event = 'Event',
  Safety = 'Safety',
  Policy = 'Policy',
}

/**
 * Announcement Priority enum matching backend
 * Determines visual prominence of announcements
 */
export enum AnnouncementPriority {
  Normal = 'Normal',
  Important = 'Important',
  Critical = 'Critical',
}

/**
 * Announcement Status enum matching backend
 * Lifecycle status of an announcement
 */
export enum AnnouncementStatus {
  Draft = 'Draft',
  Scheduled = 'Scheduled',
  Published = 'Published',
  Archived = 'Archived',
}

// ============================================================================
// SHARED TYPES
// ============================================================================

/**
 * Paginated result structure matching backend PagedResult<T>
 */
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

// ============================================================================
// ANNOUNCEMENT DTOs
// ============================================================================

/**
 * Author information for announcements
 */
export interface AnnouncementAuthorDto {
  id: string;
  displayName: string;
  profileImageUrl: string | null;
}

/**
 * Image/attachment for announcements
 */
export interface AnnouncementImageDto {
  id: string;
  url: string;
  fileName: string | null;
  sortOrder: number;
}

/**
 * Announcement Summary DTO for list/feed views
 * Response from GET /v1/tenant/announcements/feed
 */
export interface AnnouncementSummaryDto {
  id: string;
  title: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  publishedAt: string | null; // ISO 8601 datetime
  isPinned: boolean;
  isBanner: boolean;
  isEvent: boolean;
  eventStartAt: string | null; // ISO 8601 datetime
  // Behaviour flags (whether likes/comments are allowed)
  allowLikes: boolean;
  allowComments: boolean;
  // Engagement counts
  likeCount: number;
  commentCount: number;
  // Current user status (for resident view)
  hasRead: boolean;
  hasLiked: boolean;
  // All images with SAS URLs (sorted by sortOrder) - may be null/empty
  images: AnnouncementImageDto[] | null;
  // Time display (e.g., "10 minutes ago")
  timeAgo: string;
}

/**
 * Announcement audience targeting information
 */
export interface AnnouncementAudienceDto {
  id: string;
  targetType: 'Community' | 'Block' | 'Unit' | 'RoleGroup';
  blockId: string | null;
  blockName: string | null;
  unitId: string | null;
  unitNumber: string | null;
  roleGroupId: string | null;
  roleGroupName: string | null;
}

/**
 * Announcement Detail DTO for single announcement view
 * Response from GET /v1/tenant/announcements/{id}/view
 */
export interface AnnouncementDto {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  publishedAt: string | null; // ISO 8601 datetime
  scheduledAt: string | null; // ISO 8601 datetime
  expiresAt: string | null; // ISO 8601 datetime
  // Display flags
  isPinned: boolean;
  isBanner: boolean;
  // Behaviour flags
  allowLikes: boolean;
  allowComments: boolean;
  allowAddToCalendar: boolean;
  // Event fields
  isEvent: boolean;
  eventStartAt: string | null; // ISO 8601 datetime
  eventEndAt: string | null; // ISO 8601 datetime
  isAllDay: boolean;
  eventLocationText: string | null;
  eventJoinUrl: string | null;
  // Engagement stats
  likeCount: number;
  commentCount: number;
  readCount: number;
  // Current user engagement (for resident view)
  hasLiked: boolean;
  hasRead: boolean;
  // Audience targeting information
  audiences: AnnouncementAudienceDto[];
  // Images (from Document entity)
  images: AnnouncementImageDto[];
  // Author information
  author: AnnouncementAuthorDto | null;
  // Audit
  isActive: boolean;
  createdAt: string; // ISO 8601 datetime
  updatedAt: string | null; // ISO 8601 datetime
}

/**
 * Comment author information
 */
export interface CommentAuthorDto {
  id: string;
  displayName: string;
  profileImageUrl: string | null;
  isCurrentUser: boolean;
}

/**
 * Announcement Comment DTO
 * Response from GET /v1/tenant/announcements/{id}/comments
 */
export interface AnnouncementCommentDto {
  id: string;
  announcementId: string;
  content: string;
  isHidden: boolean;
  parentCommentId: string | null;
  // Author information
  author: CommentAuthorDto;
  // Audit
  createdAt: string; // ISO 8601 datetime
  updatedAt: string | null; // ISO 8601 datetime
  // Nested replies (for threaded view)
  replies: AnnouncementCommentDto[];
}

/**
 * Like response from POST/DELETE /v1/tenant/announcements/{id}/like
 */
export interface LikeResponse {
  likeCount: number;
  hasLiked: boolean;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Filters for listing announcements feed
 */
export interface ListAnnouncementsFeedFilters {
  category?: AnnouncementCategory;
  priority?: AnnouncementPriority;
  isEvent?: boolean;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Filters for listing comments
 */
export interface ListCommentsFilters {
  page?: number;
  pageSize?: number;
}

// ============================================================================
// REQUEST DTOs
// ============================================================================

/**
 * Add Comment Request
 */
export interface AddCommentRequest {
  content: string;
  parentCommentId?: string | null;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Gets published announcements feed for residents.
 * Permission: TENANT_ANNOUNCEMENTS_VIEW
 * 
 * Backend Endpoint: GET /api/v1/tenant/announcements/feed
 * 
 * @param filters - Optional filters for listing announcements
 * @returns Paginated list of announcements
 * @throws ApiError if request fails
 */
export async function getAnnouncementsFeed(
  filters?: ListAnnouncementsFeedFilters
): Promise<PagedResult<AnnouncementSummaryDto>> {
  console.log('[Announcements API] 📋 GET FEED:', {
    filters,
    timestamp: new Date().toISOString(),
  });

  try {
    const params: Record<string, unknown> = {};
    
    if (filters?.category) params.category = filters.category;
    if (filters?.priority) params.priority = filters.priority;
    if (filters?.isEvent !== undefined) params.isEvent = filters.isEvent;
    if (filters?.searchTerm) params.searchTerm = filters.searchTerm;
    if (filters?.page) params.page = filters.page;
    if (filters?.pageSize) params.pageSize = filters.pageSize;

    const response = await apiClient.get<PagedResult<AnnouncementSummaryDto>>(
      '/v1/tenant/announcements/feed',
      { params }
    );

    // Debug: Log response with image info
    console.log('[Announcements API] ✅ GET FEED RESPONSE:', {
      status: response.status,
      itemCount: response.data.items.length,
      totalCount: response.data.totalCount,
      page: response.data.page,
      // Log first item's images for debugging
      firstItemImages: response.data.items[0]?.images,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Announcements API] ❌ GET FEED ERROR:', {
      errorType: typeof error,
      errorMessage: error.message,
      status: error.status || error.response?.status,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Views an announcement (marks as read for the current user).
 * Permission: TENANT_ANNOUNCEMENTS_VIEW
 * 
 * Backend Endpoint: GET /api/v1/tenant/announcements/{id}/view
 * 
 * @param announcementId - The ID of the announcement
 * @returns Announcement details
 * @throws ApiError if request fails
 */
export async function viewAnnouncement(
  announcementId: string
): Promise<AnnouncementDto> {
  console.log('[Announcements API] 👁️ VIEW ANNOUNCEMENT:', {
    announcementId,
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await apiClient.get<AnnouncementDto>(
      `/v1/tenant/announcements/${announcementId}/view`
    );

    console.log('[Announcements API] ✅ VIEW ANNOUNCEMENT RESPONSE:', {
      status: response.status,
      title: response.data.title,
      hasLiked: response.data.hasLiked,
      likeCount: response.data.likeCount,
      commentCount: response.data.commentCount,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Announcements API] ❌ VIEW ANNOUNCEMENT ERROR:', {
      announcementId,
      errorMessage: error.message,
      status: error.status || error.response?.status,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Likes an announcement.
 * Permission: TENANT_ANNOUNCEMENTS_VIEW
 * 
 * Backend Endpoint: POST /api/v1/tenant/announcements/{id}/like
 * 
 * @param announcementId - The ID of the announcement to like
 * @returns Updated like count and status
 * @throws ApiError if request fails
 */
export async function likeAnnouncement(
  announcementId: string
): Promise<LikeResponse> {
  console.log('[Announcements API] ❤️ LIKE ANNOUNCEMENT:', {
    announcementId,
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await apiClient.post<LikeResponse>(
      `/v1/tenant/announcements/${announcementId}/like`
    );

    console.log('[Announcements API] ✅ LIKE RESPONSE:', {
      status: response.status,
      likeCount: response.data.likeCount,
      hasLiked: response.data.hasLiked,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Announcements API] ❌ LIKE ERROR:', {
      announcementId,
      errorMessage: error.message,
      status: error.status || error.response?.status,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Unlikes an announcement.
 * Permission: TENANT_ANNOUNCEMENTS_VIEW
 * 
 * Backend Endpoint: DELETE /api/v1/tenant/announcements/{id}/like
 * 
 * @param announcementId - The ID of the announcement to unlike
 * @returns Updated like count and status
 * @throws ApiError if request fails
 */
export async function unlikeAnnouncement(
  announcementId: string
): Promise<LikeResponse> {
  console.log('[Announcements API] 💔 UNLIKE ANNOUNCEMENT:', {
    announcementId,
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await apiClient.delete<LikeResponse>(
      `/v1/tenant/announcements/${announcementId}/like`
    );

    console.log('[Announcements API] ✅ UNLIKE RESPONSE:', {
      status: response.status,
      likeCount: response.data.likeCount,
      hasLiked: response.data.hasLiked,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Announcements API] ❌ UNLIKE ERROR:', {
      announcementId,
      errorMessage: error.message,
      status: error.status || error.response?.status,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Gets comments for an announcement.
 * Permission: TENANT_ANNOUNCEMENTS_VIEW
 * 
 * Backend Endpoint: GET /api/v1/tenant/announcements/{id}/comments
 * 
 * @param announcementId - The ID of the announcement
 * @param filters - Optional pagination filters
 * @returns Paginated list of comments
 * @throws ApiError if request fails
 */
export async function getAnnouncementComments(
  announcementId: string,
  filters?: ListCommentsFilters
): Promise<PagedResult<AnnouncementCommentDto>> {
  console.log('[Announcements API] 💬 GET COMMENTS:', {
    announcementId,
    filters,
    timestamp: new Date().toISOString(),
  });

  try {
    const params: Record<string, unknown> = {};
    
    if (filters?.page) params.page = filters.page;
    if (filters?.pageSize) params.pageSize = filters.pageSize;

    const response = await apiClient.get<PagedResult<AnnouncementCommentDto>>(
      `/v1/tenant/announcements/${announcementId}/comments`,
      { params }
    );

    console.log('[Announcements API] ✅ GET COMMENTS RESPONSE:', {
      status: response.status,
      commentCount: response.data.items.length,
      totalCount: response.data.totalCount,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Announcements API] ❌ GET COMMENTS ERROR:', {
      announcementId,
      errorMessage: error.message,
      status: error.status || error.response?.status,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Adds a comment to an announcement.
 * Permission: TENANT_ANNOUNCEMENTS_VIEW
 * 
 * Backend Endpoint: POST /api/v1/tenant/announcements/{id}/comments
 * 
 * @param announcementId - The ID of the announcement
 * @param content - Comment content
 * @param parentCommentId - Optional parent comment ID for replies
 * @returns Created comment ID
 * @throws ApiError if request fails
 */
export async function addAnnouncementComment(
  announcementId: string,
  content: string,
  parentCommentId?: string | null
): Promise<{ id: string }> {
  console.log('[Announcements API] 💬 ADD COMMENT:', {
    announcementId,
    contentLength: content.length,
    hasParent: !!parentCommentId,
    timestamp: new Date().toISOString(),
  });

  try {
    const request: AddCommentRequest = {
      content,
      parentCommentId: parentCommentId || null,
    };

    const response = await apiClient.post<{ id: string }>(
      `/v1/tenant/announcements/${announcementId}/comments`,
      request
    );

    console.log('[Announcements API] ✅ ADD COMMENT RESPONSE:', {
      status: response.status,
      commentId: response.data.id,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Announcements API] ❌ ADD COMMENT ERROR:', {
      announcementId,
      errorMessage: error.message,
      status: error.status || error.response?.status,
      responseData: error.response?.data,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Deletes a comment (user can only delete their own).
 * Permission: TENANT_ANNOUNCEMENTS_VIEW
 * 
 * Backend Endpoint: DELETE /api/v1/tenant/announcements/{announcementId}/comments/{commentId}
 * 
 * @param announcementId - The ID of the announcement
 * @param commentId - The ID of the comment to delete
 * @throws ApiError if request fails
 */
export async function deleteAnnouncementComment(
  announcementId: string,
  commentId: string
): Promise<void> {
  console.log('[Announcements API] 🗑️ DELETE COMMENT:', {
    announcementId,
    commentId,
    timestamp: new Date().toISOString(),
  });

  try {
    await apiClient.delete(
      `/v1/tenant/announcements/${announcementId}/comments/${commentId}`
    );

    console.log('[Announcements API] ✅ DELETE COMMENT SUCCESS:', {
      announcementId,
      commentId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Announcements API] ❌ DELETE COMMENT ERROR:', {
      announcementId,
      commentId,
      errorMessage: error.message,
      status: error.status || error.response?.status,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

// ============================================================================
// HELPER CONSTANTS
// ============================================================================

/**
 * Category configuration with labels and icons
 * Maps backend codes to UI-friendly labels and Ionicons names
 */
export const ANNOUNCEMENT_CATEGORIES = [
  { value: AnnouncementCategory.General, label: 'General', icon: 'megaphone-outline' as const },
  { value: AnnouncementCategory.Maintenance, label: 'Maintenance', icon: 'construct-outline' as const },
  { value: AnnouncementCategory.Emergency, label: 'Emergency', icon: 'warning-outline' as const },
  { value: AnnouncementCategory.Event, label: 'Events', icon: 'calendar-outline' as const },
  { value: AnnouncementCategory.Safety, label: 'Safety', icon: 'shield-checkmark-outline' as const },
  { value: AnnouncementCategory.Policy, label: 'Policy', icon: 'document-text-outline' as const },
] as const;

/**
 * Priority configuration with labels and colors
 */
export const ANNOUNCEMENT_PRIORITIES = [
  { value: AnnouncementPriority.Normal, label: 'Normal', color: '#6C757D' },
  { value: AnnouncementPriority.Important, label: 'Important', color: '#FFC107' },
  { value: AnnouncementPriority.Critical, label: 'Critical', color: '#DC3545' },
] as const;

/**
 * Get category config by value
 */
export function getCategoryConfig(category: AnnouncementCategory) {
  return ANNOUNCEMENT_CATEGORIES.find(c => c.value === category) || ANNOUNCEMENT_CATEGORIES[0];
}

/**
 * Get priority config by value
 */
export function getPriorityConfig(priority: AnnouncementPriority) {
  return ANNOUNCEMENT_PRIORITIES.find(p => p.value === priority) || ANNOUNCEMENT_PRIORITIES[0];
}

