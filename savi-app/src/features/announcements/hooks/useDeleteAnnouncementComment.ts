/**
 * useDeleteAnnouncementComment Hook
 * 
 * React Query mutation hook for deleting comments.
 * Users can only delete their own comments.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteAnnouncementComment,
  AnnouncementDto,
} from '@/services/api/announcements';
import { queryKeys } from '@/services/api/queryClient';

/**
 * Input for deleting a comment
 */
interface DeleteCommentInput {
  announcementId: string;
  commentId: string;
}

/**
 * Hook to delete a comment from an announcement
 * 
 * @returns Mutation for deleting a comment
 * 
 * @example
 * ```tsx
 * const { mutate: deleteComment, isPending } = useDeleteAnnouncementComment();
 * deleteComment({
 *   announcementId: 'announcement-id',
 *   commentId: 'comment-id',
 * });
 * ```
 */
export function useDeleteAnnouncementComment() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteCommentInput>({
    mutationFn: ({ announcementId, commentId }) =>
      deleteAnnouncementComment(announcementId, commentId),
    // After success, invalidate comments to refetch
    onSuccess: (_, { announcementId }) => {
      // Invalidate comments queries
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.announcements.detail(announcementId), 'comments'],
      });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.announcements.detail(announcementId), 'commentsInfinite'],
      });
      
      // Update the announcement detail's comment count
      queryClient.setQueryData<AnnouncementDto>(
        queryKeys.announcements.detail(announcementId),
        (old) => old ? { ...old, commentCount: Math.max(0, old.commentCount - 1) } : old
      );
      
      // Invalidate feed to reflect comment count changes
      queryClient.invalidateQueries({
        queryKey: queryKeys.announcements.all,
      });
    },
  });
}

export default useDeleteAnnouncementComment;

