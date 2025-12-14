/**
 * CommunityFeedsSection Component
 * 
 * Displays a preview of recent announcements on the home screen.
 * Shows 2 announcements with a "View All" link to the full feed.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Text, Row } from '@/shared/components';
import { useTranslation } from 'react-i18next';
import { AnnouncementSummaryDto } from '@/services/api/announcements';
import { AnnouncementCard } from '@/features/announcements/components';

interface CommunityFeedsSectionProps {
  /** Announcements to display (will show first 2) */
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
 * CommunityFeedsSection - Home screen announcements preview
 * 
 * Features:
 * - Shows first 2 announcements from the feed
 * - "View All" link to navigate to full feed
 * - Uses AnnouncementCard component for consistent UI
 * - Empty and loading states
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

  // Show only first 2 announcements
  const displayAnnouncements = announcements.slice(0, 2);

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

      {/* Announcements List or Empty State */}
      {displayAnnouncements.length === 0 ? (
        renderEmptyState()
      ) : (
        <View style={styles.announcementsList}>
          {displayAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onPress={onAnnouncementPress}
              onLikePress={onLikePress}
              onCommentPress={onCommentPress}
              compact
            />
          ))}
          
          {/* Show "View All" button if there are more announcements */}
          {announcements.length > 2 && (
            <TouchableOpacity
              style={[styles.viewAllButton, { borderColor: theme.colors.border }]}
              onPress={onViewAll}
            >
              <Text variant="bodySmall" color={theme.colors.primary}>
                {t('viewAllAnnouncements', { 
                  count: announcements.length - 2, 
                  defaultValue: `View ${announcements.length - 2} more announcements` 
                })}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
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
  announcementsList: {
    paddingHorizontal: 16,
    gap: 8,
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
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 4,
    marginTop: 4,
  },
});

export default CommunityFeedsSection;
