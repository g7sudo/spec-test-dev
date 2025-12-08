/**
 * ChangePasswordScreen
 * 
 * Screen for changing user password using Firebase authentication.
 * Requires re-authentication with current password before changing.
 * After successful password change, refreshes the ID token and updates auth store.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Button, TextInput } from '@/shared/components';
import { ProfileStackParamList } from '@/app/navigation/types';
import { useTranslation } from 'react-i18next';
import { changePassword, getIdToken } from '@/services/firebase/auth';
import { useAuthStore } from '@/state/authStore';
import { useIsApiLoading } from '@/state/apiLoadingStore';
import { getFirebaseAuth } from '@/services/firebase/firebaseApp';

type ChangePasswordNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ChangePassword'>;

export const ChangePasswordScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<ChangePasswordNavigationProp>();
  const { user } = useAuthStore();
  const isApiLoading = useIsApiLoading();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canSubmit = 
    currentPassword.trim() !== '' && 
    newPassword.trim() !== '' && 
    confirmPassword.trim() !== '' &&
    newPassword === confirmPassword &&
    newPassword.length >= 6;

  const handleChangePassword = async () => {
    if (!canSubmit) {
      return;
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Validate that new password is different from current
    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setError(null);

    // Check Firebase Auth state before attempting password change
    const firebaseAuth = getFirebaseAuth();
    const firebaseUser = firebaseAuth.currentUser;
    const authStoreUser = useAuthStore.getState().user;
    
    console.log('[ChangePasswordScreen] 🔍 Pre-flight check:', {
      firebaseUser: firebaseUser ? {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
      } : null,
      authStoreUser: authStoreUser ? {
        uid: authStoreUser.uid,
        email: authStoreUser.email,
      } : null,
      timestamp: new Date().toISOString(),
    });

    try {
      console.log('[ChangePasswordScreen] 🔐 CHANGE PASSWORD REQUEST:', {
        currentPasswordLength: currentPassword.length,
        newPasswordLength: newPassword.length,
        confirmPasswordLength: confirmPassword.length,
        passwordsMatch: newPassword === confirmPassword,
        newPasswordDifferent: currentPassword !== newPassword,
        timestamp: new Date().toISOString(),
      });

      // Step 1: Change password (Firebase handles re-authentication internally)
      // Firebase will validate the current password during re-authentication
      console.log('[ChangePasswordScreen] 📤 Calling Firebase changePassword...');
      await changePassword(currentPassword, newPassword);

      console.log('[ChangePasswordScreen] ✅ Password changed successfully');

      // Step 2: Refresh ID token after password change
      // Firebase may invalidate old tokens, so we need to get a fresh one
      console.log('[ChangePasswordScreen] 🔄 Refreshing ID token...');
      try {
        const newToken = await getIdToken(true); // Force refresh token
        
        console.log('[ChangePasswordScreen] ✅ Token refreshed:', {
          tokenLength: newToken.length,
          tokenPreview: newToken.substring(0, 20) + '...',
        });
        
        // Step 3: Update token in auth store (apiClient reads from here)
        useAuthStore.getState().setIdToken(newToken);
        
        console.log('[ChangePasswordScreen] ✅ Token updated in auth store');
      } catch (tokenError: any) {
        console.warn('[ChangePasswordScreen] ⚠️ Failed to refresh token:', {
          error: tokenError.message,
          errorType: typeof tokenError,
        });
        // Password change succeeded, but token refresh failed
        // User may need to sign out and sign in again
      }

      // Show success message and go back
      Alert.alert(
        'Success',
        'Your password has been changed successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to change password. Please try again.';
      
      // Log error details (use console.warn for validation errors like wrong password)
      const isValidationError = errorMessage.includes('incorrect') || 
                                 errorMessage.includes('wrong') || 
                                 errorMessage.includes('invalid');
      
      if (isValidationError) {
        // Wrong password is expected user input error, log as warning not error
        console.warn('[ChangePasswordScreen] ⚠️ Password validation failed:', {
          errorMessage,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Unexpected errors should be logged as errors
        console.error('[ChangePasswordScreen] ❌ PASSWORD CHANGE ERROR:', {
          errorMessage: err.message,
          errorType: typeof err,
          errorStack: err.stack,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Show user-friendly error message inline (red banner)
      console.log('[ChangePasswordScreen] 📝 Displaying error to user:', errorMessage);
      setError(errorMessage);
    }
  };

  return (
    <Screen safeArea style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="h2">Change Password</Text>
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
          <View style={styles.infoContainer}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={theme.colors.info}
            />
            <Text variant="bodySmall" color={theme.colors.textSecondary} style={styles.infoText}>
              For security, please enter your current password to verify your identity before changing it.
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
              label="Current Password"
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                setError(null);
              }}
              placeholder="Enter your current password"
              secureTextEntry
              editable={!isApiLoading}
              style={styles.input}
            />

            <TextInput
              label="New Password"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setError(null);
              }}
              placeholder="Enter your new password (min. 6 characters)"
              secureTextEntry
              editable={!isApiLoading}
              style={styles.input}
            />

            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError(null);
              }}
              placeholder="Confirm your new password"
              secureTextEntry
              editable={!isApiLoading}
              style={styles.input}
            />

            {newPassword !== '' && confirmPassword !== '' && newPassword !== confirmPassword && (
              <Text variant="caption" color={theme.colors.error} style={styles.validationText}>
                Passwords do not match
              </Text>
            )}

            {newPassword !== '' && newPassword.length < 6 && (
              <Text variant="caption" color={theme.colors.error} style={styles.validationText}>
                Password must be at least 6 characters long
              </Text>
            )}

            <Button
              title="Change Password"
              onPress={handleChangePassword}
              disabled={!canSubmit || isApiLoading}
              loading={isApiLoading}
              variant="primary"
              style={styles.changeButton}
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
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    lineHeight: 18,
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
  validationText: {
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  changeButton: {
    marginTop: 8,
  },
});

export default ChangePasswordScreen;

