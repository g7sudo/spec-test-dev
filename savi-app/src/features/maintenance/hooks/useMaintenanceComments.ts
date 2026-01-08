/**
 * useMaintenanceComments Hook
 * 
 * React Query hooks for fetching and adding comments to maintenance requests.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMaintenanceRequestComments,
  addMaintenanceRequestComment,
  MaintenanceCommentDto,
  AddCommentResponseDto,
  CommentImageAttachment,
} from '@/services/api/maintenance';
import { queryKeys } from '@/services/api/queryClient';

// ============================================================================
// Query Keys for Comments
// ============================================================================

/**
 * Generate query key for maintenance comments
 */
const commentsQueryKey = (requestId: string) => 
  [...queryKeys.maintenance.detail(requestId), 'comments'] as const;

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch comments for a maintenance request
 * 
 * @param requestId - The ID of the maintenance request
 * @param options - Additional options
 * @returns React Query result with comments array
 * 
 * @example
 * ```tsx
 * const { data: comments, isLoading } = useMaintenanceComments(requestId);
 * 
 * return (
 *   <FlatList
 *     data={comments}
 *     renderItem={({ item }) => <CommentItem comment={item} />}
 *   />
 * );
 * ```
 */
export function useMaintenanceComments(
  requestId: string,
  options?: {
    enabled?: boolean;
    includeInternal?: boolean;
  }
) {
  return useQuery<MaintenanceCommentDto[], Error>({
    queryKey: commentsQueryKey(requestId),
    queryFn: () => getMaintenanceRequestComments(
      requestId, 
      options?.includeInternal ?? false
    ),
    // Only fetch if requestId is provided
    enabled: !!requestId && options?.enabled !== false,
    // Comments should refresh frequently during active conversations
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Parameters for add comment mutation
 * Supports optional image attachments
 */
interface AddCommentParams {
  requestId: string;
  message: string;
  attachments?: CommentImageAttachment[];
}

/**
 * Hook to add a comment to a maintenance request with optional attachments
 * 
 * Automatically invalidates comments query on success.
 * 
 * @returns React Query mutation result with add comment function
 * 
 * @example
 * ```tsx
 * const addCommentMutation = useAddMaintenanceComment();
 * 
 * const handleAddComment = (message: string, images?: CommentImageAttachment[]) => {
 *   addCommentMutation.mutate({ requestId, message, attachments: images }, {
 *     onSuccess: (data) => {
 *       setCommentText('');
 *       console.log('Comment added:', data.commentId);
 *       console.log('Attachments:', data.attachments);
 *     },
 *     onError: (error) => {
 *       Alert.alert('Error', error.message);
 *     },
 *   });
 * };
 * ```
 */
export function useAddMaintenanceComment() {
  const queryClient = useQueryClient();

  return useMutation<AddCommentResponseDto, Error, AddCommentParams>({
    mutationFn: ({ requestId, message, attachments }) => 
      addMaintenanceRequestComment(requestId, message, attachments),
    onSuccess: (_, { requestId }) => {
      // Invalidate comments for this request to refetch with new comment
      queryClient.invalidateQueries({ 
        queryKey: commentsQueryKey(requestId) 
      });
    },
    onError: (error) => {
      console.error('[useAddMaintenanceComment] ❌ Add comment failed:', error);
    },
  });
}

