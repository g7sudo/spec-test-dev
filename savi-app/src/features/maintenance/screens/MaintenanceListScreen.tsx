/**
 * MaintenanceListScreen
 * 
 * Displays the user's maintenance requests with filtering capabilities.
 * Uses React Query for data fetching and caching.
 * 
 * Features:
 * - List all user's maintenance requests
 * - Status-based filtering
 * - Pull-to-refresh
 * - Navigate to detail/create screens
 */

import React, { useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';
import { Screen, Text, Card, Row, StatusPill, Button } from '@/shared/components';
import { ErrorState, EmptyState } from '@/shared/components/feedback';
import { useMyMaintenanceRequests } from '../hooks';
import { 
  MaintenanceRequestSummaryDto, 
  MaintenanceStatus,
  getMaintenanceStatusVariant,
  getMaintenanceStatusLabel,
} from '../types';

type NavigationProp = NativeStackNavigationProp<any>;

// ============================================================================
// STATUS FILTER TABS
// ============================================================================

/**
 * Status filter options for the tabs
 */
const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: MaintenanceStatus.New, label: 'New' },
  { key: MaintenanceStatus.InProgress, label: 'In Progress' },
  { key: MaintenanceStatus.Completed, label: 'Completed' },
] as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MaintenanceListScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('maintenance');
  const navigation = useNavigation<NavigationProp>();

  // Local state for status filter
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch maintenance requests with optional status filter
  const { 
    data, 
    isLoading, 
    error, 
    refetch, 
    isRefetching 
  } = useMyMaintenanceRequests(
    statusFilter === 'all' 
      ? undefined 
      : { status: statusFilter as MaintenanceStatus }
  );

  // Navigation handlers
  const handleCreateRequest = useCallback(() => {
    navigation.navigate('CreateMaintenance');
  }, [navigation]);

  const handleRequestPress = useCallback((requestId: string) => {
    navigation.navigate('MaintenanceDetail', { requestId });
  }, [navigation]);

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Render individual request card
  const renderRequest = ({ item }: { item: MaintenanceRequestSummaryDto }) => (
    <TouchableOpacity
      onPress={() => handleRequestPress(item.id)}
      activeOpacity={0.7}
    >
      <Card style={styles.requestCard}>
        {/* Top row: Title, Ticket Number and Status */}
        <Row style={styles.topRow}>
          <View style={styles.titleContainer}>
            <Text variant="bodyLarge" weight="semiBold" numberOfLines={1}>
              {item.title}
            </Text>
            <Text variant="caption" color={theme.colors.textSecondary}>
              {item.ticketNumber} • {formatDate(item.requestedAt)}
            </Text>
          </View>
          <StatusPill
            label={getMaintenanceStatusLabel(item.status)}
            variant={getMaintenanceStatusVariant(item.status)}
            size="small"
          />
        </Row>

        {/* Bottom row: Category and Priority */}
        <Row style={styles.bottomRow}>
          <Row style={styles.categoryRow}>
            <Text variant="bodySmall" color={theme.colors.primary}>
              {item.categoryName}
            </Text>
            {item.priority !== 'Normal' && (
              <View 
                style={[
                  styles.priorityBadge, 
                  { 
                    backgroundColor: item.priority === 'Critical' 
                      ? '#DC3545' 
                      : item.priority === 'High' 
                        ? '#FFC107' 
                        : '#6C757D' 
                  }
                ]}
              >
                <Text variant="caption" color="#FFFFFF" weight="semiBold">
                  {item.priority}
                </Text>
              </View>
            )}
          </Row>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textSecondary}
          />
        </Row>

        {/* Assigned technician (if any) */}
        {item.assignedToUserName && (
          <Row style={styles.assignedRow}>
            <Ionicons
              name="person-outline"
              size={14}
              color={theme.colors.textSecondary}
            />
            <Text variant="caption" color={theme.colors.textSecondary}>
              {item.assignedToUserName}
            </Text>
          </Row>
        )}
      </Card>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmpty = () => (
    <EmptyState
      icon="construct-outline"
      title={t('noRequests')}
      message={t('noRequestsDescription')}
      actionLabel={t('createRequest')}
      onAction={handleCreateRequest}
    />
  );

  // Render status filter tabs
  const renderStatusTabs = () => (
    <View style={styles.filterContainer}>
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setStatusFilter(item.key)}
            style={[
              styles.filterTab,
              statusFilter === item.key && {
                backgroundColor: theme.colors.primary,
              },
              statusFilter !== item.key && {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <Text
              variant="bodySmall"
              weight="medium"
              color={
                statusFilter === item.key 
                  ? '#FFFFFF' 
                  : theme.colors.textSecondary
              }
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  // Handle error state
  if (error && !isRefetching) {
    return (
      <Screen safeArea style={styles.screen}>
        <View style={styles.header}>
          <Text variant="h2">{t('myRequests')}</Text>
        </View>
        <ErrorState
          message={error.message || 'Failed to load maintenance requests'}
          onRetry={refetch}
        />
      </Screen>
    );
  }

  return (
    <Screen safeArea style={styles.screen}>
      {/* Header with title and add button */}
      <View style={styles.header}>
        <Text variant="h2">{t('myRequests')}</Text>
        <TouchableOpacity onPress={handleCreateRequest}>
          <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Status filter tabs */}
      {renderStatusTabs()}

      {/* Loading state for initial load */}
      {isLoading && !data ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text 
            variant="body" 
            color={theme.colors.textSecondary}
            style={styles.loadingText}
          >
            Loading requests...
          </Text>
        </View>
      ) : (
        <FlatList
          data={data?.items || []}
          renderItem={renderRequest}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            (!data?.items?.length) && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </Screen>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  requestCard: {
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  bottomRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryRow: {
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  assignedRow: {
    marginTop: 8,
    gap: 6,
    alignItems: 'center',
  },
});

export default MaintenanceListScreen;
