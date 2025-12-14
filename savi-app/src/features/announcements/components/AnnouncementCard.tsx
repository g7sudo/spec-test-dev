/**
 * AnnouncementCard Component
 * 
 * Reusable card component for displaying announcements in feed and home section.
 * Shows title, category badge, author info, like/comment counts, and interactions.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Text, Card, Row, Avatar } from '@/shared/components';
import { useTranslation } from 'react-i18next';
import {
  AnnouncementSummaryDto,
  AnnouncementCategory,
  AnnouncementPriority,
  getCategoryConfig,
  getPriorityConfig,
} from '@/services/api/announcements';

interface AnnouncementCardProps {
  /** The announcement data to display */
  announcement: AnnouncementSummaryDto;
  /** Called when the card is pressed */
  onPress?: (id: string) => void;
  /** Called when like button is pressed */
  onLikePress?: (id: string) => void;
  /** Called when comment button is pressed */
  onCommentPress?: (id: string) => void;
  /** Show compact version (for home section) */
  compact?: boolean;
  /** Is the card currently liked by user (for optimistic UI) */
  isLiked?: boolean;
}

/**
 * AnnouncementCard - Displays a single announcement in feed/list view
 * 
 * Features:
 * - Category badge with icon
 * - Priority indicator for important/critical announcements
 * - Pin indicator for pinned announcements
 * - Like and comment interaction buttons
 * - Primary image thumbnail (if available)
 * - Time ago display
 */
export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  onPress,
  onLikePress,
  onCommentPress,
  compact = false,
  isLiked,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('announcements');

  // Get category and priority configs for display
  const categoryConfig = getCategoryConfig(announcement.category);
  const priorityConfig = getPriorityConfig(announcement.priority);

  // Handlers
  const handlePress = useCallback(() => {
    onPress?.(announcement.id);
  }, [announcement.id, onPress]);

  const handleLikePress = useCallback(() => {
    onLikePress?.(announcement.id);
  }, [announcement.id, onLikePress]);

  const handleCommentPress = useCallback(() => {
    onCommentPress?.(announcement.id);
  }, [announcement.id, onCommentPress]);

  // Priority color for badge/indicator
  const showPriorityBadge = announcement.priority !== AnnouncementPriority.Normal;

  // Get primary image (first image sorted by sortOrder)
  // Handle null/undefined images array safely
  const imagesArray = Array.isArray(announcement.images) ? announcement.images : [];
  const sortedImages = imagesArray.length > 0
    ? [...imagesArray].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    : [];
  const primaryImage = sortedImages.length > 0 ? sortedImages[0] : null;
  const hasMultipleImages = sortedImages.length > 1;
  
  // Debug log to help identify issues (remove in production)
  if (__DEV__ && announcement.images) {
    console.log('[AnnouncementCard] Images:', {
      id: announcement.id,
      imagesCount: imagesArray.length,
      primaryImageUrl: primaryImage?.url,
    });
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Card style={styles.card}>
        {/* Header Row: Category Badge, Priority, Pin, Time */}
        <Row style={styles.headerRow}>
          <Row style={styles.leftHeader}>
            {/* Category Badge */}
            <View style={[styles.categoryBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Ionicons
                name={categoryConfig.icon}
                size={12}
                color={theme.colors.textSecondary}
              />
              <Text variant="caption" color={theme.colors.textSecondary} style={styles.categoryText}>
                {categoryConfig.label}
              </Text>
            </View>

            {/* Priority Badge (if not normal) */}
            {showPriorityBadge && (
              <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.color }]}>
                <Text variant="caption" color="#FFFFFF" weight="semiBold">
                  {priorityConfig.label}
                </Text>
              </View>
            )}

            {/* Pin Indicator */}
            {announcement.isPinned && (
              <View style={styles.pinIcon}>
                <Ionicons name="pin" size={14} color={theme.colors.primary} />
              </View>
            )}
          </Row>

          {/* Time Ago */}
          <Text variant="caption" color={theme.colors.textSecondary}>
            {announcement.timeAgo}
          </Text>
        </Row>

        {/* Content Row: Title + Optional Image */}
        <View style={styles.contentRow}>
          <View style={[styles.textContent, primaryImage ? styles.textWithImage : null]}>
            {/* Title */}
            <Text
              variant="body"
              weight="semiBold"
              numberOfLines={compact ? 2 : 3}
              style={styles.title}
            >
              {announcement.title}
            </Text>

            {/* Event Info (if event) */}
            {announcement.isEvent && announcement.eventStartAt && (
              <Row style={styles.eventInfo}>
                <Ionicons name="calendar-outline" size={14} color={theme.colors.primary} />
                <Text variant="caption" color={theme.colors.primary} style={styles.eventDate}>
                  {formatEventDate(announcement.eventStartAt)}
                </Text>
              </Row>
            )}
          </View>

          {/* Primary Image Thumbnail */}
          {primaryImage && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: primaryImage.url }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              {/* Multiple images indicator */}
              {hasMultipleImages && (
                <View style={styles.multiImageBadge}>
                  <Ionicons name="images" size={10} color="#FFFFFF" />
                  <Text variant="caption" color="#FFFFFF" style={styles.multiImageCount}>
                    {sortedImages.length}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Interaction Row */}
        <Row style={styles.interactionRow}>
          <Row style={styles.interactions}>
            {/* Like Button - only show if likes are allowed */}
            {announcement.allowLikes && (
              <TouchableOpacity
                style={styles.interactionButton}
                onPress={handleLikePress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                disabled={!onLikePress}
              >
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isLiked ? theme.colors.error : theme.colors.textSecondary}
                />
                {announcement.likeCount > 0 && (
                  <Text
                    variant="caption"
                    color={theme.colors.textSecondary}
                    style={styles.countText}
                  >
                    {announcement.likeCount}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {/* Comment Button - only show if comments are allowed */}
            {announcement.allowComments && (
              <TouchableOpacity
                style={styles.interactionButton}
                onPress={handleCommentPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                disabled={!onCommentPress}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={16}
                  color={theme.colors.textSecondary}
                />
                {announcement.commentCount > 0 && (
                  <Text
                    variant="caption"
                    color={theme.colors.textSecondary}
                    style={styles.countText}
                  >
                    {announcement.commentCount}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </Row>

          {/* Unread Indicator */}
          {!announcement.hasRead && (
            <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
          )}
        </Row>
      </Card>
    </TouchableOpacity>
  );
};

/**
 * Helper function to format event date for display
 */
function formatEventDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
    return date.toLocaleDateString('en-US', options);
  } catch {
    return dateString;
  }
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    marginBottom: 8,
  },
  headerRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leftHeader: {
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryText: {
    fontSize: 11,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pinIcon: {
    padding: 2,
  },
  contentRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  textContent: {
    flex: 1,
  },
  textWithImage: {
    marginRight: 12,
  },
  title: {
    lineHeight: 22,
  },
  eventInfo: {
    marginTop: 4,
    gap: 4,
  },
  eventDate: {
    marginLeft: 2,
  },
  imageContainer: {
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  // Badge showing multiple images count
  multiImageBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  multiImageCount: {
    fontSize: 10,
    fontWeight: '600',
  },
  interactionRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  interactions: {
    gap: 16,
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  countText: {
    marginLeft: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default AnnouncementCard;

