/**
 * useAmenities Hook
 * 
 * React Query hook for fetching list of amenities with optional filters.
 * Uses React Query for caching, refetching, and loading states.
 */

import { useQuery } from '@tanstack/react-query';
import {
  listAmenities,
  ListAmenitiesFilters,
  AmenitySummaryDto,
  PagedResult,
} from '@/services/api/amenities';
import { queryKeys } from '@/services/api/queryClient';

/**
 * Hook to fetch list of amenities
 * 
 * @param filters - Optional filters for listing amenities
 * @param options - Additional React Query options
 * @returns React Query result with amenities data
 */
export function useAmenities(
  filters?: ListAmenitiesFilters,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery<PagedResult<AmenitySummaryDto>, Error>({
    queryKey: queryKeys.amenities.list(filters || {}),
    queryFn: () => listAmenities(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes - amenities don't change frequently
  });
}

