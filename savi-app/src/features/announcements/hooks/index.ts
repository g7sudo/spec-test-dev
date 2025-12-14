/**
 * Announcements Hooks
 * 
 * React Query hooks for announcements feature.
 * Exports all hooks for fetching, liking, and commenting on announcements.
 */

// Feed hooks
export { useAnnouncementsFeed, useAnnouncementsFeedInfinite } from './useAnnouncementsFeed';

// Detail hooks
export { useAnnouncementDetail } from './useAnnouncementDetail';

// Like hooks
export { 
  useLikeAnnouncement, 
  useUnlikeAnnouncement, 
  useToggleLike 
} from './useLikeAnnouncement';

// Comment hooks
export { 
  useAnnouncementComments, 
  useAnnouncementCommentsInfinite,
  commentsKey 
} from './useAnnouncementComments';
export { useAddAnnouncementComment } from './useAddAnnouncementComment';
export { useDeleteAnnouncementComment } from './useDeleteAnnouncementComment';

