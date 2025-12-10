/**
 * VisitorListScreen
 * 
 * Main screen for viewing all visitor passes.
 * Displays a list of visitor passes with filters and status badges.
 * Users can tap on a visitor pass to view details.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/core/theme';
import { Screen, Text, Card, Row, Button, Badge, Avatar } from '@/shared/components';
import { ErrorState, EmptyState } from '@/shared/components/feedback';
import { ServicesStackParamList } from '@/app/navigation/types';
import { useMyVisitors } from '../hooks';
import { VisitorPassSummaryDto, VisitorPassStatus, VisitorType } from '@/services/api/visitors';

type NavigationProp = NativeStackNavigationProp<ServicesStackParamList>;

// Filter options for visitor passes
// Order: Today, Pending, Past, All (as per requirement)
type FilterType = 'today' | 'pending' | 'past' | 'all';

const filterOptions: { key: FilterType; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'pending', label: 'Pending' },
  { key: 'past', label: 'Past' },
  { key: 'all', label: 'All' },
];

export const VisitorListScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  // Default to 'today' filter as it's most commonly used
  const [activeFilter, setActiveFilter] = useState<FilterType>('today');
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  // Build filters based on active filter selection
  const filters = useMemo(() => {
    const baseFilters: any = {
      page: 1,
      pageSize: 50,
    };

    // Apply filter-specific filters
    switch (activeFilter) {
      case 'today': {
        // Today: Show visitor passes expected today (any status)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        baseFilters.fromDate = today.toISOString();
        baseFilters.toDate = tomorrow.toISOString();
        break;
      }
      case 'pending': {
        // Pending/Upcoming: Visitors expected in the future (from tomorrow onwards)
        // Shows all upcoming visitors regardless of status
        const tomorrow = new Date();
        tomorrow.setHours(0, 0, 0, 0);
        tomorrow.setDate(tomorrow.getDate() + 1);
        baseFilters.fromDate = tomorrow.toISOString();
        break;
      }
      case 'past': {
        // Past: Visitors who have checked out or expired
        // Filter by toDate < now (past expected dates)
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        baseFilters.toDate = now.toISOString();
        break;
      }
      case 'all':
      default:
        // All: No additional filters - show everything
        break;
    }

    return baseFilters;
  }, [activeFilter]);

  // Fetch visitor passes using React Query hook
  const {
    data: visitorsData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useMyVisitors(filters);

  /**
   * Get status badge color based on visitor pass status
   */
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

  /**
   * Get status label for display
   */
  const getStatusLabel = (status: VisitorPassStatus) => {
    switch (status) {
      case VisitorPassStatus.PreRegistered:
        return 'Pre-Registered';
      case VisitorPassStatus.AtGatePendingApproval:
        return 'Pending Approval';
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

  /**
   * Get visitor type icon
   */
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

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  /**
   * Format time for display
   */
  const formatTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  /**
   * Format date for timeline header (user-friendly: "Today", "Tomorrow", "Yesterday", or "01 - NOV")
   */
  const formatTimelineDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);

      // Check if it's today, tomorrow, or yesterday
      if (dateOnly.getTime() === today.getTime()) {
        return 'Today';
      } else if (dateOnly.getTime() === tomorrow.getTime()) {
        return 'Tomorrow';
      } else if (dateOnly.getTime() === yesterday.getTime()) {
        return 'Yesterday';
      } else {
        // For other dates, show "01 - NOV" format
        const day = String(date.getDate()).padStart(2, '0');
        const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        return `${day} - ${month}`;
      }
    } catch {
      return dateString;
    }
  };

  /**
   * Get date key from ISO string (YYYY-MM-DD)
   */
  const getDateKey = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return dateString.split('T')[0];
    }
  };

  /**
   * Group visitors by date and sort based on active filter
   * - All: Sort by expected date descending (newest first)
   * - Others: Today first, then future dates, then past dates
   */
  const groupedVisitors = useMemo(() => {
    if (!visitorsData?.items) return {};

    const grouped: Record<string, VisitorPassSummaryDto[]> = {};

    // Group by date
    visitorsData.items.forEach((visitor) => {
      const dateKey = getDateKey(visitor.expectedFrom);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(visitor);
    });

    // Sort each group by time
    // For 'all' filter: descending (newest first)
    // For others: ascending (earliest first)
    const isDescending = activeFilter === 'all';
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => {
        const timeA = new Date(a.expectedFrom).getTime();
        const timeB = new Date(b.expectedFrom).getTime();
        return isDescending ? timeB - timeA : timeA - timeB;
      });
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = today.toISOString().split('T')[0];

    let sortedDates: string[];

    if (activeFilter === 'all') {
      // All filter: Sort by date descending (newest first)
      sortedDates = Object.keys(grouped).sort((a, b) => {
        const dateA = new Date(a + 'T00:00:00').getTime();
        const dateB = new Date(b + 'T00:00:00').getTime();
        return dateB - dateA; // Descending order
      });
    } else {
      // Other filters: Today first, then future dates (ascending), then past dates (ascending)
      sortedDates = Object.keys(grouped).sort((a, b) => {
        const dateA = new Date(a + 'T00:00:00').getTime();
        const dateB = new Date(b + 'T00:00:00').getTime();
        const todayTime = today.getTime();

        // Today always comes first
        if (a === todayKey) return -1;
        if (b === todayKey) return 1;

        // Both are future or both are past - sort ascending
        if ((dateA >= todayTime && dateB >= todayTime) || (dateA < todayTime && dateB < todayTime)) {
          return dateA - dateB;
        }

        // One is future, one is past - future comes first
        return dateB - dateA;
      });
    }

    // Return sorted object
    const sortedGrouped: Record<string, VisitorPassSummaryDto[]> = {};
    sortedDates.forEach((dateKey) => {
      sortedGrouped[dateKey] = grouped[dateKey];
    });

    return sortedGrouped;
  }, [visitorsData?.items, activeFilter]);

  /**
   * Handle visitor pass press - show access code info
   * Note: Detail screen removed as there's no API endpoint for it
   */
  const handleVisitorPress = useCallback((visitor: VisitorPassSummaryDto) => {
    // Show access code in an alert since there's no detail screen
    Alert.alert(
      'Visitor Pass',
      `Visitor: ${visitor.visitorName}\n\nAccess Code: ${visitor.accessCode}\n\nStatus: ${getStatusLabel(visitor.status)}`,
      [{ text: 'OK' }]
    );
  }, []);

  /**
   * Handle three dots menu press - show options
   */
  const handleMenuPress = useCallback((visitor: VisitorPassSummaryDto, event: any) => {
    event.stopPropagation(); // Prevent card press
    
    const canCancel = visitor.status === VisitorPassStatus.PreRegistered || 
                      visitor.status === VisitorPassStatus.Approved ||
                      visitor.status === VisitorPassStatus.AtGatePendingApproval;

    Alert.alert(
      'Visitor Options',
      `What would you like to do with ${visitor.visitorName}'s pass?`,
      [
        {
          text: 'Share Access Code',
          onPress: () => handleShareAccessCode(visitor),
        },
        ...(canCancel ? [{
          text: 'Cancel Visitor Pass',
          style: 'destructive' as const,
          onPress: () => handleCancelVisitor(visitor),
        }] : []),
        {
          text: 'Close',
          style: 'default' as const,
        },
      ]
    );
  }, []);

  /**
   * Handle share access code via WhatsApp
   */
  const handleShareAccessCode = useCallback((visitor: VisitorPassSummaryDto) => {
    const message = `Hi ${visitor.visitorName},\n\nYour visitor access code is: ${visitor.accessCode}\n\nUnit: ${visitor.unitNumber}${visitor.blockName ? `, ${visitor.blockName}` : ''}\nExpected: ${formatDate(visitor.expectedFrom)} at ${formatTime(visitor.expectedFrom)}\n\nPlease use this code at the gate.`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          // Fallback: copy to clipboard or show share options
          Alert.alert(
            'WhatsApp Not Available',
            `Access Code: ${visitor.accessCode}\n\nPlease share this code manually.`,
            [{ text: 'OK' }]
          );
        }
      })
      .catch((err) => {
        console.error('[VisitorListScreen] ❌ Error opening WhatsApp:', err);
        Alert.alert(
          'Error',
          'Could not open WhatsApp. Please share the access code manually.',
          [{ text: 'OK' }]
        );
      });
  }, []);

  /**
   * Handle cancel visitor pass
   */
  const handleCancelVisitor = useCallback((visitor: VisitorPassSummaryDto) => {
    Alert.alert(
      'Cancel Visitor Pass',
      `Are you sure you want to cancel ${visitor.visitorName}'s visitor pass?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement cancel API call when endpoint is available
            Alert.alert('Coming Soon', 'Cancel visitor pass feature will be available soon.');
          },
        },
      ]
    );
  }, []);

  /**
   * Handle create visitor press - navigate to create screen
   */
  const handleCreateVisitor = useCallback(() => {
    navigation.navigate('CreateVisitor');
  }, [navigation]);

  /**
   * Handle pull to refresh
   */
  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('[VisitorListScreen] ❌ Refresh error:', error);
    }
  }, [refetch]);

  /**
   * Handle copy access code to clipboard
   */
  const handleCopyAccessCode = useCallback(async (accessCode: string, event: any) => {
    event.stopPropagation(); // Prevent card press
    
    try {
      await Clipboard.setStringAsync(accessCode);
      setShowCopiedToast(true);
      
      // Hide toast after 2 seconds
      setTimeout(() => {
        setShowCopiedToast(false);
      }, 2000);
    } catch (error) {
      console.error('[VisitorListScreen] ❌ Failed to copy to clipboard:', error);
      Alert.alert('Error', 'Failed to copy access code to clipboard.');
    }
  }, []);

  /**
   * Render timeline date header (format: "01 - NOV")
   */
  const renderTimelineDateHeader = (dateKey: string) => {
    const dateLabel = formatTimelineDate(dateKey);
    
    return (
      <View style={styles.timelineDateHeader}>
        <Text variant="bodyLarge" weight="bold" color={theme.colors.text}>
          {dateLabel}
        </Text>
        <View style={[styles.timelineDateSeparatorLine, { backgroundColor: theme.colors.border }]} />
      </View>
    );
  };

  /**
   * Render visitor pass card item (same card style, organized in timeline)
   */
  const renderVisitor = ({ item }: { item: VisitorPassSummaryDto }) => (
    <TouchableOpacity
      onPress={() => handleVisitorPress(item)}
      activeOpacity={0.7}
    >
      <Card style={styles.visitorCard}>
        <Row align="center" gap={12}>
          {/* Avatar based on name */}
          <Avatar
            name={item.visitorName}
            size="medium"
            style={styles.visitorAvatar}
          />
          
          <View style={styles.visitorInfo}>
            {/* Top row: Name and Menu */}
            <Row justify="space-between" align="center" style={styles.topRow}>
              <View style={styles.nameContainer}>
                <Text variant="bodyLarge" weight="semiBold" numberOfLines={1}>
                  {item.visitorName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={(e) => handleMenuPress(item, e)}
                style={styles.menuButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </Row>

            {/* Middle row: Access Code */}
            {item.accessCode && (
              <TouchableOpacity
                onPress={(e) => handleCopyAccessCode(item.accessCode, e)}
                activeOpacity={0.7}
                style={styles.accessCodeRow}
              >
                <Row gap={6} align="center">
                  <Ionicons name="key-outline" size={16} color={theme.colors.primary} />
                  <Text variant="caption" color={theme.colors.textSecondary}>
                    Access Code:
                  </Text>
                  <Text variant="body" weight="bold" color={theme.colors.primary} style={styles.accessCode}>
                    {item.accessCode}
                  </Text>
                  <Ionicons name="copy-outline" size={14} color={theme.colors.textTertiary} />
                </Row>
              </TouchableOpacity>
            )}

            {/* Bottom row: Time and Status */}
            <Row gap={12} align="center" style={styles.bottomRow}>
              <Row gap={4} align="center">
                <Ionicons name="time-outline" size={14} color={theme.colors.textTertiary} />
                <Text variant="caption" color={theme.colors.textSecondary} weight="medium">
                  {formatTime(item.expectedFrom)}
                </Text>
              </Row>
              <Badge
                label={getStatusLabel(item.status)}
                color={getStatusColor(item.status)}
                size="small"
              />
            </Row>
          </View>
        </Row>
      </Card>
    </TouchableOpacity>
  );

  /**
   * Render filter buttons
   */
  const renderFilters = () => (
    <View style={styles.filterContainer}>
      {filterOptions.map((filter) => (
        <TouchableOpacity
          key={filter.key}
          onPress={() => setActiveFilter(filter.key)}
          style={[
            styles.filterButton,
            {
              backgroundColor:
                activeFilter === filter.key
                  ? theme.colors.primary
                  : theme.colors.surfaceVariant,
            },
          ]}
        >
          <Text
            variant="body"
            weight="semiBold"
            color={
              activeFilter === filter.key
                ? theme.colors.textInverse
                : theme.colors.textSecondary
            }
          >
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Visitors are now grouped by date in groupedVisitors

  // Loading state
  if (isLoading && !visitorsData) {
    return (
      <Screen safeArea style={styles.screen}>
        <View style={styles.header}>
          <Row justify="space-between" align="center">
            <Row gap={8} align="center">
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text variant="h2">Visitors</Text>
            </Row>
            <TouchableOpacity
              onPress={handleCreateVisitor}
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            >
              <Ionicons name="add" size={24} color={theme.colors.textInverse} />
            </TouchableOpacity>
          </Row>
          {renderFilters()}
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            variant="body"
            color={theme.colors.textSecondary}
            style={styles.loadingText}
          >
            Loading visitors...
          </Text>
        </View>
      </Screen>
    );
  }

  // Error state
  if (isError) {
    return (
      <Screen safeArea style={styles.screen}>
        <View style={styles.header}>
          <Row justify="space-between" align="center">
            <Row gap={8} align="center">
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text variant="h2">Visitors</Text>
            </Row>
            <TouchableOpacity
              onPress={handleCreateVisitor}
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            >
              <Ionicons name="add" size={24} color={theme.colors.textInverse} />
            </TouchableOpacity>
          </Row>
          {renderFilters()}
        </View>
        <ErrorState
          title="Unable to Load Visitors"
          message={error?.message || 'Something went wrong. Please try again.'}
          onRetry={() => refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen safeArea style={styles.screen}>
      <View style={styles.header}>
        <Row justify="space-between" align="center">
          <Row gap={8} align="center">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text variant="h2">Visitors</Text>
          </Row>
          <TouchableOpacity
            onPress={handleCreateVisitor}
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          >
            <Ionicons name="add" size={24} color={theme.colors.textInverse} />
          </TouchableOpacity>
        </Row>
        {renderFilters()}
      </View>
      <FlatList
        data={Object.entries(groupedVisitors)}
        renderItem={({ item: [dateKey, visitors], index: dateIndex }) => {
          return (
            <View style={styles.timelineSection}>
              {/* Date header with separator below */}
              {renderTimelineDateHeader(dateKey)}
              
              {/* Visitor cards below the date */}
              <View style={styles.timelineVisitorsList}>
                {visitors.map((visitor, visitorIndex) => (
                  <View key={visitor.id} style={visitorIndex < visitors.length - 1 ? styles.visitorCardWrapper : undefined}>
                    {renderVisitor({ item: visitor })}
                  </View>
                ))}
              </View>
            </View>
          );
        }}
        keyExtractor={([dateKey]) => dateKey}
        contentContainerStyle={
          Object.keys(groupedVisitors).length === 0 ? styles.emptyListContent : styles.listContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No Visitors Found"
            message="You don't have any visitor passes yet. Create one to get started."
            icon="people-outline"
            action={
              <Button
                title="Add Visitor"
                onPress={handleCreateVisitor}
                variant="primary"
                size="medium"
              />
            }
          />
        }
      />
      {/* Copied Toast */}
      {showCopiedToast && (
        <View style={[styles.toast, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
          <Text variant="bodySmall" weight="medium" color={theme.colors.text} style={styles.toastText}>
            Copied
          </Text>
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    minHeight: 44, // Ensure minimum touch target size
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  timelineSection: {
    marginBottom: 24,
  },
  timelineDateHeader: {
    paddingTop: 4,
    marginBottom: 12,
  },
  timelineDateSeparatorLine: {
    height: 1,
    width: '100%',
    marginTop: 8,
  },
  timelineVisitorsList: {
    marginTop: 8,
  },
  visitorCardWrapper: {
    marginBottom: 12,
  },
  visitorCard: {
    padding: 14,
  },
  visitorAvatar: {
    flexShrink: 0,
  },
  visitorInfo: {
    flex: 1,
    gap: 6,
  },
  topRow: {
    marginBottom: 4,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  menuButton: {
    padding: 4,
  },
  accessCodeRow: {
    marginTop: 2,
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginHorizontal: -4,
    borderRadius: 6,
  },
  accessCode: {
    letterSpacing: 1.5,
  },
  bottomRow: {
    marginTop: 4,
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    marginLeft: -60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  toastText: {
    marginLeft: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});

export default VisitorListScreen;
