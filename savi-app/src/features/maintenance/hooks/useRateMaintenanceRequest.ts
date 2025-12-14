/**
 * useRateMaintenanceRequest Hook
 * 
 * React Query mutation hook for rating a completed maintenance request.
 * Only works for requests with Completed status.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rateMaintenanceRequest } from '@/services/api/maintenance';
import { queryKeys } from '@/services/api/queryClient';

/**
 * Parameters for rate mutation
 */
interface RateParams {
  requestId: string;
  rating: number; // 1-5
  feedback?: string;
}

/**
 * Hook to rate a completed maintenance request
 * 
 * Automatically invalidates the request detail query on success.
 * 
 * @returns React Query mutation result with rate function
 * 
 * @example
 * ```tsx
 * const rateMutation = useRateMaintenanceRequest();
 * 
 * const handleRate = (rating: number, feedback: string) => {
 *   rateMutation.mutate({ requestId, rating, feedback }, {
 *     onSuccess: () => {
 *       Alert.alert('Thank You', 'Your feedback has been submitted!');
 *     },
 *     onError: (error) => {
 *       Alert.alert('Error', error.message);
 *     },
 *   });
 * };
 * ```
 */
export function useRateMaintenanceRequest() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RateParams>({
    mutationFn: ({ requestId, rating, feedback }) => 
      rateMaintenanceRequest(requestId, rating, feedback),
    onSuccess: (_, { requestId }) => {
      // Invalidate all maintenance queries to refresh lists
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
      // Also invalidate the specific request detail
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.maintenance.detail(requestId) 
      });
    },
    onError: (error) => {
      console.error('[useRateMaintenanceRequest] ❌ Rate failed:', error);
    },
  });
}

