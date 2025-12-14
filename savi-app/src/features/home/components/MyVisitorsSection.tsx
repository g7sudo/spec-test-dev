/**
 * MyVisitorsSection Component
 * 
 * Displays a horizontal carousel of today and pending visitors on the home screen.
 * Uses real visitor data from the API with the same design pattern as Community Feeds.
 */

import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Text, Card, Row, Avatar, Badge, Button } from '@/shared/components';
import { useTranslation } from 'react-i18next';
import { 
  VisitorPassSummaryDto, 
  VisitorPassStatus, 
  VisitorType 
} from '@/services/api/visitors';

// Card dimensions for horizontal carousel
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.8; // 80% of screen width for visitors
const CARD_GAP = 12;

interface MyVisitorsSectionProps {
  /** Visitors to display (today + pending) */
  visitors: VisitorPassSummaryDto[];
  /** Called when "View All" is pressed */
  onViewAll: () => void;
  /** Called when a visitor card is pressed */
  onVisitorPress: (visitorId: string) => void;
  /** Called when pre-register button is pressed */
  onPreRegister: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: Error | null;
}

/**
 * MyVisitorsSection - Home screen visitors carousel
 * 
 * Features:
 * - Horizontal scrolling carousel of visitor cards
 * - Shows today + pending visitors (up to 5)
 * - Status badge, time, access code display
 * - Snap scrolling for smooth UX
 */
