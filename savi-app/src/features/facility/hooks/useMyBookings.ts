/**
 * useMyBookings Hook
 * 
 * React Query hook for fetching user's amenity bookings.
 * Uses React Query for caching, refetching, and loading states.
 */

import { useQuery } from '@tanstack/react-query';
import {
  getMyBookings,
  ListBookingsFilters,
  AmenityBookingSummaryDto,
  PagedResult,
} from '@/services/api/amenities';
import { queryKeys } from '@/services/api/queryClient';

/**
 * Hook to fetch user's amenity bookings
 * 
 * @param filters - Optional filters for listing bookings
 * @param options - Additional React Query options
 * @returns React Query result with bookings data
 */
export function useMyBookings(
  filters?: ListBookingsFilters,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery<PagedResult<AmenityBookingSummaryDto>, Error>({
    queryKey: queryKeys.amenities.bookings.myBookings(filters || {}),
    queryFn: () => getMyBookings(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 2, // 2 minutes - bookings can change frequently
  });
}

