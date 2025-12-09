/**
 * useAmenityAvailability Hook
 * 
 * React Query hook for fetching availability for an amenity on a specific date.
 * Uses React Query for caching, refetching, and loading states.
 */

import { useQuery } from '@tanstack/react-query';
import {
  getAmenityAvailability,
  AmenityAvailabilityDto,
} from '@/services/api/amenities';
import { queryKeys } from '@/services/api/queryClient';

/**
 * Hook to fetch availability for an amenity on a specific date
 * 
 * @param amenityId - Amenity ID (GUID)
 * @param date - Date in YYYY-MM-DD format
 * @param options - Additional React Query options
 * @returns React Query result with availability data
 */
export function useAmenityAvailability(
  amenityId: string | undefined,
  date: string | undefined, // YYYY-MM-DD format
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery<AmenityAvailabilityDto, Error>({
    queryKey: queryKeys.amenities.availability(amenityId || '', date || ''),
    queryFn: () => getAmenityAvailability(amenityId!, date!),
    enabled: (options?.enabled !== false) && !!amenityId && !!date,
    staleTime: 1000 * 60 * 2, // 2 minutes - availability changes frequently
  });
}