export const MyVisitorsSection: React.FC<MyVisitorsSectionProps> = ({
  visitors,
  onViewAll,
  onVisitorPress,
  onPreRegister,
  isLoading = false,
  error = null,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('home');

  // Show up to 5 visitors in the carousel
  const displayVisitors = useMemo(() => visitors.slice(0, 5), [visitors]);

  // Get status badge color based on visitor pass status
  const getStatusColor = (status: VisitorPassStatus) => {
    switch (status) {
      case VisitorPassStatus.Approved:
        return theme.colors.success;
      case VisitorPassStatus.PreRegistered:
        return theme.colors.info;
      case VisitorPassStatus.AtGatePendingApproval:
        return theme.colors.warning;
      case VisitorPassStatus.CheckedIn:
        return theme.colors.primary;
      case VisitorPassStatus.CheckedOut:
        return theme.colors.textSecondary;
      case VisitorPassStatus.Rejected:
      case VisitorPassStatus.Expired:
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  // Get status label for display
  const getStatusLabel = (status: VisitorPassStatus) => {
    switch (status) {
      case VisitorPassStatus.PreRegistered:
        return 'Pre-Registered';
      case VisitorPassStatus.AtGatePendingApproval:
        return 'At Gate';
      case VisitorPassStatus.Approved:
        return 'Approved';
      case VisitorPassStatus.Rejected:
        return 'Rejected';
      case VisitorPassStatus.CheckedIn:
        return 'Checked In';
      case VisitorPassStatus.CheckedOut:
        return 'Checked Out';
      case VisitorPassStatus.Expired:
        return 'Expired';
      default:
        return status;
    }
  };

  // Get visitor type icon
  const getVisitorTypeIcon = (type: VisitorType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case VisitorType.Guest:
        return 'person-outline';
      case VisitorType.Delivery:
        return 'cube-outline';
      case VisitorType.Service:
        return 'construct-outline';
      case VisitorType.Other:
        return 'ellipse-outline';
      default:
        return 'person-outline';
    }
  };

  // Format date for display (e.g., "Today", "Tomorrow", "Wed 10")
  const formatDateLabel = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);

      if (dateOnly.getTime() === today.getTime()) {
        return 'Today';
      } else if (dateOnly.getTime() === tomorrow.getTime()) {
        return 'Tomorrow';
      } else {
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          day: 'numeric',
        });
      }
    } catch {
      return '';
    }
  };

  // Format time for display
  const formatTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  // Loading state
  if (isLoading && visitors.length === 0) {
    return (
      <View style={styles.container}>
        <Row style={styles.header}>
          <Text variant="bodyLarge" weight="semiBold">
            {t('myVisitors', { defaultValue: 'My Visitors' })}
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
      <Ionicons name="people-outline" size={32} color={theme.colors.textTertiary} />
      <Text
        variant="body"
        color={theme.colors.textSecondary}
        align="center"
        style={styles.emptyText}
      >
        {t('noVisitors', { defaultValue: 'No upcoming visitors' })}
      </Text>
      <Button
        title={t('preRegisterVisitor', { defaultValue: 'Pre-register Visitor' })}
        variant="outline"
        size="small"
        onPress={onPreRegister}
        style={styles.preRegisterButton}
      />
    </View>
  );

  // Render a single visitor carousel card
  const renderVisitorCard = (visitor: VisitorPassSummaryDto) => {
    const dateLabel = formatDateLabel(visitor.expectedFrom);
    const timeLabel = formatTime(visitor.expectedFrom);

    return (
      <TouchableOpacity
        key={visitor.id}
        activeOpacity={0.9}
        onPress={() => onVisitorPress(visitor.id)}
        style={styles.cardWrapper}
      >
        <Card style={{ ...styles.visitorCard, width: CARD_WIDTH }}>
          <Row style={styles.cardContent}>
            {/* Left side: Visitor info */}
            <View style={styles.visitorInfo}>
              {/* Name + Status */}
              <Row style={styles.nameRow}>
                <Text variant="bodyLarge" weight="semiBold" numberOfLines={1} style={styles.visitorName}>
                  {visitor.visitorName}
                </Text>
                <Badge
                  label={getStatusLabel(visitor.status)}
                  color={getStatusColor(visitor.status)}
                  size="small"
                />
              </Row>

              {/* Unit info */}
              <Text
                variant="bodySmall"
                color={theme.colors.textSecondary}
                style={styles.unitText}
              >
                {visitor.unitNumber}{visitor.blockName ? `, ${visitor.blockName}` : ''}
              </Text>

              {/* Date + Time */}
              <Row style={styles.timeRow}>
                <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
                <Text variant="caption" color={theme.colors.textSecondary}>
                  {dateLabel}, {timeLabel}
                </Text>
              </Row>

              {/* Access code */}
              {visitor.accessCode && (
                <Row style={styles.accessCodeRow}>
                  <Ionicons name="key-outline" size={14} color={theme.colors.primary} />
                  <Text variant="caption" color={theme.colors.primary} weight="semiBold">
                    {visitor.accessCode}
                  </Text>
                </Row>
              )}
            </View>

            {/* Right side: Avatar */}
            <Avatar
              size="large"
              name={visitor.visitorName}
            />
          </Row>

          {/* Visitor type indicator */}
          <View style={[styles.typeIndicator, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Ionicons name={getVisitorTypeIcon(visitor.visitType)} size={12} color={theme.colors.textSecondary} />
            <Text variant="caption" color={theme.colors.textSecondary}>
              {visitor.visitType}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <Row style={styles.header}>
        <Text variant="bodyLarge" weight="semiBold">
          {t('myVisitors', { defaultValue: 'My Visitors' })}
        </Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text variant="bodySmall" color={theme.colors.primary}>
            {t('viewAll', { defaultValue: 'View All', ns: 'common' })}
          </Text>
        </TouchableOpacity>
      </Row>

      {/* Horizontal Carousel or Empty State */}
      {displayVisitors.length === 0 ? (
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
          {displayVisitors.map(renderVisitorCard)}
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
  preRegisterButton: {
    marginTop: 8,
  },
  // Carousel styles
  carouselContent: {
    paddingHorizontal: 16,
    gap: CARD_GAP,
  },
  cardWrapper: {
    borderRadius: 12,
  },
  visitorCard: {
    borderRadius: 12,
    padding: 14,
    position: 'relative',
  },
  cardContent: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  visitorInfo: {
    flex: 1,
    marginRight: 12,
    gap: 4,
  },
  nameRow: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  visitorName: {
    flex: 1,
  },
  unitText: {
    marginTop: 2,
  },
  timeRow: {
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  accessCodeRow: {
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  typeIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});

export default MyVisitorsSection;
