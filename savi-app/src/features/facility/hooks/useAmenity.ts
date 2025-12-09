/**
 * useAmenity Hook
 * 
 * React Query hook for fetching a single amenity by ID.
 * Uses React Query for caching, refetching, and loading states.
 */

import { useQuery } from '@tanstack/react-query';
import {
  getAmenityById,
  AmenityDto,
} from '@/services/api/amenities';
import { queryKeys } from '@/services/api/queryClient';

/**
 * Hook to fetch a single amenity by ID
 * 
 * @param id - Amenity ID (GUID)
 * @param options - Additional React Query options
 * @returns React Query result with amenity data
 */
export function useAmenity(
  id: string | undefined,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery<AmenityDto, Error>({
    queryKey: queryKeys.amenities.detail(id || ''),
    queryFn: () => getAmenityById(id!),
    enabled: (options?.enabled !== false) && !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

