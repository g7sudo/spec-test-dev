/**
 * HouseholdMembersScreen
 * 
 * Displays all household members (residents) across all units.
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
import { getHomeInfo, type ResidentInfo, type UnitInfo } from '@/services/api/profile';
import { useTenantStore } from '@/state/tenantStore';
import { Image } from 'expo-image';

type HouseholdMembersNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'HouseholdMembers'
>;

interface ResidentWithUnit extends ResidentInfo {
  unitNumber: string;
  blockName: string;
}

export const HouseholdMembersScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<HouseholdMembersNavigationProp>();
  const { selectedTenant, currentTenant } = useTenantStore();

  const [residents, setResidents] = useState<ResidentWithUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResidents();
  }, [selectedTenant?.tenantId, currentTenant?.id]);

  const loadResidents = async () => {
    const tenantId = selectedTenant?.tenantId || currentTenant?.id;
    if (!tenantId) {
      console.warn('[HouseholdMembersScreen] ⚠️ No tenant selected, cannot load residents.');
      setError('No tenant selected. Please select a community first.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await getHomeInfo();
      
      // Flatten all residents from all units with unit info
      const allResidents: ResidentWithUnit[] = [];
      (response.units || []).forEach((unit: UnitInfo) => {
        (unit.residents || []).forEach((resident: ResidentInfo) => {
          allResidents.push({
            ...resident,
            unitNumber: unit.unitNumber,
            blockName: unit.blockName,
          });
        });
      });
      
      // Sort: Primary residents first, then by name
      allResidents.sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return a.name.localeCompare(b.name);
      });
      
      setResidents(allResidents);
      console.log('[HouseholdMembersScreen] ✅ Residents loaded:', {
        residentsCount: allResidents.length,
      });
    } catch (err: any) {
      console.error('[HouseholdMembersScreen] ❌ Failed to load residents:', {
        error: err.message,
      });
      setError(err.message || 'Failed to load household members. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderResidentCard = (resident: ResidentWithUnit) => (
    <Card key={`${resident.partyId}-${resident.leasePartyId}`} style={styles.residentCard}>
      <Row gap={16} align="center">
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {resident.profilePhotoUrl ? (
            <Image
              source={{ uri: resident.profilePhotoUrl }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primaryLight }]}>
              <Text variant="h3" color={theme.colors.primary}>
                {resident.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Resident Info */}
        <View style={styles.residentInfo}>
          <Row gap={8} align="center" style={styles.nameRow}>
            <Text variant="bodyLarge" weight="semiBold">
              {resident.name}
            </Text>
            {resident.isPrimary && (
              <View style={[styles.badge, { backgroundColor: theme.colors.primaryLight }]}>
                <Text variant="caption" weight="medium" color={theme.colors.primary}>
                  Primary
                </Text>
              </View>
            )}
          </Row>

          <Row gap={12} align="center" style={styles.metaRow}>
            <Row gap={4} align="center">
              <Ionicons name="home-outline" size={14} color={theme.colors.textSecondary} />
              <Text variant="bodySmall" color={theme.colors.textSecondary}>
                {resident.unitNumber} • {resident.blockName}
              </Text>
            </Row>
          </Row>

          <Row gap={8} align="center" style={styles.roleRow}>
            <View style={[styles.roleBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text variant="caption" color={theme.colors.textSecondary}>
                {resident.role}
              </Text>
            </View>
            {resident.hasAppAccess && (
              <View style={[styles.appBadge, { backgroundColor: theme.colors.successLight }]}>
                <Ionicons name="phone-portrait-outline" size={12} color={theme.colors.success} />
                <Text variant="caption" color={theme.colors.success}>
                  App Access
                </Text>
              </View>
            )}
          </Row>
        </View>
      </Row>
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
        <Text variant="h2">Household Members</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="body" color={theme.colors.textSecondary} style={styles.loadingText}>
            Loading household members...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text variant="h3" weight="bold" style={styles.errorTitle}>
            Unable to Load Members
          </Text>
          <Text variant="body" color={theme.colors.textSecondary} align="center">
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={loadResidents}
          >
            <Text variant="body" weight="semiBold" color="#fff">
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      ) : residents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={theme.colors.textTertiary} />
          <Text variant="h3" weight="bold" style={styles.emptyTitle}>
            No Household Members
          </Text>
          <Text variant="body" color={theme.colors.textSecondary} align="center">
            No household members found.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Card */}
          <Card style={styles.summaryCard}>
            <Row gap={8} align="center">
              <Ionicons name="people" size={24} color={theme.colors.primary} />
              <Text variant="bodyLarge" weight="semiBold">
                {residents.length} {residents.length === 1 ? 'Member' : 'Members'}
              </Text>
            </Row>
            <Text variant="bodySmall" color={theme.colors.textSecondary} style={styles.summaryText}>
              {residents.filter((r) => r.isPrimary).length} Primary{' '}
              {residents.filter((r) => r.hasAppAccess).length} with App Access
            </Text>
          </Card>

          {/* Residents List */}
          {residents.map(renderResidentCard)}
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
  summaryCard: {
    marginBottom: 16,
    padding: 16,
  },
  summaryText: {
    marginTop: 8,
  },
  residentCard: {
    marginBottom: 12,
    padding: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 56,
    height: 56,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  residentInfo: {
    flex: 1,
  },
  nameRow: {
    marginBottom: 4,
  },
  metaRow: {
    marginBottom: 8,
  },
  roleRow: {
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  appBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});

export default HouseholdMembersScreen;

