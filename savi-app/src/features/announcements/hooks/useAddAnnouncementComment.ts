/**
 * useAddAnnouncementComment Hook
 * 
 * React Query mutation hook for adding comments to announcements.
 * Invalidates the comments query on success to refetch fresh data.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addAnnouncementComment,
  AnnouncementDto,
} from '@/services/api/announcements';
import { queryKeys } from '@/services/api/queryClient';

/**
 * Input for adding a comment
 */
interface AddCommentInput {
  announcementId: string;
  content: string;
  parentCommentId?: string | null;
}

/**
 * Hook to add a comment to an announcement
 * 
 * @returns Mutation for adding a comment
 * 
 * @example
 * ```tsx
 * const { mutate: addComment, isPending } = useAddAnnouncementComment();
 * addComment({
 *   announcementId: 'id',
 *   content: 'Great announcement!',
 * });
 * ```
 */
export function useAddAnnouncementComment() {
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, Error, AddCommentInput>({
    mutationFn: ({ announcementId, content, parentCommentId }) =>
      addAnnouncementComment(announcementId, content, parentCommentId),
    // After success, invalidate comments to refetch
    onSuccess: (data, { announcementId }) => {
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
        (old) => old ? { ...old, commentCount: old.commentCount + 1 } : old
      );
      
      // Invalidate feed to reflect comment count changes
      queryClient.invalidateQueries({
        queryKey: queryKeys.announcements.all,
      });
    },
  });
}

export default useAddAnnouncementComment;

