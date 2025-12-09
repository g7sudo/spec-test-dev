/**
 * WelcomeScreen
 * 
 * Welcome screen shown after profile setup (new users) or after login (existing users).
 * Shows welcome message and CTA to go to home.
 */

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Button } from '@/shared/components';
import { AuthStackParamList } from '@/app/navigation/types';
import { useTranslation } from 'react-i18next';
import { getAuthMe, getTenantAuth } from '@/services/api/auth';
import { getUserProfile } from '@/services/api/profile';
import { useAuthStore } from '@/state/authStore';
import { useTenantStore } from '@/state/tenantStore';
import { useAppStore } from '@/state/appStore';
import { CommonActions } from '@react-navigation/native';
import { getIdToken } from '@/services/firebase';

type WelcomeNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
type WelcomeRouteProp = RouteProp<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('invite');
  const navigation = useNavigation<WelcomeNavigationProp>();
  const route = useRoute<WelcomeRouteProp>();
  const { login } = useAuthStore();
  const { selectTenant } = useTenantStore();

  const { firebaseToken } = route.params;

  useEffect(() => {
    // Load user profile and set up auth state
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      console.log('[WelcomeScreen] 📡 Loading user profile...');

      // Get fresh Firebase token
      const currentFirebaseToken = await getIdToken();

      // Get user profile and tenant memberships (platform level)
      const authMeResponse = await getAuthMe(currentFirebaseToken);

      console.log('[WelcomeScreen] ✅ Platform profile loaded:', {
        userId: authMeResponse.userId,
        email: authMeResponse.email,
        displayName: authMeResponse.displayName,
        tenantMembershipsCount: authMeResponse.tenantMemberships.length,
      });

      // Get detailed user profile (tenant level) - requires tenant to be selected first
      let userProfile = null;
      if (authMeResponse.tenantMemberships.length > 0) {
        try {
          // Select tenant first so apiClient can add X-Tenant-Id header
          const tenant = authMeResponse.tenantMemberships[0];
          useTenantStore.getState().selectTenant(
            {
              id: tenant.tenantId,
              name: tenant.tenantName,
              slug: tenant.tenantSlug,
            },
            {
              id: '',
              name: '',
            }
          );

          // Store token in auth store first (apiClient reads from store)
          useAuthStore.getState().setIdToken(currentFirebaseToken);
          
          // Now fetch detailed profile (apiClient will use token from store)
          userProfile = await getUserProfile();
          console.log('[WelcomeScreen] ✅ Tenant profile loaded:', {
            id: userProfile.id,
            communityUserId: userProfile.communityUserId,
            displayName: userProfile.displayName,
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
          });
        } catch (profileError: any) {
          console.warn('[WelcomeScreen] ⚠️ Failed to load tenant profile:', {
            error: profileError.message,
          });
          // Continue without tenant profile - not critical
        }
      }

      // Update auth store
      if (authMeResponse.tenantMemberships.length > 0) {
        const tenant = authMeResponse.tenantMemberships[0];
        const membership = {
          tenantId: tenant.tenantId,
          tenantName: tenant.tenantName,
          tenantSlug: tenant.tenantSlug,
          role: tenant.roles[0]?.toLowerCase() as 'resident' | 'community_admin' | 'property_manager',
          unitId: '',
          unitName: '',
        };

        // Use profile data if available, otherwise use platform data
        const displayName = userProfile?.displayName || 
                           userProfile?.firstName && userProfile?.lastName 
                             ? `${userProfile.firstName} ${userProfile.lastName}`
                             : authMeResponse.displayName || 'User';
        
        const phoneNumber = userProfile?.primaryPhone || authMeResponse.phoneNumber;
        const email = userProfile?.primaryEmail || authMeResponse.email;

        // Use communityUserId from userProfile if available, otherwise fetch from tenantAuth
        let communityUserId: string;
        if (userProfile?.communityUserId) {
          communityUserId = userProfile.communityUserId;
        } else {
          // Fetch tenant auth to get communityUserId
          const tenantAuthData = await getTenantAuth();
          if (!tenantAuthData?.communityUserId) {
            throw new Error('Unable to get community user ID. Please try again.');
          }
          communityUserId = tenantAuthData.communityUserId;
        }

        login(
          {
            userId: communityUserId, // Store communityUserId as userId in authStore
            email: email,
            displayName: displayName,
            photoURL: null,
            emailVerified: true,
          },
          currentFirebaseToken,
          [membership]
        );

        // Tenant already selected above for profile fetch
        if (!userProfile) {
          selectTenant(
            {
              id: tenant.tenantId,
              name: tenant.tenantName,
              slug: tenant.tenantSlug,
            },
            {
              id: '',
              name: '',
            }
          );
        }
      }

      // Set app as ready
      useAppStore.getState().setIsAppReady(true);
    } catch (err: any) {
      console.error('[WelcomeScreen] ❌ Failed to load user profile:', {
        error: err.message,
      });
    }
  };

  const handleGoToHome = () => {
    // Navigate to Main app
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      })
    );
  };

  return (
    <Screen safeArea style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name="checkmark-circle" size={80} color={theme.colors.primary} />
          </View>

          <Text variant="h1" style={styles.title}>
            Welcome!
          </Text>

          <Text
            variant="body"
            color={theme.colors.textSecondary}
            align="center"
            style={styles.message}
          >
            Your account has been set up successfully. You're all set to start using the app!
          </Text>
        </View>

        <View style={styles.footer}>
          <Button
            title="Get Started"
            onPress={handleGoToHome}
            variant="primary"
            style={styles.button}
            fullWidth
          />
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    maxWidth: 300,
    lineHeight: 24,
  },
  footer: {
    paddingBottom: 20,
  },
  button: {
    marginTop: 16,
  },
});

