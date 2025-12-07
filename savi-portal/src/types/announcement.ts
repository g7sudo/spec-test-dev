/**
 * Announcement Module Types
 * Types for Announcements, Comments, Audiences, and engagement
 * Maps to backend DTOs from Savi.Application.Tenant.Announcements
 */

// ============================================
// Enums (values match C# enum strings)
// ============================================

/**
 * Category classification for announcements
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
 * Priority level for announcements
 */
export enum AnnouncementPriority {
  Normal = 'Normal',
  Important = 'Important',
  Critical = 'Critical',
}

/**
 * Lifecycle status of an announcement
 */
export enum AnnouncementStatus {
  Draft = 'Draft',
  Scheduled = 'Scheduled',
  Published = 'Published',
  Archived = 'Archived',
}

/**
 * Target type for announcement audience
 */
export enum AudienceTargetType {
  Community = 'Community',
  Block = 'Block',
  Unit = 'Unit',
  RoleGroup = 'RoleGroup',
}

// ============================================
// Announcement DTOs
// ============================================

/**
 * Full announcement details (single view)
 */
export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory | string;
  priority: AnnouncementPriority | string;
  status: AnnouncementStatus | string;
  publishedAt: string | null;
  scheduledAt: string | null;
  expiresAt: string | null;

  // Display flags
  isPinned: boolean;
  isBanner: boolean;

  // Behaviour flags
  allowLikes: boolean;
  allowComments: boolean;
  allowAddToCalendar: boolean;

  // Event fields
  isEvent: boolean;
  eventStartAt: string | null;
  eventEndAt: string | null;
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

  // Audience information
  audiences: AnnouncementAudience[];

  // Images (from Document entity)
  images: AnnouncementImage[];

  // Author information
  author: AnnouncementAuthor | null;

  // Audit
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Summary DTO for announcement list views
 */
export interface AnnouncementSummary {
  id: string;
  title: string;
  category: AnnouncementCategory | string;
  priority: AnnouncementPriority | string;
  status: AnnouncementStatus | string;
  publishedAt: string | null;
  isPinned: boolean;
  isBanner: boolean;
  isEvent: boolean;
  eventStartAt: string | null;

  // Engagement counts
  likeCount: number;
  commentCount: number;

  // Current user status (for resident view)
  hasRead: boolean;

  // Primary image (first image as thumbnail)
  primaryImageUrl: string | null;

  // Time display
  timeAgo: string;
}

/**
 * DTO for announcement audience targeting
 */
export interface AnnouncementAudience {
  id: string;
  targetType: AudienceTargetType | string;
  blockId: string | null;
  blockName: string | null;
  unitId: string | null;
  unitNumber: string | null;
  roleGroupId: string | null;
  roleGroupName: string | null;
}

/**
 * DTO for announcement images
 */
export interface AnnouncementImage {
  id: string;
  url: string;
  fileName: string | null;
  sortOrder: number;
}

/**
 * DTO for announcement author information
 */
export interface AnnouncementAuthor {
  id: string;
  displayName: string;
  profileImageUrl: string | null;
}

// ============================================
// Comment DTOs
// ============================================

/**
 * DTO for comment author information
 */
export interface CommentAuthor {
  id: string;
  displayName: string;
  profileImageUrl: string | null;
  isCurrentUser: boolean;
}

/**
 * DTO for announcement comment
 */
export interface AnnouncementComment {
  id: string;
  announcementId: string;
  content: string;
  isHidden: boolean;
  parentCommentId: string | null;
  author: CommentAuthor;
  createdAt: string;
  updatedAt: string | null;
  replies: AnnouncementComment[];
}

// ============================================
// Request DTOs
// ============================================

/**
 * Input for creating announcement audience
 */
export interface CreateAnnouncementAudienceInput {
  targetType: AudienceTargetType;
  blockId?: string | null;
  unitId?: string | null;
  roleGroupId?: string | null;
}

/**
 * Create announcement request
 */
export interface CreateAnnouncementRequest {
  title: string;
  body: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  isPinned: boolean;
  isBanner: boolean;
  allowLikes: boolean;
  allowComments: boolean;
  allowAddToCalendar: boolean;
  isEvent: boolean;
  eventStartAt?: string | null;
  eventEndAt?: string | null;
  isAllDay: boolean;
  eventLocationText?: string | null;
  eventJoinUrl?: string | null;
  audiences: CreateAnnouncementAudienceInput[];
  publishImmediately?: boolean;
  scheduledAt?: string | null;
  expiresAt?: string | null;
  tempDocuments?: string[] | null;
}

/**
 * Update announcement request
 */
