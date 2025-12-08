/**
 * SwitchCommunityScreen
 * 
 * Allows users to switch between their tenant memberships (communities).
 * Auto-selects if only one membership exists.
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
import { useAuthStore } from '@/state/authStore';
import { useTenantStore } from '@/state/tenantStore';
import { getAuthMe, type AuthMeResponse } from '@/services/api/auth';
import { getIdToken } from '@/services/firebase/auth';
import { getHomeInfo } from '@/services/api/profile';

type SwitchCommunityNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'SwitchCommunity'
>;

export const SwitchCommunityScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<SwitchCommunityNavigationProp>();
  const { tenantMemberships } = useAuthStore();
  const { selectedTenant, selectTenant } = useTenantStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<AuthMeResponse['tenantMemberships']>([]);

  useEffect(() => {
    loadMemberships();
  }, []);

  useEffect(() => {
    // Auto-select if only one membership and not already selected
    if (memberships.length === 1) {
      const singleMembership = memberships[0];
      // Only auto-select if not already selected or if no tenant is selected
      if (!selectedTenant || selectedTenant.tenantId !== singleMembership.tenantId) {
        console.log('[SwitchCommunityScreen] 🔄 Auto-selecting single tenant:', {
          tenantId: singleMembership.tenantId,
          tenantName: singleMembership.tenantName,
        });
        handleSelectTenant(singleMembership);
      }
    }
  }, [memberships.length, selectedTenant?.tenantId]);

  const loadMemberships = async () => {
    try {
      setIsLoading(true);
      const firebaseToken = await getIdToken();
      const authMeResponse = await getAuthMe(firebaseToken);
      setMemberships(authMeResponse.tenantMemberships);
      
      console.log('[SwitchCommunityScreen] ✅ Loaded tenant memberships:', {
        count: authMeResponse.tenantMemberships.length,
      });
    } catch (err: any) {
      console.error('[SwitchCommunityScreen] ❌ Failed to load memberships:', err);
      // Fallback to stored memberships if API fails
      setMemberships(
        tenantMemberships.map((m) => ({
          tenantId: m.tenantId,
          tenantSlug: m.tenantSlug,
          tenantName: m.tenantName,
          roles: [m.role],
        }))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTenant = async (membership: AuthMeResponse['tenantMemberships'][0]) => {
    // Don't switch if already selected
    if (selectedTenant?.tenantId === membership.tenantId) {
      navigation.goBack();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[SwitchCommunityScreen] 🔄 Switching to tenant:', {
        tenantId: membership.tenantId,
        tenantName: membership.tenantName,
        tenantSlug: membership.tenantSlug,
      });

      // Get Firebase token
      const firebaseToken = await getIdToken();

      // Fetch fresh tenant memberships to get latest data
      const authMeResponse = await getAuthMe(firebaseToken);
      const updatedMembership = authMeResponse.tenantMemberships.find(
        (t) => t.tenantId === membership.tenantId
      );

      if (!updatedMembership) {
        throw new Error('Tenant membership not found');
      }

      // Select tenant first (required for apiClient to add X-Tenant-Id header)
      selectTenant(
        {
          id: updatedMembership.tenantId,
          name: updatedMembership.tenantName,
          slug: updatedMembership.tenantSlug,
        }
      );

      // Try to get unit info from /me/home endpoint
      // This will fail if user hasn't set up profile yet, which is okay
      try {
        const homeInfo = await getHomeInfo();
        if (homeInfo.units && homeInfo.units.length > 0) {
          // Use the first unit (primary unit)
          const primaryUnit = homeInfo.units[0];
          selectTenant(
            {
              id: updatedMembership.tenantId,
              name: updatedMembership.tenantName,
              slug: updatedMembership.tenantSlug,
            },
            {
              id: primaryUnit.unitId,
              name: primaryUnit.unitNumber,
            }
          );
          console.log('[SwitchCommunityScreen] ✅ Unit info loaded:', {
            unitId: primaryUnit.unitId,
            unitNumber: primaryUnit.unitNumber,
          });
        }
      } catch (homeError) {
        console.log('[SwitchCommunityScreen] ⚠️ Could not load unit info (user may not have set up profile yet)');
        // Continue without unit info - tenant is already selected
      }

      console.log('[SwitchCommunityScreen] ✅ Tenant switched successfully');

      // Navigate back
      navigation.goBack();
    } catch (err: any) {
      console.error('[SwitchCommunityScreen] ❌ Failed to switch tenant:', {
        error: err.message,
      });
      setError(err.message || 'Failed to switch community. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Use API memberships if available, otherwise fallback to stored memberships
  const displayMemberships = memberships.length > 0 
    ? memberships 
    : tenantMemberships.map((m) => ({
        tenantId: m.tenantId,
        tenantSlug: m.tenantSlug,
        tenantName: m.tenantName,
        roles: [m.role],
      }));

  if (displayMemberships.length === 0) {
    return (
      <Screen safeArea style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text variant="h2">Switch Community</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="home-outline" size={64} color={theme.colors.textTertiary} />
          <Text variant="h3" weight="bold" style={styles.emptyTitle}>
            No Communities
          </Text>
          <Text variant="body" color={theme.colors.textSecondary} align="center">
            You don't have access to any communities yet.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="h2">Switch Community</Text>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="body" color={theme.colors.textSecondary} style={styles.loadingText}>
            Switching community...
          </Text>
        </View>
      )}

      {error && (
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: theme.colors.errorLight },
          ]}
        >
          <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
          <Text variant="bodySmall" color={theme.colors.error} style={styles.errorText}>
            {error}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Row gap={8} align="center">
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.info} />
            <Text variant="bodySmall" color={theme.colors.textSecondary}>
              Select a community to switch to. You have access to {displayMemberships.length}{' '}
              {displayMemberships.length === 1 ? 'community' : 'communities'}.
            </Text>
          </Row>
        </Card>

        {/* Tenant List */}
        {displayMemberships.map((membership) => {
          const isSelected = selectedTenant?.tenantId === membership.tenantId;
          const role = membership.roles?.[0] || 'RESIDENT';

          return (
            <TouchableOpacity
              key={membership.tenantId}
              onPress={() => handleSelectTenant(membership)}
              disabled={isLoading || isSelected}
              activeOpacity={0.7}
            >
              <Card
                style={[
                  styles.tenantCard,
                  isSelected && { borderColor: theme.colors.primary, borderWidth: 2 },
                ]}
              >
                <Row gap={16} align="center" justify="space-between">
                  <Row gap={16} align="center" style={styles.tenantInfo}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: isSelected ? theme.colors.primaryLight : theme.colors.surfaceVariant },
                      ]}
                    >
                      <Ionicons
                        name="home"
                        size={24}
                        color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                      />
                    </View>
                    <View style={styles.tenantDetails}>
                      <Text variant="bodyLarge" weight="semiBold">
                        {membership.tenantName}
                      </Text>
                      <Row gap={8} align="center" style={styles.tenantMeta}>
                        <View style={[styles.roleBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
                          <Text variant="caption" color={theme.colors.textSecondary}>
                            {role}
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={[styles.selectedBadge, { backgroundColor: theme.colors.primaryLight }]}>
                            <Text variant="caption" weight="medium" color={theme.colors.primary}>
                              Current
                            </Text>
                          </View>
                        )}
                      </Row>
                    </View>
                  </Row>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
                  )}
                </Row>
              </Card>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  loadingOverlay: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  infoCard: {
    marginBottom: 16,
    padding: 12,
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
  tenantCard: {
    marginBottom: 12,
    padding: 16,
  },
  tenantInfo: {
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tenantDetails: {
    flex: 1,
  },
  tenantMeta: {
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  selectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});

export default SwitchCommunityScreen;

