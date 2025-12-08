/**
 * EditProfileScreen
 * 
 * Screen for editing user profile information.
 * Uses PUT /v1/tenant/me/party API to update profile.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Button, TextInput } from '@/shared/components';
import { ProfileStackParamList } from '@/app/navigation/types';
import { useTranslation } from 'react-i18next';
import { getUserProfile, updateProfile, type UserProfileResponse } from '@/services/api/profile';
import { useTenantStore } from '@/state/tenantStore';
import { useIsApiLoading } from '@/state/apiLoadingStore';

type EditProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>;

export const EditProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<EditProfileNavigationProp>();
  const { selectedTenant, currentTenant } = useTenantStore();
  const isApiLoading = useIsApiLoading();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    // Check for tenant - apiClient will automatically add X-Tenant-Id header from persisted store
    if (!currentTenant?.id && !selectedTenant?.tenantId) {
      setError('No tenant selected. Please select a tenant first.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Authorization header is automatically added by apiClient from auth store
      const profileData = await getUserProfile();
      setProfile(profileData);

      // Pre-fill form with current profile data
      setFirstName(profileData.firstName || '');
      setLastName(profileData.lastName || '');
      setDateOfBirth(''); // dateOfBirth not in profile response, leave empty
      setPhoneNumber(profileData.primaryPhone || '');
      setEmail(profileData.primaryEmail || '');

      console.log('[EditProfileScreen] ✅ Profile loaded:', {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.primaryPhone,
        email: profileData.primaryEmail,
      });
    } catch (err: any) {
      console.error('[EditProfileScreen] ❌ Failed to load profile:', {
        error: err.message,
      });
      setError(err.message || 'Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = 
    firstName.trim() !== '' && 
    lastName.trim() !== '' && 
    dateOfBirth.trim() !== '' && 
    phoneNumber.trim() !== '' && 
    email.trim() !== '';

  const handleSave = async () => {
    if (!canSubmit) {
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      setError('Date of birth must be in YYYY-MM-DD format (e.g., 1996-01-01)');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check for tenant - apiClient will automatically add X-Tenant-Id header from persisted store
    if (!currentTenant?.id && !selectedTenant?.tenantId) {
      setError('No tenant selected. Please select a tenant first.');
      return;
    }

    setError(null);

    try {
      console.log('[EditProfileScreen] 📝 Updating profile...', {
        firstName,
        lastName,
        dateOfBirth,
        phoneNumber,
        email,
        tenantId: currentTenant?.id || selectedTenant?.tenantId,
      });

      // Authorization and X-Tenant-Id headers are automatically added by apiClient
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dateOfBirth.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim(),
      });

      console.log('[EditProfileScreen] ✅ Profile updated successfully');

      // Show success message and go back
      Alert.alert(
        'Success',
        'Your profile has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reload profile in parent screen
              navigation.goBack();
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('[EditProfileScreen] ❌ Profile update error:', {
        error: err.message,
      });
      setError(err.message || 'Failed to update profile. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <Screen safeArea style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text variant="h2">Edit Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text variant="body" color={theme.colors.textSecondary}>
            Loading profile...
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
        <Text variant="h2">Edit Profile</Text>
      </View>

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
              placeholder="YYYY-MM-DD (e.g., 1996-01-01)"
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

            <TextInput
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isApiLoading}
              style={styles.input}
            />

            <Button
              title="Save Changes"
              onPress={handleSave}
              disabled={!canSubmit || isApiLoading}
              loading={isApiLoading}
              variant="primary"
              style={styles.saveButton}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
  saveButton: {
    marginTop: 8,
  },
});

export default EditProfileScreen;