export interface UpdateAnnouncementRequest {
  title: string;
  body: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  isPinned: boolean;
  isBanner: boolean;
  allowLikes: boolean;
  allowComments: boolean;
  allowAddToCalendar: boolean;
  isEvent: boolean;
  eventStartAt?: string | null;
  eventEndAt?: string | null;
  isAllDay: boolean;
  eventLocationText?: string | null;
  eventJoinUrl?: string | null;
  audiences: CreateAnnouncementAudienceInput[];
  tempDocuments?: string[] | null;
  documentsToRemove?: string[] | null;
}

/**
 * Publish/schedule announcement request
 */
export interface PublishAnnouncementRequest {
  publishImmediately: boolean;
  scheduledAt?: string | null;
  expiresAt?: string | null;
}

/**
 * Pin announcement request
 */
export interface PinAnnouncementRequest {
  isPinned: boolean;
}

/**
 * Add announcement comment request
 */
export interface AddAnnouncementCommentRequest {
  content: string;
  parentCommentId?: string | null;
}

// ============================================
// Response DTOs
// ============================================

/**
 * Like operation response
 */
export interface LikeResponse {
  likeCount: number;
  hasLiked: boolean;
}

// ============================================
// Query Params
// ============================================

/**
 * Parameters for listing announcements (admin)
 */
