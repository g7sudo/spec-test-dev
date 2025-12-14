/**
 * CommunityFeedsSection Component
 * 
 * Displays a horizontal carousel of recent announcements on the home screen.
 * Shows up to 5 announcements with snap scrolling and a "View All" link.
 */

import React from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Text, Row, Card } from '@/shared/components';
import { useTranslation } from 'react-i18next';
import { AnnouncementSummaryDto, getCategoryConfig } from '@/services/api/announcements';

// Card dimensions for horizontal carousel
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75; // 75% of screen width
const CARD_GAP = 12;

interface CommunityFeedsSectionProps {
  /** Announcements to display (will show first 5 in carousel) */
  announcements: AnnouncementSummaryDto[];
  /** Called when "View All" is pressed */
  onViewAll: () => void;
  /** Called when an announcement card is pressed */
  onAnnouncementPress: (announcementId: string) => void;
  /** Called when like button is pressed */
  onLikePress?: (announcementId: string) => void;
  /** Called when comment button is pressed */
  onCommentPress?: (announcementId: string) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: Error | null;
}

/**
 * CommunityFeedsSection - Home screen announcements carousel
 * 
 * Features:
 * - Horizontal scrolling carousel of announcement cards
 * - Shows up to 5 announcements with snap scrolling
 * - "View All" link to navigate to full feed
 * - Compact card design with image, title, category, and engagement
 */
export const CommunityFeedsSection: React.FC<CommunityFeedsSectionProps> = ({
  announcements,
  onViewAll,
  onAnnouncementPress,
  onLikePress,
  onCommentPress,
  isLoading = false,
  error = null,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('home');

  // Show up to 5 announcements in the carousel
  const displayAnnouncements = announcements.slice(0, 5);

  // Get primary image from announcement (first image sorted by sortOrder)
  const getPrimaryImage = (announcement: AnnouncementSummaryDto): string | null => {
    if (!announcement.images || announcement.images.length === 0) return null;
    const sorted = [...announcement.images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return sorted[0]?.url || null;
  };

  // Format time ago for display
  const formatTimeAgo = (timeAgo: string): string => {
    return timeAgo || '';
  };

  // Loading state
  if (isLoading && announcements.length === 0) {
    return (
      <View style={styles.container}>
        <Row style={styles.header}>
          <Text variant="bodyLarge" weight="semiBold">
            {t('communityFeeds', { defaultValue: 'Community Feeds' })}
          </Text>
          <TouchableOpacity onPress={onViewAll}>
            <Text variant="bodySmall" color={theme.colors.primary}>
              {t('viewAll', { defaultValue: 'View All', ns: 'common' })}
            </Text>
          </TouchableOpacity>
        </Row>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="megaphone-outline" size={32} color={theme.colors.textDisabled} />
      <Text
        variant="body"
        color={theme.colors.textSecondary}
        align="center"
        style={styles.emptyText}
      >
        {t('noRecentUpdates', { defaultValue: 'No recent updates' })}
      </Text>
    </View>
  );

  // Render a single carousel card
  const renderCarouselCard = (announcement: AnnouncementSummaryDto) => {
    const primaryImage = getPrimaryImage(announcement);
    const categoryConfig = getCategoryConfig(announcement.category);
    const hasMultipleImages = (announcement.images?.length ?? 0) > 1;

    return (
      <TouchableOpacity
        key={announcement.id}
        activeOpacity={0.9}
        onPress={() => onAnnouncementPress(announcement.id)}
        style={styles.cardWrapper}
      >
        <Card style={[styles.carouselCard, { width: CARD_WIDTH }]}>
          {/* Image Section */}
          {primaryImage ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: primaryImage }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              {/* Multi-image indicator */}
              {hasMultipleImages && (
                <View style={styles.multiImageBadge}>
                  <Ionicons name="images" size={10} color="#FFFFFF" />
                  <Text variant="caption" color="#FFFFFF" style={styles.imageCount}>
                    {announcement.images?.length}
                  </Text>
                </View>
              )}
              {/* Category badge overlay */}
              <View style={[styles.categoryOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                <Ionicons name={categoryConfig.icon} size={10} color="#FFFFFF" />
                <Text variant="caption" color="#FFFFFF" style={styles.categoryText}>
                  {categoryConfig.label}
                </Text>
              </View>
            </View>
          ) : (
            // No image placeholder with category
            <View style={[styles.noImageContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Ionicons name={categoryConfig.icon} size={24} color={theme.colors.textSecondary} />
              <Text variant="caption" color={theme.colors.textSecondary}>
                {categoryConfig.label}
              </Text>
            </View>
          )}

          {/* Content Section */}
          <View style={styles.cardContent}>
            {/* Title */}
            <Text
              variant="body"
              weight="semiBold"
              numberOfLines={2}
              style={styles.cardTitle}
            >
              {announcement.title}
            </Text>

            {/* Bottom row: Time + Engagement */}
            <Row style={styles.cardFooter}>
              <Text variant="caption" color={theme.colors.textSecondary}>
                {formatTimeAgo(announcement.timeAgo)}
              </Text>
              
              <Row style={styles.engagement}>
                {/* Like count */}
                {announcement.allowLikes && (
                  <TouchableOpacity 
                    onPress={() => onLikePress?.(announcement.id)}
                    style={styles.engagementItem}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons 
                      name={announcement.hasLiked ? 'heart' : 'heart-outline'} 
                      size={14} 
                      color={announcement.hasLiked ? theme.colors.error : theme.colors.textSecondary} 
                    />
                    {announcement.likeCount > 0 && (
                      <Text variant="caption" color={theme.colors.textSecondary}>
                        {announcement.likeCount}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
                
                {/* Comment count */}
                {announcement.allowComments && (
                  <TouchableOpacity 
                    onPress={() => onCommentPress?.(announcement.id)}
                    style={styles.engagementItem}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="chatbubble-outline" size={14} color={theme.colors.textSecondary} />
                    {announcement.commentCount > 0 && (
                      <Text variant="caption" color={theme.colors.textSecondary}>
                        {announcement.commentCount}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </Row>
            </Row>
          </View>

          {/* Unread indicator */}
          {!announcement.hasRead && (
            <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <Row style={styles.header}>
        <Text variant="bodyLarge" weight="semiBold">
          {t('communityFeeds', { defaultValue: 'Community Feeds' })}
        </Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text variant="bodySmall" color={theme.colors.primary}>
            {t('viewAll', { defaultValue: 'View All', ns: 'common' })}
          </Text>
        </TouchableOpacity>
      </Row>

      {/* Horizontal Carousel or Empty State */}
      {displayAnnouncements.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + CARD_GAP}
          snapToAlignment="start"
        >
          {displayAnnouncements.map(renderCarouselCard)}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  header: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    marginTop: 4,
  },
  // Carousel styles
  carouselContent: {
    paddingHorizontal: 16,
    gap: CARD_GAP,
  },
  cardWrapper: {
    borderRadius: 12,
  },
  carouselCard: {
    borderRadius: 12,
    overflow: 'hidden',
    padding: 0,
    position: 'relative',
  },
  // Image section
  imageContainer: {
    height: 120,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  multiImageBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  imageCount: {
    fontSize: 10,
  },
  categoryOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryText: {
    fontSize: 10,
  },
  // Content section
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    lineHeight: 20,
    marginBottom: 8,
  },
  cardFooter: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  engagement: {
    gap: 12,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  // Unread indicator
  unreadDot: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default CommunityFeedsSection;
