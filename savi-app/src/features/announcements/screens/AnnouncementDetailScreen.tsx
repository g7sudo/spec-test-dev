/**
 * AnnouncementDetailScreen
 * 
 * Detailed view of a single announcement.
 * Shows full content, images, like button, and comments section.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Row, Avatar, Card } from '@/shared/components';
import { useTranslation } from 'react-i18next';
import { CommunityStackParamList, CommunityStackScreenProps } from '@/app/navigation/types';
import {
  AnnouncementDto,
  AnnouncementCommentDto,
  getCategoryConfig,
  getPriorityConfig,
  AnnouncementPriority,
} from '@/services/api/announcements';
import {
  useAnnouncementDetail,
  useToggleLike,
  useAnnouncementComments,
  useAddAnnouncementComment,
  useDeleteAnnouncementComment,
} from '../hooks';
import { CommentItem, CommentInput } from '../components';

type RouteProp = CommunityStackScreenProps<'AnnouncementDetail'>['route'];
type NavigationProp = NativeStackNavigationProp<CommunityStackParamList, 'AnnouncementDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * AnnouncementDetailScreen - Full announcement view with comments
 * 
 * Features:
 * - Full title and body content
 * - Image gallery/carousel
 * - Like button with count
 * - Comments list with add/delete
 * - Event details (if announcement is an event)
 * - Author info and publish date
 */
