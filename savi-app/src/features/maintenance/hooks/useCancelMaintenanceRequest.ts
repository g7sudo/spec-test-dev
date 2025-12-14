/**
 * useCancelMaintenanceRequest Hook
 * 
 * React Query mutation hook for cancelling a maintenance request.
 * Only works for requests with New or Assigned status.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelMaintenanceRequest } from '@/services/api/maintenance';
import { queryKeys } from '@/services/api/queryClient';

/**
 * Parameters for cancel mutation
 */
interface CancelParams {
  requestId: string;
  reason: string;
}

/**
 * Hook to cancel a maintenance request
 * 
 * Automatically invalidates the maintenance requests list and detail queries on success.
 * 
 * @returns React Query mutation result with cancel function
 * 
 * @example
 * ```tsx
 * const cancelMutation = useCancelMaintenanceRequest();
 * 
 * const handleCancel = () => {
 *   Alert.prompt(
 *     'Cancel Request',
 *     'Please provide a reason for cancellation:',
 *     (reason) => {
 *       cancelMutation.mutate({ requestId, reason }, {
 *         onSuccess: () => {
 *           Alert.alert('Success', 'Request cancelled successfully');
 *           navigation.goBack();
 *         },
 *         onError: (error) => {
 *           Alert.alert('Error', error.message);
 *         },
 *       });
 *     }
 *   );
 * };
 * ```
 */
export function useCancelMaintenanceRequest() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, CancelParams>({
    mutationFn: ({ requestId, reason }) => 
      cancelMaintenanceRequest(requestId, reason),
    onSuccess: (_, { requestId }) => {
      // Invalidate all maintenance queries to refresh lists
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
      // Also invalidate the specific request detail
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.maintenance.detail(requestId) 
      });
    },
    onError: (error) => {
      console.error('[useCancelMaintenanceRequest] ❌ Cancel failed:', error);
    },
  });
}

