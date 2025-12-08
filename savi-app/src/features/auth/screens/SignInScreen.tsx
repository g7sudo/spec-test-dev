import React, { useState } from 'react';
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
import { useTenantStore } from '@/state/tenantStore';
import { useAppStore } from '@/state/appStore';
import { useAuthStore } from '@/state/authStore';
import { useTranslation } from 'react-i18next';

type SignInNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SignInScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('auth');
  const navigation = useNavigation<SignInNavigationProp>();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // TODO: Implement Firebase auth sign-in
      // For now, simulate a successful login
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock login - in production, this would come from Firebase
      const memberships = [
        {
          tenantId: 'tenant-1',
          tenantName: 'Palm Gardens',
          tenantSlug: 'palm-gardens',
          role: 'resident' as const,
          unitId: 'unit-1',
          unitName: 'A-101',
        },
      ];

      login(
        {
          uid: 'mock-uid',
          email: email,
          displayName: email.split('@')[0],
          photoURL: null,
          emailVerified: true,
        },
        'mock-id-token',
        memberships
      );

      // Auto-select tenant if only one membership
      if (memberships.length === 1) {
        const membership = memberships[0];
        useTenantStore.getState().selectTenant({
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
    } catch (err) {
      setError(t('signInError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // TODO: Navigate to forgot password screen
    console.log('Forgot password');
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement Google sign-in
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Google sign-in');
    } catch (err) {
      setError(t('googleSignInError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement Apple sign-in
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Apple sign-in');
    } catch (err) {
      setError(t('appleSignInError'));
    } finally {
      setIsLoading(false);
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

          <View style={styles.dividerContainer}>
            <View
              style={[styles.divider, { backgroundColor: theme.colors.border }]}
            />
            <Text
              variant="bodySmall"
              color={theme.colors.textSecondary}
              style={styles.dividerText}
            >
              {t('orContinueWith')}
            </Text>
            <View
              style={[styles.divider, { backgroundColor: theme.colors.border }]}
            />
          </View>

          <View style={styles.socialButtons}>
            <Button
              title={t('continueWithGoogle')}
              variant="outline"
              size="large"
              fullWidth
              onPress={handleGoogleSignIn}
              leftIcon="logo-google"
              style={styles.socialButton}
            />
            {Platform.OS === 'ios' && (
              <Button
                title={t('continueWithApple')}
                variant="outline"
                size="large"
                fullWidth
                onPress={handleAppleSignIn}
                leftIcon="logo-apple"
                style={styles.socialButton}
              />
            )}
          </View>

          <Row style={styles.signUpRow}>
            <Text variant="body" color={theme.colors.textSecondary}>
              {t('dontHaveAccount')}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Auth', { screen: 'SignUp' })}>
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
  },
  socialButtons: {
    gap: 12,
  },
  socialButton: {
    borderWidth: 1,
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
