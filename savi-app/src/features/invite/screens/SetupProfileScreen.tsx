/**
 * SetupProfileScreen
 * 
 * Screen for setting up user profile after accepting invite (new users only).
 * User enters firstName, lastName, dateOfBirth, phoneNumber.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Button, TextInput } from '@/shared/components';
import { AuthStackParamList } from '@/app/navigation/types';
import { useTranslation } from 'react-i18next';
import { updateProfile, getUserProfile } from '@/services/api/profile';
import { useIsApiLoading } from '@/state/apiLoadingStore';
import { getAuthMe } from '@/services/api/auth';
import { useAuthStore } from '@/state/authStore';
import { useTenantStore } from '@/state/tenantStore';
import { useAppStore } from '@/state/appStore';
import { CommonActions } from '@react-navigation/native';
import { getIdToken } from '@/services/firebase';

type SetupProfileNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SetupProfile'>;
type SetupProfileRouteProp = RouteProp<AuthStackParamList, 'SetupProfile'>;

export const SetupProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('invite');
  const navigation = useNavigation<SetupProfileNavigationProp>();
  const route = useRoute<SetupProfileRouteProp>();
  const isApiLoading = useIsApiLoading();
  const { login } = useAuthStore();
  const { selectTenant } = useTenantStore();

  const { firebaseToken, tenantId, email } = route.params;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canSubmit = firstName.trim() !== '' && lastName.trim() !== '' && dateOfBirth.trim() !== '' && phoneNumber.trim() !== '';

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      setError('Date of birth must be in YYYY-MM-DD format');
      return;
    }

    setError(null);

    try {
      console.log('[SetupProfileScreen] 📝 Updating profile...', {
        firstName,
        lastName,
        dateOfBirth,
        phoneNumber,
        email,
        tenantId,
      });

      // Get fresh Firebase token
      const currentFirebaseToken = await getIdToken();

      // Update profile
      await updateProfile(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth: dateOfBirth.trim(),
          phoneNumber: phoneNumber.trim(),
          email: email.trim(),
        },
        currentFirebaseToken,
        tenantId
      );

      console.log('[SetupProfileScreen] ✅ Profile updated successfully');

      // Get updated user profile (platform level)
      const authMeResponse = await getAuthMe(currentFirebaseToken);

      // Get detailed user profile (tenant level)
      let userProfile = null;
      if (authMeResponse.tenantMemberships.length > 0) {
        const tenant = authMeResponse.tenantMemberships[0];
        
        // Select tenant first so apiClient can add X-Tenant-Id header
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

        // Store token in auth store first (apiClient reads from store)
        useAuthStore.getState().setIdToken(currentFirebaseToken);
        
        // Fetch detailed profile (apiClient will use token from store)
        try {
          userProfile = await getUserProfile();
          console.log('[SetupProfileScreen] ✅ Tenant profile loaded:', {
            id: userProfile.id,
            displayName: userProfile.displayName,
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
          });
        } catch (profileError: any) {
          console.warn('[SetupProfileScreen] ⚠️ Failed to load tenant profile:', {
            error: profileError.message,
          });
          // Continue without tenant profile - not critical
        }

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
                             : `${firstName} ${lastName}`;
        
        const userPhoneNumber = userProfile?.primaryPhone || phoneNumber;
        const userEmail = userProfile?.primaryEmail || authMeResponse.email;

        login(
          {
            id: authMeResponse.userId,
            email: userEmail,
            displayName: displayName,
            phoneNumber: userPhoneNumber,
          },
          currentFirebaseToken,
          [membership]
        );
      }

      // Navigate to welcome screen
      navigation.navigate('Welcome', {
        firebaseToken: currentFirebaseToken,
      });
    } catch (err: any) {
      console.error('[SetupProfileScreen] ❌ Profile update error:', {
        error: err.message,
      });
      setError(err.message || 'Failed to update profile. Please try again.');
    }
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
            <View style={styles.iconContainer}>
              <Ionicons name="person-add" size={48} color={theme.colors.primary} />
            </View>
            <Text variant="h2" style={styles.title}>
              Complete Your Profile
            </Text>
            <Text
              variant="body"
              color={theme.colors.textSecondary}
              align="center"
              style={styles.subtitle}
            >
              Tell us a bit about yourself
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
              label="First Name"
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                setError(null);
              }}
              placeholder="Enter your first name"
              autoCapitalize="words"
              editable={!isApiLoading}
              style={styles.input}
            />

            <TextInput
              label="Last Name"
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                setError(null);
              }}
              placeholder="Enter your last name"
              autoCapitalize="words"
              editable={!isApiLoading}
              style={styles.input}
            />

            <TextInput
              label="Date of Birth"
              value={dateOfBirth}
              onChangeText={(text) => {
                setDateOfBirth(text);
                setError(null);
              }}
              placeholder="YYYY-MM-DD"
              keyboardType="numeric"
              editable={!isApiLoading}
              style={styles.input}
            />

            <TextInput
              label="Phone Number"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                setError(null);
              }}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              editable={!isApiLoading}
              style={styles.input}
            />

            <View style={styles.emailContainer}>
              <Text variant="bodySmall" color={theme.colors.textSecondary} style={styles.emailLabel}>
                Email
              </Text>
              <Text variant="body" style={styles.emailValue}>
                {email}
              </Text>
            </View>

            <Button
              title="Continue"
              onPress={handleSubmit}
              disabled={!canSubmit || isApiLoading}
              loading={isApiLoading}
              variant="primary"
              style={styles.submitButton}
            />
          </View>
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
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
  },
  form: {
    gap: 16,
  },
  input: {
    marginBottom: 8,
  },
  emailContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  emailLabel: {
    marginBottom: 4,
  },
  emailValue: {
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 8,
  },
});

