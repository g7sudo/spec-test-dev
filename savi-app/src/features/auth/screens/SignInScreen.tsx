import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Button, TextInput, Row } from '@/shared/components';
import { AuthStackParamList, RootStackParamList } from '@/app/navigation/types';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTenantStore } from '@/state/tenantStore';
import { useAppStore } from '@/state/appStore';
import { useAuthStore } from '@/state/authStore';
import { useTranslation } from 'react-i18next';
import { usePendingInvite } from '@/core/contexts/PendingInviteContext';
import { useInviteAcceptance } from '@/features/invite/hooks/useInviteAcceptance';
import { useRoute, RouteProp } from '@react-navigation/native';
import { signInWithEmail, getIdToken } from '@/services/firebase/auth';
import { initializeFirebase } from '@/services/firebase';
import { getAuthMe, getTenantAuth } from '@/services/api/auth';

type SignInRouteProp = RouteProp<AuthStackParamList, 'SignIn'>;
type SignInNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export const SignInScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('auth');
  const navigation = useNavigation<SignInNavigationProp>();
  const authNavigation = useNavigation<AuthNavigationProp>();
  const route = useRoute<SignInRouteProp>();
  const { login } = useAuthStore();
  const { pendingInvite } = usePendingInvite();
  const { acceptPendingInvite, isLoading: isAcceptingInvite } = useInviteAcceptance();

  // Pre-fill email from route params or pending invite
  const preFilledEmail = route.params?.email || pendingInvite?.email || '';

  const [email, setEmail] = useState(preFilledEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update email if route param changes
  React.useEffect(() => {
    if (preFilledEmail && !email) {
      setEmail(preFilledEmail);
    }
  }, [preFilledEmail]);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const canSubmit = email.length > 0 && password.length >= 6 && isValidEmail(email);

  const handleSignIn = async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);

    try {
      // Initialize Firebase if not already initialized
      initializeFirebase();

      // Sign in with Firebase
      const user = await signInWithEmail(email, password);
      
      // Get Firebase ID token
      const firebaseToken = await getIdToken();

      // If there's a pending invite, accept it after Firebase auth
      if (pendingInvite) {
        try {
          await acceptPendingInvite(firebaseToken);
          // Navigation handled by useInviteAcceptance hook
          return;
        } catch (inviteError: any) {
          setError(inviteError.message || t('inviteAcceptError', { ns: 'invite' }));
          return;
        }
      }

      // No pending invite - normal sign in flow
      // Get user profile and tenant memberships from backend
      const authMeResponse = await getAuthMe(firebaseToken);
      
      console.log('[SignInScreen] ✅ User profile loaded:', {
        userId: authMeResponse.userId,
        email: authMeResponse.email,
        displayName: authMeResponse.displayName,
        tenantMembershipsCount: authMeResponse.tenantMemberships.length,
      });

      // Create memberships from tenant memberships
      // Will be updated with unit info after tenant auth call
      const memberships = authMeResponse.tenantMemberships.map((tenant) => ({
        tenantId: tenant.tenantId,
        tenantName: tenant.tenantName,
        tenantSlug: tenant.tenantSlug,
        role: tenant.roles[0]?.toLowerCase() as 'resident' | 'community_admin' | 'property_manager',
        unitId: '',
        unitName: '',
      }));

      // Get tenant auth data if tenant memberships exist
      let tenantAuthData = null;
      let selectedUnitId = '';
      let selectedUnitLabel = '';
      
      if (memberships.length > 0) {
        try {
          // Select first tenant so apiClient can add X-Tenant-Id header
          const firstTenant = authMeResponse.tenantMemberships[0];
          
          // Store token in auth store first (apiClient reads from store)
          useAuthStore.getState().setIdToken(firebaseToken);
          
          // Set tenant in store so apiClient can add X-Tenant-Id header
          useTenantStore.getState().setCurrentTenant({
            id: firstTenant.tenantId,
            name: firstTenant.tenantName,
            slug: firstTenant.tenantSlug,
          });
          
          // Fetch tenant auth data (apiClient will use token and tenant from store)
          tenantAuthData = await getTenantAuth();
          
          console.log('[SignInScreen] ✅ Tenant auth data loaded:', {
            userId: tenantAuthData.userId, // Platform-level (NOT used)
            tenantUserId: tenantAuthData.tenantUserId,
            communityUserId: tenantAuthData.communityUserId, // Will be stored as userId in authStore
            tenantId: tenantAuthData.tenant.tenantId,
            tenantCode: tenantAuthData.tenant.tenantCode,
            leasesCount: tenantAuthData.leases?.length || 0,
          });
          
          // Extract unit from leases (use primary lease or first lease)
          const primaryLease = tenantAuthData.leases.find(lease => lease.isPrimary);
          const selectedLease = primaryLease || tenantAuthData.leases[0];
          
          if (selectedLease) {
            selectedUnitId = selectedLease.unitId;
            selectedUnitLabel = selectedLease.unitLabel;
            
            console.log('[SignInScreen] ✅ Unit selected from lease:', {
              unitId: selectedUnitId,
              unitLabel: selectedUnitLabel,
              isPrimary: selectedLease.isPrimary,
              role: selectedLease.role,
            });
            
            // Set current unit in tenant store (persisted to AsyncStorage)
            useTenantStore.getState().setCurrentUnit({
              id: selectedUnitId,
              unitNumber: selectedUnitLabel,
            });
            
            console.log('[SignInScreen] 💾 Unit stored in tenant store:', {
              unitId: selectedUnitId,
              unitNumber: selectedUnitLabel,
              storeState: useTenantStore.getState().currentUnit,
            });
          }
        } catch (tenantAuthError: any) {
          console.warn('[SignInScreen] ⚠️ Failed to load tenant auth data:', {
            error: tenantAuthError.message,
            status: tenantAuthError.response?.status,
          });
          // Continue with login even if tenant auth fetch fails
        }
      }

      // Use tenant auth data if available, otherwise use platform data
      const displayName = tenantAuthData?.displayName || 
                         authMeResponse.displayName || 
                         user.displayName || 
                         email.split('@')[0];
      
      const phoneNumber = tenantAuthData?.phoneNumber || authMeResponse.phoneNumber;
      const userEmail = tenantAuthData?.email || authMeResponse.email || user.email || email;

      // Update memberships with unit info from tenant auth if available
      if (tenantAuthData && memberships.length > 0) {
        const firstMembership = memberships[0];
        firstMembership.unitId = selectedUnitId;
        firstMembership.unitName = selectedUnitLabel;
      }

      // ALWAYS use communityUserId from tenantAuthData (tenant-level)
      // NEVER use platform-level userId from authMeResponse
      if (!tenantAuthData?.communityUserId) {
        throw new Error('Unable to get community user ID. Please try again.');
      }
      
      const communityUserId = tenantAuthData.communityUserId;
      
      login(
        {
          userId: communityUserId, // Store communityUserId as userId in authStore
          email: userEmail,
          displayName: displayName,
          photoURL: null,
          emailVerified: true,
        },
        firebaseToken,
        memberships
      );
      
      console.log('[SignInScreen] 💾 Login data stored:', {
        userId: communityUserId, // This is communityUserId stored as userId
        email: userEmail,
        displayName: displayName,
        membershipsCount: memberships.length,
        unitId: selectedUnitId,
        unitLabel: selectedUnitLabel,
      });

      // Auto-select tenant if only one membership (already selected above if fetching tenant auth)
      if (memberships.length === 1 && !tenantAuthData) {
        const membership = memberships[0];
        useTenantStore.getState().setCurrentTenant({
          id: membership.tenantId,
          name: membership.tenantName,
          slug: membership.tenantSlug,
        });
      }

      // Set app as ready and navigate to Main
      useAppStore.getState().setIsAppReady(true);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    } catch (err: any) {
      setError(err.message || t('signInError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // TODO: Navigate to forgot password screen
    console.log('Forgot password');
  };

  return (
    <Screen safeArea style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View
              style={[
                styles.logoContainer,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text variant="h1" color={theme.colors.textInverse} weight="bold">
                S
              </Text>
            </View>
            <Text variant="h2" style={styles.title}>
              {t('welcomeBack')}
            </Text>
            <Text
              variant="body"
              color={theme.colors.textSecondary}
              align="center"
            >
              {t('signInSubtitle')}
            </Text>
          </View>

          {error && (
            <View
              style={[
                styles.errorContainer,
                { backgroundColor: theme.colors.errorLight },
              ]}
            >
              <Ionicons
                name="alert-circle"
                size={20}
                color={theme.colors.error}
              />
              <Text
                variant="bodySmall"
                color={theme.colors.error}
                style={styles.errorText}
              >
                {error}
              </Text>
            </View>
          )}

          <View style={styles.form}>
            <TextInput
              label={t('email')}
              placeholder={t('emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
            />

            <TextInput
              label={t('password')}
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotPassword}
            >
              <Text variant="bodySmall" color={theme.colors.primary}>
                {t('forgotPassword')}
              </Text>
            </TouchableOpacity>

            <Button
              title={t('signIn')}
              variant="primary"
              size="large"
              fullWidth
              loading={isLoading}
              disabled={!canSubmit}
              onPress={handleSignIn}
              style={styles.signInButton}
            />
          </View>

          <View style={styles.joinCommunitySection}>
            <Button
              title={t('joinCommunity', { ns: 'invite' })}
              variant="outline"
              size="medium"
              fullWidth
              onPress={() => authNavigation.navigate('JoinCommunity')}
              style={styles.joinCommunityButton}
            />
          </View>

          <Row style={styles.signUpRow}>
            <Text variant="body" color={theme.colors.textSecondary}>
              {t('dontHaveAccount')}
            </Text>
            <TouchableOpacity onPress={() => {}}>
              <Text
                variant="body"
                color={theme.colors.primary}
                weight="semiBold"
                style={styles.signUpLink}
              >
                {t('signUp')}
              </Text>
            </TouchableOpacity>
          </Row>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    marginLeft: 8,
    flex: 1,
  },
  form: {
    gap: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  signInButton: {
    marginTop: 8,
  },
  joinCommunitySection: {
    marginTop: 24,
    marginBottom: 8,
  },
  joinCommunityButton: {
    marginBottom: 8,
  },
  signUpRow: {
    justifyContent: 'center',
    marginTop: 24,
  },
  signUpLink: {
    marginLeft: 4,
  },
});

export default SignInScreen;