export interface ListAnnouncementsParams {
  status?: AnnouncementStatus;
  category?: AnnouncementCategory;
  priority?: AnnouncementPriority;
  isPinned?: boolean;
  isEvent?: boolean;
  searchTerm?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Parameters for listing announcement feed (resident)
 */
export interface ListAnnouncementsFeedParams {
  category?: AnnouncementCategory;
  priority?: AnnouncementPriority;
  isEvent?: boolean;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Parameters for listing comments
 */
export interface ListCommentsParams {
  page?: number;
  pageSize?: number;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Gets display label for announcement category
 */
export function getCategoryLabel(category: AnnouncementCategory | string): string {
  switch (category) {
    case AnnouncementCategory.General:
    case 'General':
      return 'General';
    case AnnouncementCategory.Maintenance:
    case 'Maintenance':
      return 'Maintenance';
    case AnnouncementCategory.Emergency:
    case 'Emergency':
      return 'Emergency';
    case AnnouncementCategory.Event:
    case 'Event':
      return 'Event';
    case AnnouncementCategory.Safety:
    case 'Safety':
      return 'Safety';
    case AnnouncementCategory.Policy:
    case 'Policy':
      return 'Policy';
    default:
      return category || 'Unknown';
  }
}

/**
 * Gets category color classes (using a warm, modern palette)
 */
export function getCategoryColor(category: AnnouncementCategory | string): string {
  switch (category) {
    case AnnouncementCategory.General:
    case 'General':
      return 'bg-slate-100 text-slate-700';
    case AnnouncementCategory.Maintenance:
    case 'Maintenance':
      return 'bg-amber-100 text-amber-700';
    case AnnouncementCategory.Emergency:
    case 'Emergency':
      return 'bg-red-100 text-red-700';
    case AnnouncementCategory.Event:
    case 'Event':
      return 'bg-violet-100 text-violet-700';
    case AnnouncementCategory.Safety:
    case 'Safety':
      return 'bg-orange-100 text-orange-700';
    case AnnouncementCategory.Policy:
    case 'Policy':
      return 'bg-teal-100 text-teal-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Gets display label for announcement status
 */
export function getStatusLabel(status: AnnouncementStatus | string): string {
  switch (status) {
    case AnnouncementStatus.Draft:
    case 'Draft':
      return 'Draft';
    case AnnouncementStatus.Scheduled:
    case 'Scheduled':
      return 'Scheduled';
    case AnnouncementStatus.Published:
    case 'Published':
      return 'Published';
    case AnnouncementStatus.Archived:
    case 'Archived':
      return 'Archived';
    default:
      return status || 'Unknown';
  }
}

/**
 * Gets status color classes
 */
export function getStatusColor(status: AnnouncementStatus | string): string {
  switch (status) {
    case AnnouncementStatus.Draft:
    case 'Draft':
      return 'bg-gray-100 text-gray-600';
    case AnnouncementStatus.Scheduled:
    case 'Scheduled':
      return 'bg-blue-100 text-blue-700';
    case AnnouncementStatus.Published:
    case 'Published':
      return 'bg-green-100 text-green-700';
    case AnnouncementStatus.Archived:
    case 'Archived':
      return 'bg-slate-100 text-slate-500';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Gets display label for announcement priority
 */
export function getPriorityLabel(priority: AnnouncementPriority | string): string {
  switch (priority) {
    case AnnouncementPriority.Normal:
    case 'Normal':
      return 'Normal';
    case AnnouncementPriority.Important:
    case 'Important':
      return 'Important';
    case AnnouncementPriority.Critical:
    case 'Critical':
      return 'Critical';
    default:
      return priority || 'Unknown';
  }
}

/**
 * Gets priority color classes
 */
export function getPriorityColor(priority: AnnouncementPriority | string): string {
  switch (priority) {
    case AnnouncementPriority.Normal:
    case 'Normal':
      return 'bg-gray-100 text-gray-600';
    case AnnouncementPriority.Important:
    case 'Important':
      return 'bg-amber-100 text-amber-700';
    case AnnouncementPriority.Critical:
    case 'Critical':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Gets display label for audience target type
 */
export function getAudienceTargetLabel(targetType: AudienceTargetType | string): string {
  switch (targetType) {
    case AudienceTargetType.Community:
    case 'Community':
      return 'All Community';
    case AudienceTargetType.Block:
    case 'Block':
      return 'Block';
    case AudienceTargetType.Unit:
    case 'Unit':
      return 'Unit';
    case AudienceTargetType.RoleGroup:
    case 'RoleGroup':
      return 'Role Group';
    default:
      return targetType || 'Unknown';
  }
}

/**
 * Formats audience display string
 */
export function formatAudienceDisplay(audience: AnnouncementAudience): string {
  switch (audience.targetType) {
    case AudienceTargetType.Community:
    case 'Community':
      return 'All Community';
    case AudienceTargetType.Block:
    case 'Block':
      return audience.blockName || 'Block';
    case AudienceTargetType.Unit:
    case 'Unit':
      return `Unit ${audience.unitNumber || ''}`;
    case AudienceTargetType.RoleGroup:
    case 'RoleGroup':
      return audience.roleGroupName || 'Role Group';
    default:
      return 'Unknown';
  }
}

/**
 * Formats a date-time string for display (announcement module)
 */
export function formatAnnouncementDateTime(dateTime: string | null): string {
  if (!dateTime) return '-';

  const date = new Date(dateTime);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats a date string for display (announcement module)
 */
export function formatAnnouncementDate(date: string | null): string {
  if (!date) return '-';

  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats event date range
 */
export function formatEventDateRange(
  startAt: string | null,
  endAt: string | null,
  isAllDay: boolean
): string {
  if (!startAt) return '-';

  const start = new Date(startAt);
  const end = endAt ? new Date(endAt) : null;

  if (isAllDay) {
    if (!end || start.toDateString() === end.toDateString()) {
      return formatAnnouncementDate(startAt);
    }
    return `${formatAnnouncementDate(startAt)} - ${formatAnnouncementDate(endAt)}`;
  }

  if (!end) {
    return formatAnnouncementDateTime(startAt);
  }

  // Same day event
  if (start.toDateString() === end.toDateString()) {
    return `${formatAnnouncementDate(startAt)}, ${start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })} - ${end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`;
  }

  return `${formatAnnouncementDateTime(startAt)} - ${formatAnnouncementDateTime(endAt)}`;
}

// ============================================
// Dropdown Options
// ============================================

/**
 * Category options for forms and filters
 */
export const ANNOUNCEMENT_CATEGORY_OPTIONS = [
  { value: AnnouncementCategory.General, label: 'General' },
  { value: AnnouncementCategory.Maintenance, label: 'Maintenance' },
  { value: AnnouncementCategory.Emergency, label: 'Emergency' },
  { value: AnnouncementCategory.Event, label: 'Event' },
  { value: AnnouncementCategory.Safety, label: 'Safety' },
  { value: AnnouncementCategory.Policy, label: 'Policy' },
];

/**
 * Priority options for forms and filters
 */
export const ANNOUNCEMENT_PRIORITY_OPTIONS = [
  { value: AnnouncementPriority.Normal, label: 'Normal' },
  { value: AnnouncementPriority.Important, label: 'Important' },
  { value: AnnouncementPriority.Critical, label: 'Critical' },
];

/**
 * Status options for filters
 */
export const ANNOUNCEMENT_STATUS_OPTIONS = [
  { value: AnnouncementStatus.Draft, label: 'Draft' },
  { value: AnnouncementStatus.Scheduled, label: 'Scheduled' },
  { value: AnnouncementStatus.Published, label: 'Published' },
  { value: AnnouncementStatus.Archived, label: 'Archived' },
];

/**
 * Audience target type options for forms
 */
export const AUDIENCE_TARGET_TYPE_OPTIONS = [
  { value: AudienceTargetType.Community, label: 'All Community' },
  { value: AudienceTargetType.Block, label: 'Specific Block(s)' },
  { value: AudienceTargetType.Unit, label: 'Specific Unit(s)' },
  { value: AudienceTargetType.RoleGroup, label: 'Role Group' },
];

