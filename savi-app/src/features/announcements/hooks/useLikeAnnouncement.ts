/**
 * useLikeAnnouncement Hook
 * 
 * React Query mutation hook for liking/unliking announcements.
 * Supports optimistic updates for instant UI feedback.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  likeAnnouncement,
  unlikeAnnouncement,
  LikeResponse,
  AnnouncementDto,
  AnnouncementSummaryDto,
  PagedResult,
} from '@/services/api/announcements';
import { queryKeys } from '@/services/api/queryClient';

/**
 * Hook to like an announcement
 * 
 * @returns Mutation for liking an announcement
 * 
 * @example
 * ```tsx
 * const { mutate: like, isPending } = useLikeAnnouncement();
 * like('announcement-id');
 * ```
 */
export function useLikeAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation<LikeResponse, Error, string>({
    mutationFn: likeAnnouncement,
    // Optimistic update for instant UI feedback
    onMutate: async (announcementId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.announcements.detail(announcementId),
      });

      // Snapshot the previous value
      const previousDetail = queryClient.getQueryData<AnnouncementDto>(
        queryKeys.announcements.detail(announcementId)
      );

      // Optimistically update the detail
      if (previousDetail) {
        queryClient.setQueryData<AnnouncementDto>(
          queryKeys.announcements.detail(announcementId),
          {
            ...previousDetail,
            hasLiked: true,
            likeCount: previousDetail.likeCount + 1,
          }
        );
      }

      return { previousDetail };
    },
    // On error, roll back to the previous value
    onError: (err, announcementId, context: any) => {
      if (context?.previousDetail) {
        queryClient.setQueryData<AnnouncementDto>(
          queryKeys.announcements.detail(announcementId),
          context.previousDetail
        );
      }
    },
    // After success or error, refetch to sync with server
    onSettled: (data, error, announcementId) => {
      // Update the detail with actual server response
      if (data) {
        queryClient.setQueryData<AnnouncementDto>(
          queryKeys.announcements.detail(announcementId),
          (old) => old ? { ...old, hasLiked: data.hasLiked, likeCount: data.likeCount } : old
        );
      }
      // Invalidate feed to reflect like count changes
      queryClient.invalidateQueries({
        queryKey: queryKeys.announcements.all,
      });
    },
  });
}

/**
 * Hook to unlike an announcement
 * 
 * @returns Mutation for unliking an announcement
 * 
 * @example
 * ```tsx
 * const { mutate: unlike, isPending } = useUnlikeAnnouncement();
 * unlike('announcement-id');
 * ```
 */
export function useUnlikeAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation<LikeResponse, Error, string>({
    mutationFn: unlikeAnnouncement,
    // Optimistic update for instant UI feedback
    onMutate: async (announcementId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.announcements.detail(announcementId),
      });

      // Snapshot the previous value
      const previousDetail = queryClient.getQueryData<AnnouncementDto>(
        queryKeys.announcements.detail(announcementId)
      );

      // Optimistically update the detail
      if (previousDetail) {
        queryClient.setQueryData<AnnouncementDto>(
          queryKeys.announcements.detail(announcementId),
          {
            ...previousDetail,
            hasLiked: false,
            likeCount: Math.max(0, previousDetail.likeCount - 1),
          }
        );
      }

      return { previousDetail };
    },
    // On error, roll back to the previous value
    onError: (err, announcementId, context: any) => {
      if (context?.previousDetail) {
        queryClient.setQueryData<AnnouncementDto>(
          queryKeys.announcements.detail(announcementId),
          context.previousDetail
        );
      }
    },
    // After success or error, refetch to sync with server
    onSettled: (data, error, announcementId) => {
      // Update the detail with actual server response
      if (data) {
        queryClient.setQueryData<AnnouncementDto>(
          queryKeys.announcements.detail(announcementId),
          (old) => old ? { ...old, hasLiked: data.hasLiked, likeCount: data.likeCount } : old
        );
      }
      // Invalidate feed to reflect like count changes
      queryClient.invalidateQueries({
        queryKey: queryKeys.announcements.all,
      });
    },
  });
}

/**
 * Combined hook for toggle like functionality
 * 
 * @returns Object with like/unlike mutations and a toggle function
 * 
 * @example
 * ```tsx
 * const { toggleLike, isPending } = useToggleLike();
 * toggleLike({ announcementId: 'id', isLiked: true }); // Will unlike
 * ```
 */
export function useToggleLike() {
  const likeMutation = useLikeAnnouncement();
  const unlikeMutation = useUnlikeAnnouncement();

  const toggleLike = ({ announcementId, isLiked }: { announcementId: string; isLiked: boolean }) => {
    if (isLiked) {
      unlikeMutation.mutate(announcementId);
    } else {
      likeMutation.mutate(announcementId);
    }
  };

  return {
    toggleLike,
    isPending: likeMutation.isPending || unlikeMutation.isPending,
    likeMutation,
    unlikeMutation,
  };
}

export default useLikeAnnouncement;

