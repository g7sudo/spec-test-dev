/**
 * useCreateMaintenanceRequest Hook
 * 
 * React Query mutation hook for creating a new maintenance request.
 * Handles multipart form data with file attachments.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createMaintenanceRequest,
  CreateMaintenanceRequestData,
  CreateMaintenanceRequestResponse,
} from '@/services/api/maintenance';
import { queryKeys } from '@/services/api/queryClient';

/**
 * Hook to create a new maintenance request
 * 
 * Automatically invalidates the maintenance requests list query on success.
 * Supports file attachments via multipart/form-data.
 * 
 * @returns React Query mutation result with create function
 * 
 * @example
 * ```tsx
 * const createMutation = useCreateMaintenanceRequest();
 * 
 * const handleSubmit = () => {
 *   createMutation.mutate({
 *     categoryCode: MaintenanceCategoryCode.ELEC,
 *     title: 'Kitchen light not working',
 *     description: 'The ceiling light stopped working yesterday',
 *     priority: MaintenancePriority.Normal,
 *     attachments: [
 *       { uri: 'file://photo1.jpg', type: 'image/jpeg', name: 'photo1.jpg' }
 *     ],
 *   }, {
 *     onSuccess: (data) => {
 *       Alert.alert('Success', `Ticket ${data.ticketNumber} created!`);
 *       navigation.goBack();
 *     },
 *     onError: (error) => {
 *       Alert.alert('Error', error.message);
 *     },
 *   });
 * };
 * ```
 */
export function useCreateMaintenanceRequest() {
  const queryClient = useQueryClient();

  return useMutation<
    CreateMaintenanceRequestResponse,
    Error,
    CreateMaintenanceRequestData
  >({
    mutationFn: (data) => createMaintenanceRequest(data),
    onSuccess: () => {
      // Invalidate all maintenance queries to refresh lists
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
    },
    onError: (error) => {
      console.error('[useCreateMaintenanceRequest] ❌ Create failed:', error);
    },
  });
}

