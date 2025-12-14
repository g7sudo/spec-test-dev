/**
 * useMaintenanceRequestDetail Hook
 * 
 * React Query hook for fetching a single maintenance request's details.
 * Uses React Query for caching, refetching, and loading states.
 */

import { useQuery } from '@tanstack/react-query';
import {
  getMaintenanceRequestDetail,
  MaintenanceRequestDetailDto,
} from '@/services/api/maintenance';
import { queryKeys } from '@/services/api/queryClient';

/**
 * Hook to fetch a single maintenance request's details
 * 
 * @param requestId - The ID of the maintenance request
 * @param options - Additional React Query options
 * @returns React Query result with maintenance request details
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useMaintenanceRequestDetail(requestId);
 * 
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorState message={error.message} />;
 * 
 * return <RequestDetails request={data} />;
 * ```
 */
export function useMaintenanceRequestDetail(
  requestId: string,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery<MaintenanceRequestDetailDto, Error>({
    // Use the queryKeys factory for consistent cache key management
    queryKey: queryKeys.maintenance.detail(requestId),
    queryFn: () => getMaintenanceRequestDetail(requestId),
    // Only fetch if requestId is provided
    enabled: !!requestId && options?.enabled !== false,
    // Request details can change (status updates, assignments)
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

