/**
 * ConfirmInviteScreen
 * 
 * Shows invite details after code validation. User confirms before proceeding
 * to Firebase authentication (sign up or sign in).
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Button } from '@/shared/components';
import { AuthStackParamList } from '@/app/navigation/types';
import { useTranslation } from 'react-i18next';
import { usePendingInvite } from '@/core/contexts/PendingInviteContext';

type ConfirmInviteNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ConfirmInvite'>;

export const ConfirmInviteScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('invite');
  const navigation = useNavigation<ConfirmInviteNavigationProp>();
  const { pendingInvite } = usePendingInvite();

  // Get invite data from context (set by JoinCommunityScreen)
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

  const handleContinue = () => {
    // Navigate to SignUp with pre-filled email
    // PendingInvite is already stored in context from JoinCommunityScreen
    navigation.navigate('SignUp', {
      email: pendingInvite.email,
    });
  };

  const handleSignIn = () => {
    // Navigate to SignIn with pre-filled email
    // PendingInvite is already stored in context from JoinCommunityScreen
    navigation.navigate('SignIn', {
      email: pendingInvite.email,
    });
  };

  return (
    <Screen safeArea style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={64} color={theme.colors.success} />
          </View>
          <Text variant="h2" style={styles.title}>
            {t('inviteConfirmed')}
          </Text>
          <Text
            variant="body"
            color={theme.colors.textSecondary}
            align="center"
            style={styles.subtitle}
          >
            {t('confirmDetails')}
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Ionicons name="business" size={20} color={theme.colors.primary} />
            <View style={styles.detailContent}>
              <Text variant="bodySmall" color={theme.colors.textSecondary}>
                {t('community')}
              </Text>
              <Text variant="bodyLarge" weight="semiBold">
                {pendingInvite.tenantName}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="home" size={20} color={theme.colors.primary} />
            <View style={styles.detailContent}>
              <Text variant="bodySmall" color={theme.colors.textSecondary}>
                {t('unit')}
              </Text>
              <Text variant="bodyLarge" weight="semiBold">
                {pendingInvite.unitLabel}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="mail" size={20} color={theme.colors.primary} />
            <View style={styles.detailContent}>
              <Text variant="bodySmall" color={theme.colors.textSecondary}>
                {t('email')}
              </Text>
              <Text variant="bodyLarge" weight="semiBold">
                {pendingInvite.email}
              </Text>
            </View>
          </View>

          {pendingInvite.role && (
            <View style={styles.detailRow}>
              <Ionicons name="person" size={20} color={theme.colors.primary} />
              <View style={styles.detailContent}>
                <Text variant="bodySmall" color={theme.colors.textSecondary}>
                  {t('role')}
                </Text>
                <Text variant="bodyLarge" weight="semiBold">
                  {pendingInvite.role === 'PrimaryResident' ? t('primaryResident') : pendingInvite.role}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <Button
            title={t('createAccount')}
            onPress={handleContinue}
            variant="primary"
            style={styles.primaryButton}
          />
          <Button
            title={t('alreadyHaveAccount')}
            onPress={handleSignIn}
            variant="outline"
            style={styles.secondaryButton}
          />
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  detailsCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    gap: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailContent: {
    flex: 1,
    gap: 4,
  },
  actions: {
    gap: 12,
    marginTop: 'auto',
    paddingTop: 24,
  },
  primaryButton: {
    marginBottom: 8,
  },
  secondaryButton: {
    marginTop: 0,
  },
});

export default ConfirmInviteScreen;

