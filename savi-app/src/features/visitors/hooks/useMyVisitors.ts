/**
 * useMyVisitors Hook
 * 
 * React Query hook for fetching user's visitor passes.
 * Uses React Query for caching, refetching, and loading states.
 */

import { useQuery } from '@tanstack/react-query';
import {
  getMyVisitors,
  ListVisitorsFilters,
  VisitorPassSummaryDto,
  PagedResult,
} from '@/services/api/visitors';
import { queryKeys } from '@/services/api/queryClient';

/**
 * Hook to fetch user's visitor passes
 * 
 * @param filters - Optional filters for listing visitor passes
 * @param options - Additional React Query options
 * @returns React Query result with visitor passes data
 */
export function useMyVisitors(
  filters?: ListVisitorsFilters,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery<PagedResult<VisitorPassSummaryDto>, Error>({
    queryKey: queryKeys.visitors.myVisitors(filters || {}),
    queryFn: () => getMyVisitors(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 2, // 2 minutes - visitor passes can change frequently
  });
}

