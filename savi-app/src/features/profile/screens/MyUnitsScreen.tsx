/**
 * MyUnitsScreen
 * 
 * Displays all units linked to the user with lease details and residents.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Card, Row } from '@/shared/components';
import { ProfileStackParamList } from '@/app/navigation/types';
import { getHomeInfo, type UnitInfo } from '@/services/api/profile';
import { useTenantStore } from '@/state/tenantStore';
import { Image } from 'expo-image';

type MyUnitsNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'LinkedUnits'>;

export const MyUnitsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<MyUnitsNavigationProp>();
  const { selectedTenant, currentTenant } = useTenantStore();

  const [units, setUnits] = useState<UnitInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUnits();
  }, [selectedTenant?.tenantId, currentTenant?.id]);

  const loadUnits = async () => {
    const tenantId = selectedTenant?.tenantId || currentTenant?.id;
    if (!tenantId) {
      console.warn('[MyUnitsScreen] ⚠️ No tenant selected, cannot load units.');
      setError('No tenant selected. Please select a community first.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await getHomeInfo();
      setUnits(response.units || []);
      console.log('[MyUnitsScreen] ✅ Units loaded:', {
        unitsCount: response.units?.length || 0,
      });
    } catch (err: any) {
      console.error('[MyUnitsScreen] ❌ Failed to load units:', {
        error: err.message,
      });
      setError(err.message || 'Failed to load units. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const renderUnitCard = (unit: UnitInfo) => (
    <Card key={unit.unitId} style={styles.unitCard}>
      {/* Unit Header */}
      <View style={styles.unitHeader}>
        <View style={styles.unitInfo}>
          <Text variant="h3" weight="bold">
            {unit.unitNumber}
          </Text>
          <Text variant="bodySmall" color={theme.colors.textSecondary}>
            {unit.blockName} • {unit.floorName}
          </Text>
        </View>
        <View style={styles.unitTypeBadge}>
          <Text variant="caption" weight="medium" color={theme.colors.primary}>
            {unit.unitTypeName}
          </Text>
        </View>
      </View>

      {/* Unit Details */}
      <View style={styles.unitDetails}>
        <Row gap={16} align="center" style={styles.detailRow}>
          <Ionicons name="resize-outline" size={16} color={theme.colors.textSecondary} />
          <Text variant="bodySmall" color={theme.colors.textSecondary}>
            {unit.areaSqft.toLocaleString()} sq ft
          </Text>
        </Row>
      </View>

      {/* Lease Information */}
      {unit.lease && (
        <View style={styles.leaseSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={18} color={theme.colors.primary} />
            <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
              Lease Details
            </Text>
          </View>

          <View style={styles.leaseDetails}>
            <View style={styles.leaseRow}>
              <Text variant="bodySmall" color={theme.colors.textSecondary}>
                Status:
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      unit.lease.status === 'Active'
                        ? theme.colors.successLight
                        : theme.colors.errorLight,
                  },
                ]}
              >
                <Text
                  variant="caption"
                  weight="medium"
                  color={
                    unit.lease.status === 'Active'
                      ? theme.colors.success
                      : theme.colors.error
                  }
                >
                  {unit.lease.status}
                </Text>
              </View>
            </View>

            <View style={styles.leaseRow}>
              <Text variant="bodySmall" color={theme.colors.textSecondary}>
                Role:
              </Text>
              <Text variant="bodySmall" weight="medium">
                {unit.lease.role}
                {unit.lease.isPrimary && (
                  <Text variant="bodySmall" color={theme.colors.primary}>
                    {' '}(Primary)
                  </Text>
                )}
              </Text>
            </View>

            <View style={styles.leaseRow}>
              <Text variant="bodySmall" color={theme.colors.textSecondary}>
                Lease Period:
              </Text>
              <Text variant="bodySmall" weight="medium">
                {formatDate(unit.lease.startDate)} - {formatDate(unit.lease.endDate)}
              </Text>
            </View>

            <View style={styles.leaseRow}>
              <Text variant="bodySmall" color={theme.colors.textSecondary}>
                Move In:
              </Text>
              <Text variant="bodySmall" weight="medium">
                {formatDate(unit.lease.moveInDate)}
              </Text>
            </View>

            {unit.lease.moveOutDate && (
              <View style={styles.leaseRow}>
                <Text variant="bodySmall" color={theme.colors.textSecondary}>
                  Move Out:
                </Text>
                <Text variant="bodySmall" weight="medium">
                  {formatDate(unit.lease.moveOutDate)}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Residents Section */}
      {unit.residents && unit.residents.length > 0 && (
        <View style={styles.residentsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={18} color={theme.colors.primary} />
            <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
              Residents ({unit.residents.length})
            </Text>
          </View>

          <View style={styles.residentsList}>
            {unit.residents.map((resident) => (
              <View key={resident.partyId} style={styles.residentItem}>
                <View style={styles.residentAvatar}>
                  {resident.profilePhotoUrl ? (
                    <Image
                      source={{ uri: resident.profilePhotoUrl }}
                      style={styles.avatarImage}
                      contentFit="cover"
                    />
                  ) : (
                    <Text variant="h4" color={theme.colors.primary}>
                      {resident.name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={styles.residentInfo}>
                  <Row gap={8} align="center">
                    <Text variant="body" weight="medium">
                      {resident.name}
                    </Text>
                    {resident.isPrimary && (
                      <View style={styles.primaryBadge}>
                        <Text variant="caption" color={theme.colors.primary}>
                          Primary
                        </Text>
                      </View>
                    )}
                  </Row>
                  <Row gap={8} align="center" style={styles.residentMeta}>
                    <Text variant="caption" color={theme.colors.textSecondary}>
                      {resident.role}
                    </Text>
                    {resident.hasAppAccess && (
                      <View style={styles.appAccessBadge}>
                        <Ionicons name="phone-portrait-outline" size={12} color={theme.colors.success} />
                        <Text variant="caption" color={theme.colors.success}>
                          App Access
                        </Text>
                      </View>
                    )}
                  </Row>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </Card>
  );

  return (
    <Screen safeArea style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="h2">My Units</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="body" color={theme.colors.textSecondary} style={styles.loadingText}>
            Loading units...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text variant="h3" weight="bold" style={styles.errorTitle}>
            Unable to Load Units
          </Text>
          <Text variant="body" color={theme.colors.textSecondary} align="center">
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={loadUnits}
          >
            <Text variant="body" weight="semiBold" color="#fff">
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      ) : units.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="home-outline" size={64} color={theme.colors.textTertiary} />
          <Text variant="h3" weight="bold" style={styles.emptyTitle}>
            No Units Found
          </Text>
          <Text variant="body" color={theme.colors.textSecondary} align="center">
            You don't have any linked units yet.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {units.map(renderUnitCard)}
        </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  unitCard: {
    marginBottom: 16,
    padding: 16,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  unitInfo: {
    flex: 1,
  },
  unitTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  unitDetails: {
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 4,
  },
  leaseSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    flex: 1,
  },
  leaseDetails: {
    gap: 8,
  },
  leaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  residentsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  residentsList: {
    gap: 12,
  },
  residentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  residentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  residentInfo: {
    flex: 1,
  },
  residentMeta: {
    marginTop: 4,
  },
  primaryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#E3F2FD',
  },
  appAccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#E8F5E9',
  },
});

export default MyUnitsScreen;

