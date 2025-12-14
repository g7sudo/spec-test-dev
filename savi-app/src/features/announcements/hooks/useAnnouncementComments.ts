/**
 * useAnnouncementComments Hook
 * 
 * React Query hook for fetching announcement comments.
 * Supports pagination for large comment threads.
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  getAnnouncementComments,
  ListCommentsFilters,
  AnnouncementCommentDto,
  PagedResult,
} from '@/services/api/announcements';
import { queryKeys } from '@/services/api/queryClient';

// Query key for comments (extend the announcements key)
const commentsKey = (announcementId: string, filters?: ListCommentsFilters) =>
  [...queryKeys.announcements.detail(announcementId), 'comments', filters || {}] as const;

/**
 * Hook to fetch announcement comments with pagination
 * 
 * @param announcementId - The ID of the announcement
 * @param filters - Optional pagination filters
 * @param options - Additional React Query options
 * @returns React Query result with comments data
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useAnnouncementComments('announcement-id');
 * ```
 */
export function useAnnouncementComments(
  announcementId: string | undefined,
  filters?: ListCommentsFilters,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery<PagedResult<AnnouncementCommentDto>, Error>({
    queryKey: commentsKey(announcementId || '', filters),
    queryFn: () => getAnnouncementComments(announcementId!, filters),
    // Enable only if we have an announcementId
    enabled: !!announcementId && options?.enabled !== false,
    // Comments can change frequently
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to fetch comments with infinite scroll support
 * 
 * @param announcementId - The ID of the announcement
 * @param pageSize - Number of comments per page
 * @param options - Additional React Query options
 * @returns Infinite query result for endless scrolling
 * 
 * @example
 * ```tsx
 * const { 
 *   data, 
 *   fetchNextPage, 
 *   hasNextPage 
 * } = useAnnouncementCommentsInfinite('announcement-id');
 * ```
 */
export function useAnnouncementCommentsInfinite(
  announcementId: string | undefined,
  pageSize: number = 20,
  options?: {
    enabled?: boolean;
  }
) {
  return useInfiniteQuery<PagedResult<AnnouncementCommentDto>, Error>({
    queryKey: [...queryKeys.announcements.detail(announcementId || ''), 'commentsInfinite'],
    queryFn: ({ pageParam = 1 }) =>
      getAnnouncementComments(announcementId!, { page: pageParam as number, pageSize }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!announcementId && options?.enabled !== false,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Export the comments query key for invalidation
 */
export { commentsKey };

export default useAnnouncementComments;

