/**
 * useAnnouncementDetail Hook
 * 
 * React Query hook for fetching a single announcement detail.
 * This marks the announcement as read for the current user.
 */

import { useQuery } from '@tanstack/react-query';
import {
  viewAnnouncement,
  AnnouncementDto,
} from '@/services/api/announcements';
import { queryKeys } from '@/services/api/queryClient';

/**
 * Hook to fetch announcement detail (marks as read)
 * 
 * @param announcementId - The ID of the announcement
 * @param options - Additional React Query options
 * @returns React Query result with announcement details
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useAnnouncementDetail('announcement-id');
 * ```
 */
export function useAnnouncementDetail(
  announcementId: string | undefined,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery<AnnouncementDto, Error>({
    // Use the queryKeys factory for consistent cache key management
    queryKey: queryKeys.announcements.detail(announcementId || ''),
    queryFn: () => viewAnnouncement(announcementId!),
    // Enable only if we have an announcementId
    enabled: !!announcementId && options?.enabled !== false,
    // Keep the data fresh as engagement stats may change
    staleTime: 1000 * 30, // 30 seconds
  });
}

export default useAnnouncementDetail;

