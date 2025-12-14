/**
 * useAnnouncementsFeed Hook
 * 
 * React Query hook for fetching announcements feed.
 * Supports category filtering and pagination.
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  getAnnouncementsFeed,
  ListAnnouncementsFeedFilters,
  AnnouncementSummaryDto,
  PagedResult,
  AnnouncementCategory,
} from '@/services/api/announcements';
import { queryKeys } from '@/services/api/queryClient';

/**
 * Hook to fetch announcements feed with pagination
 * 
 * @param filters - Optional filters for listing announcements
 * @param options - Additional React Query options
 * @returns React Query result with announcements data
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useAnnouncementsFeed({
 *   category: AnnouncementCategory.General,
 *   page: 1,
 *   pageSize: 20,
 * });
 * ```
 */
export function useAnnouncementsFeed(
  filters?: ListAnnouncementsFeedFilters,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery<PagedResult<AnnouncementSummaryDto>, Error>({
    // Use the queryKeys factory for consistent cache key management
    queryKey: queryKeys.announcements.feed(filters || {}),
    queryFn: () => getAnnouncementsFeed(filters),
    // Enable by default, allow override
    enabled: options?.enabled !== false,
    // Announcements can be updated frequently
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch announcements feed with infinite scroll support
 * 
 * @param filters - Optional filters (category, pageSize)
 * @param options - Additional React Query options
 * @returns Infinite query result for endless scrolling
 * 
 * @example
 * ```tsx
 * const { 
 *   data, 
 *   isLoading, 
 *   fetchNextPage, 
 *   hasNextPage, 
 *   isFetchingNextPage 
 * } = useAnnouncementsFeedInfinite({
 *   category: AnnouncementCategory.Event,
 *   pageSize: 10,
 * });
 * ```
 */
export function useAnnouncementsFeedInfinite(
  filters?: Omit<ListAnnouncementsFeedFilters, 'page'>,
  options?: {
    enabled?: boolean;
  }
) {
  return useInfiniteQuery<PagedResult<AnnouncementSummaryDto>, Error>({
    queryKey: [...queryKeys.announcements.all, 'feedInfinite', filters || {}],
    queryFn: ({ pageParam = 1 }) => 
      getAnnouncementsFeed({ ...filters, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // If there are more pages, return the next page number
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      // No more pages
      return undefined;
    },
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export default useAnnouncementsFeed;

