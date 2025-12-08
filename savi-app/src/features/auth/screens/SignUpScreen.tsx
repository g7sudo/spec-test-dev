import React, { useState, useEffect } from 'react';
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
import { AuthStackParamList, RootStackParamList } from '@/app/navigation/types';
import { useTranslation } from 'react-i18next';
import { usePendingInvite } from '@/core/contexts/PendingInviteContext';
import { useInviteAcceptance } from '@/features/invite/hooks/useInviteAcceptance';
import { useRoute, RouteProp } from '@react-navigation/native';
import { signUpWithEmail, getIdToken } from '@/services/firebase/auth';
import { initializeFirebase } from '@/services/firebase';

type SignUpRouteProp = RouteProp<AuthStackParamList, 'SignUp'>;
type SignUpNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export const SignUpScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('auth');
  const navigation = useNavigation<SignUpNavigationProp>();
  const authNavigation = useNavigation<AuthNavigationProp>();
  const route = useRoute<SignUpRouteProp>();
  const { pendingInvite } = usePendingInvite();
  const { acceptPendingInvite, isLoading: isAcceptingInvite } = useInviteAcceptance();

  // Pre-fill email from route params or pending invite
  const preFilledEmail = route.params?.email || pendingInvite?.email || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState(preFilledEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      // Initialize Firebase if not already initialized
      initializeFirebase();

      // Create Firebase user account
      const user = await signUpWithEmail(email, password);
      
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

      // No pending invite - normal sign up flow
      // After sign up, navigate to sign in
      navigation.navigate('SignIn');
    } catch (err: any) {
      // Firebase errors are already user-friendly from auth.ts
      setError(err.message || t('signUpError'));
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

          <Row style={styles.signInRow}>
            <Text variant="body" color={theme.colors.textSecondary}>
              {t('alreadyHaveAccount')}
            </Text>
            <TouchableOpacity onPress={() => {}}>
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
  joinCommunitySection: {
    marginTop: 24,
    marginBottom: 8,
  },
  joinCommunityButton: {
    marginBottom: 8,
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
