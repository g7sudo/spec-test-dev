/**
 * SetupAccountScreen
 * 
 * Screen for setting up account after validating invite code.
 * User enters password only (email is pre-filled from validation response).
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Button, TextInput } from '@/shared/components';
import { AuthStackParamList } from '@/app/navigation/types';
import { useTranslation } from 'react-i18next';
import { usePendingInvite } from '@/core/contexts/PendingInviteContext';
import { signUpWithEmail, getIdToken } from '@/services/firebase';
import { useIsApiLoading } from '@/state/apiLoadingStore';
import { acceptInvite } from '@/services/api/residentInvite';
import { getAuthMe } from '@/services/api/auth';

type SetupAccountNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SetupAccount'>;

export const SetupAccountScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('invite');
  const navigation = useNavigation<SetupAccountNavigationProp>();
  const { pendingInvite } = usePendingInvite();
  const isApiLoading = useIsApiLoading();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get email from pending invite (set by JoinCommunityScreen)
  if (!pendingInvite) {
    // Should not happen if flow is correct, but handle defensively
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
            {t('error')}
          </Text>
        </View>
        <Text variant="body" align="center" style={styles.errorMessage}>
          {t('noInviteData')}
        </Text>
        <Button
          title={t('back')}
          onPress={() => navigation.goBack()}
          style={styles.button}
        />
      </Screen>
    );
  }

  const email = pendingInvite.email;
  const canSubmit = password.length >= 6 && password === confirmPassword;

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setError(null); // Clear error on input change
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    setError(null); // Clear error on input change
  };

  const handleSetupAccount = async () => {
    if (!canSubmit) {
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);

    try {
      console.log('[SetupAccountScreen] 🚀 Creating Firebase account:', {
        email,
        hasPassword: !!password,
        timestamp: new Date().toISOString(),
      });

      // Step 1: Create Firebase account
      const firebaseUser = await signUpWithEmail(email, password);
      console.log('[SetupAccountScreen] ✅ Firebase account created:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
      });

      // Step 2: Get Firebase ID token
      const firebaseToken = await getIdToken();
      console.log('[SetupAccountScreen] ✅ Firebase token obtained');

      // Step 3: Accept invite (platform level)
      if (!pendingInvite.accessCode || !pendingInvite.invitationToken) {
        throw new Error('Missing invite data. Please start over.');
      }

      console.log('[SetupAccountScreen] 📝 Accepting invite...', {
        accessCode: pendingInvite.accessCode,
        hasInvitationToken: !!pendingInvite.invitationToken,
      });

      // Accept invite with access code and invitation token
      const acceptResponse = await acceptInvite(
        pendingInvite.accessCode,
        pendingInvite.invitationToken,
        firebaseToken
      );

      console.log('[SetupAccountScreen] ✅ Invite accepted:', {
        platformUserId: acceptResponse.platformUserId,
        communityUserId: acceptResponse.communityUserId,
        tenantId: acceptResponse.tenantId,
        tenantCode: acceptResponse.tenantCode,
      });

      // Step 4: Get user profile to check if new user
      const authMeResponse = await getAuthMe(firebaseToken);
      console.log('[SetupAccountScreen] ✅ User profile loaded:', {
        userId: authMeResponse.userId,
        displayName: authMeResponse.displayName,
        isNewUser: authMeResponse.displayName === null,
      });

      // Step 5: Navigate based on user status
      if (authMeResponse.displayName === null) {
        // New user - show profile setup
        navigation.navigate('SetupProfile', {
          firebaseToken,
          tenantId: acceptResponse.tenantId,
          email: email, // Email from pendingInvite
        });
      } else {
        // Existing user - show welcome
        navigation.navigate('Welcome', {
          firebaseToken,
        });
      }
    } catch (err: any) {
      console.error('[SetupAccountScreen] ❌ Account setup error:', {
        error: err.message,
        email,
      });
      setError(err.message || 'Failed to create account. Please try again.');
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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed" size={48} color={theme.colors.primary} />
            </View>
            <Text variant="h2" style={styles.title}>
              Setup Your Account
            </Text>
            <Text
              variant="body"
              color={theme.colors.textSecondary}
              align="center"
              style={styles.subtitle}
            >
              Create a password to secure your account
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
            <View style={styles.emailContainer}>
              <Text variant="bodySmall" color={theme.colors.textSecondary} style={styles.emailLabel}>
                Email
              </Text>
              <Text variant="body" style={styles.emailValue}>
                {email}
              </Text>
            </View>

            <TextInput
              label="Password"
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="Enter password (min 6 characters)"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isApiLoading}
              style={styles.passwordInput}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              }
            />

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              placeholder="Confirm your password"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isApiLoading}
              style={styles.passwordInput}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              }
            />

            <Button
              title="Create Account"
              onPress={handleSetupAccount}
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
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 16,
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
  passwordInput: {
    marginBottom: 8,
  },
  eyeIcon: {
    padding: 4,
  },
  submitButton: {
    marginTop: 8,
  },
  button: {
    marginTop: 16,
  },
  errorMessage: {
    marginBottom: 16,
  },
});

