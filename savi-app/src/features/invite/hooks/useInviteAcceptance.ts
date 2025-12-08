/**
 * useInviteAcceptance Hook
 * 
 * Handles accepting an invite after Firebase authentication.
 * Flow:
 * 1. Accept invite: POST /{tenantCode}/resident-invites/accept
 * 2. Get profile: GET /{tenantCode}/me
 * 3. Update app state and navigate to Main
 * 
 * Should be called after successful sign up or sign in when pendingInvite exists.
 */

import { useState } from 'react';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/navigation/types';
import { usePendingInvite } from '@/core/contexts/PendingInviteContext';
import { acceptInvite, getTenantProfile } from '@/services/api/residentInvite';
import { useAuthStore } from '@/state/authStore';
import { useTenantStore } from '@/state/tenantStore';
import { useAppStore } from '@/state/appStore';
import { useTranslation } from 'react-i18next';

type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Hook to handle invite acceptance after Firebase authentication
 * 
 * @param firebaseToken - Firebase ID token from authenticated user
 * @returns Object with acceptPendingInvite function and loading/error states
 */
export const useInviteAcceptance = () => {
  const navigation = useNavigation<RootNavigationProp>();
  const { pendingInvite, clearPendingInvite } = usePendingInvite();
  const { login } = useAuthStore();
  const { selectTenant } = useTenantStore();
  const { t } = useTranslation('invite');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptPendingInvite = async (firebaseToken: string) => {
    if (!pendingInvite) {
      setError('No pending invite found');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Accept invite (tenant level, auth required)
      // Backend expects: POST /v1/tenant/resident-invites/accept
      // Headers: Authorization, X-Tenant-Code
      // Body: { inviteId, token }
      const acceptResponse = await acceptInvite(
        pendingInvite.inviteId,
        pendingInvite.invitationToken,
        firebaseToken,
        pendingInvite.tenantCode
      );

      if (!acceptResponse.success) {
        throw new Error(acceptResponse.error || t('inviteAcceptError'));
      }

      // Step 2: Get user profile and permissions (tenant level, auth required)
      const profileResponse = await getTenantProfile(
        firebaseToken,
        pendingInvite.tenantCode
      );

      // Step 3: Update app state with profile data
      // Create tenant membership from profile
      const membership = {
        tenantId: pendingInvite.tenantId,
        tenantName: pendingInvite.tenantName,
        tenantSlug: pendingInvite.tenantCode,
        role: profileResponse.role.toLowerCase() as 'resident',
        unitId: profileResponse.leases[0]?.leaseId || '',
        unitName: profileResponse.leases[0]?.unitLabel || pendingInvite.unitLabel,
      };

      // Update auth store with user and membership
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        login(
          currentUser,
          firebaseToken,
          [membership]
        );
      }

      // Select the tenant
      selectTenant(
        {
          id: pendingInvite.tenantId,
          name: pendingInvite.tenantName,
          slug: pendingInvite.tenantCode,
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
      // Handle specific error cases
      let errorMessage = t('inviteAcceptError');
      
      if (err.status === 400) {
        // Bad request - likely expired or already accepted
        if (err.message?.includes('expired')) {
          errorMessage = t('codeExpired');
        } else if (err.message?.includes('already accepted')) {
          errorMessage = t('codeAlreadyAccepted');
        } else if (err.message?.includes('cancelled')) {
          errorMessage = t('codeCancelled');
        } else {
          errorMessage = err.message || errorMessage;
        }
      } else if (err.status === 401) {
        errorMessage = t('inviteAcceptError'); // Auth error - token invalid
      } else if (err.status === 0 || err.message?.includes('Network')) {
        errorMessage = t('networkError');
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      throw err; // Re-throw so caller can handle
    } finally {
      setIsLoading(false);
    }
  };

  return {
    pendingInvite,
    acceptPendingInvite,
    isLoading,
    error,
    clearPendingInvite,
  };
};