export const AnnouncementDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('announcements');
  const route = useRoute<RouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { announcementId } = route.params;

  // Reply state
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  
  // Image gallery state - track current image index for pagination dots
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch announcement detail
  const {
    data: announcement,
    isLoading: isLoadingDetail,
    isError: isErrorDetail,
    error: detailError,
    refetch: refetchDetail,
  } = useAnnouncementDetail(announcementId);

  // Fetch comments
  const {
    data: commentsData,
    isLoading: isLoadingComments,
    refetch: refetchComments,
  } = useAnnouncementComments(announcementId, { pageSize: 50 });

  // Like mutation
  const { toggleLike, isPending: isLikePending } = useToggleLike();

  // Add comment mutation
  const { mutate: addComment, isPending: isAddingComment } = useAddAnnouncementComment();

  // Delete comment mutation
  const { mutate: deleteComment, isPending: isDeletingComment } = useDeleteAnnouncementComment();

  // Get display configs
  const categoryConfig = announcement ? getCategoryConfig(announcement.category) : null;
  const priorityConfig = announcement ? getPriorityConfig(announcement.priority) : null;
  const showPriorityBadge = announcement?.priority !== AnnouncementPriority.Normal;

  // Flatten comments
  const comments = useMemo(() => {
    return commentsData?.items || [];
  }, [commentsData?.items]);

  // Handlers
  const handleLikePress = useCallback(() => {
    if (announcement && !isLikePending) {
      toggleLike({
        announcementId: announcement.id,
        isLiked: announcement.hasLiked,
      });
    }
  }, [announcement, isLikePending, toggleLike]);

  const handleRefresh = useCallback(() => {
    refetchDetail();
    refetchComments();
  }, [refetchDetail, refetchComments]);

  const handleAddComment = useCallback(
    (content: string) => {
      if (!announcementId) return;
      
      addComment(
        {
          announcementId,
          content,
          parentCommentId: replyingTo?.id || null,
        },
        {
          onSuccess: () => {
            setReplyingTo(null);
            refetchComments();
          },
        }
      );
    },
    [announcementId, replyingTo, addComment, refetchComments]
  );

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      if (!announcementId) return;
      
      deleteComment({
        announcementId,
        commentId,
      });
    },
    [announcementId, deleteComment]
  );

  const handleReply = useCallback(
    (commentId: string) => {
      const comment = comments.find((c) => c.id === commentId);
      if (comment) {
        setReplyingTo({
          id: comment.id,
          authorName: comment.author.displayName,
        });
      }
    },
    [comments]
  );

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Format date for display
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Loading state
  if (isLoadingDetail && !announcement) {
    return (
      <Screen safeArea style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  // Error state
  if (isErrorDetail && !announcement) {
    return (
      <Screen safeArea style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text variant="body" color={theme.colors.error} align="center">
            {detailError?.message || t('errorLoading', { defaultValue: 'Error loading announcement' })}
          </Text>
        </View>
      </Screen>
    );
  }

  if (!announcement) return null;

  return (
    <Screen safeArea style={styles.screen}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text variant="h3" numberOfLines={1} style={styles.headerTitle}>
          {t('detail', { defaultValue: 'Announcement' })}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingDetail}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Category & Priority Badges */}
        <Row style={styles.badgeRow}>
          {categoryConfig && (
            <View style={[styles.categoryBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Ionicons name={categoryConfig.icon} size={14} color={theme.colors.textSecondary} />
              <Text variant="caption" color={theme.colors.textSecondary}>
                {categoryConfig.label}
              </Text>
            </View>
          )}
          {showPriorityBadge && priorityConfig && (
            <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.color }]}>
              <Text variant="caption" color="#FFFFFF" weight="semiBold">
                {priorityConfig.label}
              </Text>
            </View>
          )}
          {announcement.isPinned && (
            <Ionicons name="pin" size={16} color={theme.colors.primary} />
          )}
        </Row>

        {/* Title */}
        <Text variant="h2" style={styles.title}>
          {announcement.title}
        </Text>

        {/* Author & Date Row */}
        {announcement.author && (
          <Row style={styles.authorRow}>
            <Avatar
              size="small"
              name={announcement.author.displayName}
              imageUrl={announcement.author.profileImageUrl || undefined}
            />
            <View style={styles.authorInfo}>
              <Text variant="bodySmall" weight="semiBold">
                {announcement.author.displayName}
              </Text>
              <Text variant="caption" color={theme.colors.textSecondary}>
                {formatDate(announcement.publishedAt)}
              </Text>
            </View>
          </Row>
        )}

        {/* Event Info Card */}
        {announcement.isEvent && announcement.eventStartAt && (
          <Card style={styles.eventCard}>
            <Row style={styles.eventRow}>
              <Ionicons name="calendar" size={20} color={theme.colors.primary} />
              <View style={styles.eventInfo}>
                <Text variant="bodySmall" weight="semiBold">
                  {t('event', { defaultValue: 'Event' })}
                </Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  {formatDate(announcement.eventStartAt)}
                  {announcement.eventEndAt && ` - ${formatDate(announcement.eventEndAt)}`}
                </Text>
                {announcement.eventLocationText && (
                  <Row style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                    <Text variant="caption" color={theme.colors.textSecondary}>
                      {announcement.eventLocationText}
                    </Text>
                  </Row>
                )}
              </View>
            </Row>
          </Card>
        )}

        {/* Images Gallery - Supports multiple images with pagination */}
        {announcement.images && announcement.images.length > 0 && (
          <View style={styles.imagesContainer}>
            {/* Image Carousel */}
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.imageScroll}
              onScroll={(event) => {
                // Calculate current image index from scroll position
                const contentOffsetX = event.nativeEvent.contentOffset.x;
                const imageWidth = SCREEN_WIDTH - 32; // Account for padding
                const newIndex = Math.round(contentOffsetX / imageWidth);
                if (newIndex !== currentImageIndex && newIndex >= 0 && newIndex < announcement.images.length) {
                  setCurrentImageIndex(newIndex);
                }
              }}
              scrollEventThrottle={16}
            >
              {/* Sort images by sortOrder and render */}
              {[...announcement.images]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((image, index) => (
                  <Image
                    key={image.id}
                    source={{ uri: image.url }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ))}
            </ScrollView>
            
            {/* Pagination Dots - Show for multiple images */}
            {announcement.images.length > 1 && (
              <View style={styles.paginationContainer}>
                {/* Dots */}
                <View style={styles.dotsContainer}>
                  {announcement.images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        {
                          backgroundColor: index === currentImageIndex 
                            ? theme.colors.primary 
                            : 'rgba(255, 255, 255, 0.5)',
                          width: index === currentImageIndex ? 20 : 8,
                        },
                      ]}
                    />
                  ))}
                </View>
                
                {/* Image Counter */}
                <View style={styles.imageCounter}>
                  <Text variant="caption" color="#FFFFFF">
                    {currentImageIndex + 1} / {announcement.images.length}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Body Content */}
        <Text variant="body" style={styles.body}>
          {announcement.body}
        </Text>

        {/* Interaction Row */}
        <Row style={styles.interactionRow}>
          {/* Like Button */}
          {announcement.allowLikes && (
            <TouchableOpacity
              style={styles.interactionButton}
              onPress={handleLikePress}
              disabled={isLikePending}
            >
              <Ionicons
                name={announcement.hasLiked ? 'heart' : 'heart-outline'}
                size={22}
                color={announcement.hasLiked ? theme.colors.error : theme.colors.textSecondary}
              />
              <Text
                variant="body"
                color={announcement.hasLiked ? theme.colors.error : theme.colors.textSecondary}
              >
                {announcement.likeCount} {t('likes', { defaultValue: 'Likes' })}
              </Text>
            </TouchableOpacity>
          )}

          {/* Comment Count */}
          {announcement.allowComments && (
            <View style={styles.interactionButton}>
              <Ionicons name="chatbubble-outline" size={20} color={theme.colors.textSecondary} />
              <Text variant="body" color={theme.colors.textSecondary}>
                {announcement.commentCount} {t('comments', { defaultValue: 'Comments' })}
              </Text>
            </View>
          )}
        </Row>

        {/* Comments Section */}
        {announcement.allowComments && (
          <View style={styles.commentsSection}>
            <Text variant="bodyLarge" weight="semiBold" style={styles.commentsHeader}>
              {t('commentsTitle', { defaultValue: 'Comments' })}
            </Text>

            {isLoadingComments && comments.length === 0 ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={styles.commentsLoader} />
            ) : comments.length === 0 ? (
              <Text variant="body" color={theme.colors.textSecondary} style={styles.noComments}>
                {t('noComments', { defaultValue: 'No comments yet. Be the first to comment!' })}
              </Text>
            ) : (
              <View style={styles.commentsList}>
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onDelete={handleDeleteComment}
                    onReply={handleReply}
                    isDeleting={isDeletingComment}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Comment Input */}
      {announcement.allowComments && (
        <CommentInput
          onSubmit={handleAddComment}
          isSubmitting={isAddingComment}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  badgeRow: {
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  title: {
    marginBottom: 16,
    lineHeight: 32,
  },
  authorRow: {
    gap: 12,
    marginBottom: 16,
  },
  authorInfo: {
    gap: 2,
  },
  eventCard: {
    padding: 12,
    marginBottom: 16,
  },
  eventRow: {
    gap: 12,
    alignItems: 'flex-start',
  },
  eventInfo: {
    flex: 1,
    gap: 4,
  },
  locationRow: {
    gap: 4,
    marginTop: 4,
  },
  // Image Gallery Styles
  imagesContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  imageScroll: {
    width: SCREEN_WIDTH - 32,
  },
  image: {
    width: SCREEN_WIDTH - 32,
    height: 220,
  },
  // Pagination container at bottom of image gallery
  paginationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  // Dots container for pagination indicators
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // Individual pagination dot
  dot: {
    height: 8,
    borderRadius: 4,
  },
  // Image counter badge (e.g., "1 / 3")
  imageCounter: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  body: {
    lineHeight: 24,
    marginBottom: 16,
  },
  interactionRow: {
    gap: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentsSection: {
    marginTop: 16,
  },
  commentsHeader: {
    marginBottom: 12,
  },
  commentsLoader: {
    paddingVertical: 24,
  },
  noComments: {
    paddingVertical: 24,
    textAlign: 'center',
  },
  commentsList: {
    gap: 0,
  },
});

export default AnnouncementDetailScreen;

