/**
 * TenantSelectionScreen
 * 
 * Screen for selecting a tenant after Firebase authentication.
 * Shows list of tenant memberships from /v1/platform/auth/me response.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text } from '@/shared/components';
import { AuthStackParamList } from '@/app/navigation/types';
import { useTranslation } from 'react-i18next';
import { getAuthMe, getTenantAuth, type AuthMeResponse } from '@/services/api/auth';
import { usePendingInvite } from '@/core/contexts/PendingInviteContext';
import { acceptInvite } from '@/services/api/residentInvite';
import { getIdToken } from '@/services/firebase';
import { useAuthStore } from '@/state/authStore';
import { useTenantStore } from '@/state/tenantStore';
import { useAppStore } from '@/state/appStore';
import { CommonActions } from '@react-navigation/native';

type TenantSelectionNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'TenantSelection'>;
type TenantSelectionRouteProp = RouteProp<AuthStackParamList, 'TenantSelection'>;

export const TenantSelectionScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('invite');
  const navigation = useNavigation<TenantSelectionNavigationProp>();
  const route = useRoute<TenantSelectionRouteProp>();
  const { pendingInvite, clearPendingInvite } = usePendingInvite();
  const { login } = useAuthStore();
  const { selectTenant } = useTenantStore();

  const [tenantMemberships, setTenantMemberships] = useState<AuthMeResponse['tenantMemberships']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const { firebaseToken } = route.params;

  useEffect(() => {
    loadTenantMemberships();
  }, []);

  const loadTenantMemberships = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[TenantSelectionScreen] 📡 Loading tenant memberships...');

      // Call /v1/platform/auth/me to get tenant memberships
      const authMeResponse = await getAuthMe(firebaseToken);
      
      console.log('[TenantSelectionScreen] ✅ Tenant memberships loaded:', {
        count: authMeResponse.tenantMemberships.length,
        tenants: authMeResponse.tenantMemberships.map(t => ({
          tenantId: t.tenantId,
          tenantName: t.tenantName,
          tenantSlug: t.tenantSlug,
        })),
      });

      setTenantMemberships(authMeResponse.tenantMemberships);

      // If only one tenant, auto-select it
      if (authMeResponse.tenantMemberships.length === 1) {
        handleSelectTenant(authMeResponse.tenantMemberships[0]);
      }
    } catch (err: any) {
      console.error('[TenantSelectionScreen] ❌ Failed to load tenant memberships:', {
        error: err.message,
      });
      setError(err.message || 'Failed to load communities. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTenant = async (tenant: AuthMeResponse['tenantMemberships'][0]) => {
    if (!pendingInvite) {
      setError('No pending invite found');
      return;
    }

    try {
      setSelectedTenantId(tenant.tenantId);
      setError(null);

      console.log('[TenantSelectionScreen] 🎯 Selected tenant:', {
        tenantId: tenant.tenantId,
        tenantName: tenant.tenantName,
        tenantSlug: tenant.tenantSlug,
      });

      // Get fresh Firebase token
      const currentFirebaseToken = await getIdToken();

      // Accept invite with selected tenant
      // Note: We need tenantCode (tenantSlug) for the accept call
      // If tenantCode is empty in pendingInvite, use tenantSlug from selected tenant
      const tenantCodeToUse = pendingInvite.tenantCode || tenant.tenantSlug;

      if (!tenantCodeToUse) {
        throw new Error('Tenant code is required but not available');
      }

      console.log('[TenantSelectionScreen] 📝 Accepting invite...', {
        inviteId: pendingInvite.inviteId,
        tenantCode: tenantCodeToUse,
        tenantId: tenant.tenantId,
      });

      const acceptResponse = await acceptInvite(
        pendingInvite.inviteId,
        pendingInvite.invitationToken,
        currentFirebaseToken,
        tenantCodeToUse
      );

      if (!acceptResponse.success) {
        throw new Error(acceptResponse.error || 'Failed to accept invite');
      }

      console.log('[TenantSelectionScreen] ✅ Invite accepted successfully');

      // Update auth store with user and membership
      const authMeResponse = await getAuthMe(currentFirebaseToken);
      
      // Create membership from selected tenant
      const membership = {
        tenantId: tenant.tenantId,
        tenantName: tenant.tenantName,
        tenantSlug: tenant.tenantSlug,
        role: tenant.roles[0]?.toLowerCase() as 'resident' | 'community_admin' | 'property_manager',
        unitId: pendingInvite.unitLabel || '',
        unitName: pendingInvite.unitLabel || '',
      };

      // Fetch tenant auth to get communityUserId (tenant-level, not platform-level)
      const tenantAuthData = await getTenantAuth();
      if (!tenantAuthData?.communityUserId) {
        throw new Error('Unable to get community user ID. Please try again.');
      }
      const communityUserId = tenantAuthData.communityUserId;

      // Update auth store
      login(
        {
          userId: communityUserId, // Store communityUserId as userId in authStore
          email: authMeResponse.email,
          displayName: authMeResponse.displayName,
          photoURL: null,
          emailVerified: true,
        },
        currentFirebaseToken,
        [membership]
      );

      // Select the tenant
      selectTenant(
        {
          id: tenant.tenantId,
          name: tenant.tenantName,
          slug: tenant.tenantSlug,
        },
        {
          id: membership.unitId,
          name: membership.unitName,
        }
      );

      // Clear pending invite
      clearPendingInvite();

      // Set app as ready and navigate to Main
      useAppStore.getState().setIsAppReady(true);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    } catch (err: any) {
      console.error('[TenantSelectionScreen] ❌ Failed to accept invite:', {
        error: err.message,
        tenantId: tenant.tenantId,
      });
      setError(err.message || 'Failed to join community. Please try again.');
      setSelectedTenantId(null);
    }
  };

  if (isLoading) {
    return (
      <Screen safeArea style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="body" color={theme.colors.textSecondary} style={styles.loadingText}>
            Loading communities...
          </Text>
        </View>
      </Screen>
    );
  }

  if (error && tenantMemberships.length === 0) {
    return (
      <Screen safeArea style={styles.screen}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text variant="h3" style={styles.errorTitle}>
            Error
          </Text>
          <Text variant="body" color={theme.colors.textSecondary} style={styles.errorMessage}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={loadTenantMemberships}
          >
            <Text variant="button" color={theme.colors.textInverse}>
              Retry
            </Text>
          </TouchableOpacity>
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
        <Text variant="h2" style={styles.title}>
          Select Community
        </Text>
        <Text
          variant="body"
          color={theme.colors.textSecondary}
          align="center"
          style={styles.subtitle}
        >
          Choose the community you want to join
        </Text>
      </View>

      {error && (
        <View
          style={[
            styles.errorBanner,
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
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {tenantMemberships.map((tenant) => (
          <TouchableOpacity
            key={tenant.tenantId}
            style={[
              styles.tenantCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: selectedTenantId === tenant.tenantId
                  ? theme.colors.primary
                  : theme.colors.border,
              },
            ]}
            onPress={() => handleSelectTenant(tenant)}
            disabled={selectedTenantId === tenant.tenantId}
          >
            <View style={styles.tenantContent}>
              <Ionicons
                name="business"
                size={32}
                color={theme.colors.primary}
                style={styles.tenantIcon}
              />
              <View style={styles.tenantInfo}>
                <Text variant="h3" style={styles.tenantName}>
                  {tenant.tenantName}
                </Text>
                {tenant.roles.length > 0 && (
                  <Text variant="bodySmall" color={theme.colors.textSecondary}>
                    {tenant.roles.join(', ')}
                  </Text>
                )}
              </View>
              {selectedTenantId === tenant.tenantId && (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  errorTitle: {
    marginTop: 8,
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  tenantCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  tenantContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tenantIcon: {
    marginRight: 8,
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    marginBottom: 4,
  },
});

