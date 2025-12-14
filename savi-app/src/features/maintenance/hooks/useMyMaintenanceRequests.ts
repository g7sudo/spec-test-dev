/**
 * useMyMaintenanceRequests Hook
 * 
 * React Query hook for fetching user's maintenance requests.
 * Uses React Query for caching, refetching, and loading states.
 */

import { useQuery } from '@tanstack/react-query';
import {
  getMyMaintenanceRequests,
  ListMaintenanceFilters,
  MaintenanceRequestSummaryDto,
  PagedResult,
} from '@/services/api/maintenance';
import { queryKeys } from '@/services/api/queryClient';

/**
 * Hook to fetch user's maintenance requests
 * 
 * @param filters - Optional filters for listing maintenance requests
 * @param options - Additional React Query options
 * @returns React Query result with maintenance requests data
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useMyMaintenanceRequests({
 *   status: MaintenanceStatus.InProgress,
 *   page: 1,
 *   pageSize: 20,
 * });
 * ```
 */
export function useMyMaintenanceRequests(
  filters?: ListMaintenanceFilters,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery<PagedResult<MaintenanceRequestSummaryDto>, Error>({
    // Use the queryKeys factory for consistent cache key management
    queryKey: queryKeys.maintenance.myRequests(filters || {}),
    queryFn: () => getMyMaintenanceRequests(filters),
    // Enable by default, allow override
    enabled: options?.enabled !== false,
    // Maintenance requests can change frequently (assignments, status updates)
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

