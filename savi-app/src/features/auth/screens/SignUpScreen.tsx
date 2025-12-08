import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Button, TextInput, Row } from '@/shared/components';
import { AuthStackParamList } from '@/app/navigation/types';
import { useTranslation } from 'react-i18next';

type SignUpNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

export const SignUpScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('auth');
  const navigation = useNavigation<SignUpNavigationProp>();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    name.length > 0 &&
    email.length > 0 &&
    password.length >= 6 &&
    isValidEmail(email) &&
    passwordsMatch;

  const handleSignUp = async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement Firebase auth sign-up
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // After sign up, navigate to sign in
      navigation.navigate('SignIn');
    } catch (err) {
      setError(t('signUpError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement Google sign-up
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Google sign-up');
    } catch (err) {
      setError(t('googleSignInError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignUp = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement Apple sign-up
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Apple sign-up');
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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
            <Text variant="h2" style={styles.title}>
              {t('createAccount')}
            </Text>
            <Text
              variant="body"
              color={theme.colors.textSecondary}
              align="center"
            >
              {t('signUpSubtitle')}
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
              label={t('fullName')}
              placeholder={t('fullNamePlaceholder')}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
              leftIcon="person-outline"
            />

            <TextInput
              label={t('email')}
              placeholder={t('emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
              error={email.length > 0 && !isValidEmail(email) ? t('invalidEmail') : undefined}
            />

            <TextInput
              label={t('password')}
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPassword(!showPassword)}
              hint={t('passwordHint')}
            />

            <TextInput
              label={t('confirmPassword')}
              placeholder={t('confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              leftIcon="lock-closed-outline"
              rightIcon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
              error={
                confirmPassword.length > 0 && !passwordsMatch
                  ? t('passwordsDontMatch')
                  : undefined
              }
            />

            <Button
              title={t('signUp')}
              variant="primary"
              size="large"
              fullWidth
              loading={isLoading}
              disabled={!canSubmit}
              onPress={handleSignUp}
              style={styles.signUpButton}
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
              onPress={handleGoogleSignUp}
              leftIcon="logo-google"
              style={styles.socialButton}
            />
            {Platform.OS === 'ios' && (
              <Button
                title={t('continueWithApple')}
                variant="outline"
                size="large"
                fullWidth
                onPress={handleAppleSignUp}
                leftIcon="logo-apple"
                style={styles.socialButton}
              />
            )}
          </View>

          <Row style={styles.signInRow}>
            <Text variant="body" color={theme.colors.textSecondary}>
              {t('alreadyHaveAccount')}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text
                variant="body"
                color={theme.colors.primary}
                weight="semiBold"
                style={styles.signInLink}
              >
                {t('signIn')}
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
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  title: {
    marginBottom: 8,
    marginTop: 8,
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
  signUpButton: {
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
  signInRow: {
    justifyContent: 'center',
    marginTop: 24,
  },
  signInLink: {
    marginLeft: 4,
  },
});

export default SignUpScreen;
