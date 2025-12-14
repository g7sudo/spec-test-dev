/**
 * Announcements Feature Types
 * 
 * Re-exports types from the API service for use in the feature.
 */

// Re-export all types from API service
export type {
  AnnouncementSummaryDto,
  AnnouncementDto,
  AnnouncementAuthorDto,
  AnnouncementImageDto,
  AnnouncementAudienceDto,
  AnnouncementCommentDto,
  CommentAuthorDto,
  LikeResponse,
  ListAnnouncementsFeedFilters,
  ListCommentsFilters,
  AddCommentRequest,
  PagedResult,
} from '@/services/api/announcements';

// Re-export enums
export {
  AnnouncementCategory,
  AnnouncementPriority,
  AnnouncementStatus,
} from '@/services/api/announcements';

// Re-export helper constants and functions
export {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_PRIORITIES,
  getCategoryConfig,
  getPriorityConfig,
} from '@/services/api/announcements';

