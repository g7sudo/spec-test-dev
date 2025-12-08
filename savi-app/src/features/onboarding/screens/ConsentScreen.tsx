import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Button, Row, Card } from '@/shared/components';
import { AuthStackParamList } from '@/app/navigation/types';
import { useAppStore } from '@/state/appStore';
import { useTranslation } from 'react-i18next';
import { APP_CONFIG } from '@/core/config/constants';

type ConsentNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Consent'>;

interface ConsentItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  required: boolean;
}

export const ConsentScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<ConsentNavigationProp>();
  const { setPrivacyConsent, setTermsConsent, setNotificationsConsent, completeOnboarding } =
    useAppStore();

  const [acceptedItems, setAcceptedItems] = useState<Set<string>>(new Set());

  const consentItems: ConsentItem[] = [
    {
      id: 'terms',
      icon: 'document-text-outline',
      title: t('consent.termsTitle'),
      description: t('consent.termsDescription'),
      required: true,
    },
    {
      id: 'privacy',
      icon: 'shield-checkmark-outline',
      title: t('consent.privacyTitle'),
      description: t('consent.privacyDescription'),
      required: true,
    },
    {
      id: 'notifications',
      icon: 'notifications-outline',
      title: t('consent.notificationsTitle'),
      description: t('consent.notificationsDescription'),
      required: false,
    },
  ];

  const requiredItems = consentItems.filter((item) => item.required);
  const allRequiredAccepted = requiredItems.every((item) =>
    acceptedItems.has(item.id)
  );

  const toggleItem = (id: string) => {
    setAcceptedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleContinue = () => {
    setTermsConsent(acceptedItems.has('terms'));
    setPrivacyConsent(acceptedItems.has('privacy'));
    setNotificationsConsent(acceptedItems.has('notifications'));
    completeOnboarding();
    navigation.navigate({ name: 'SignIn', params: {} });
  };

  const handleOpenLink = async (type: 'terms' | 'privacy') => {
    const url =
      type === 'terms' ? APP_CONFIG.TERMS_URL : APP_CONFIG.PRIVACY_URL;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  const renderConsentItem = (item: ConsentItem) => {
    const isAccepted = acceptedItems.has(item.id);

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => toggleItem(item.id)}
        activeOpacity={0.7}
      >
        <Card style={styles.consentCard}>
          <Row style={styles.consentRow}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={24}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.consentContent}>
              <Row style={styles.titleRow}>
                <Text variant="bodyLarge" weight="semiBold">
                  {item.title}
                </Text>
                {item.required && (
                  <Text variant="caption" color={theme.colors.error}>
                    *
                  </Text>
                )}
              </Row>
              <Text
                variant="bodySmall"
                color={theme.colors.textSecondary}
                style={styles.description}
              >
                {item.description}
              </Text>
              {(item.id === 'terms' || item.id === 'privacy') && (
                <TouchableOpacity
                  onPress={() =>
                    handleOpenLink(item.id as 'terms' | 'privacy')
                  }
                >
                  <Text
                    variant="bodySmall"
                    color={theme.colors.primary}
                    style={styles.link}
                  >
                    {t('consent.readMore')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: isAccepted
                    ? theme.colors.primary
                    : 'transparent',
                  borderColor: isAccepted
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
            >
              {isAccepted && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
          </Row>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <Screen safeArea style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="h2" align="center">
            {t('consent.title')}
          </Text>
          <Text
            variant="body"
            color={theme.colors.textSecondary}
            align="center"
            style={styles.subtitle}
          >
            {t('consent.subtitle')}
          </Text>
        </View>

        <View style={styles.consentList}>
          {consentItems.map(renderConsentItem)}
        </View>

        <Text
          variant="caption"
          color={theme.colors.textSecondary}
          align="center"
          style={styles.note}
        >
          {t('consent.requiredNote')}
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={t('consent.continue')}
          variant="primary"
          size="large"
          fullWidth
          disabled={!allRequiredAccepted}
          onPress={handleContinue}
        />
      </View>
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 32,
  },
  subtitle: {
    marginTop: 8,
  },
  consentList: {
    gap: 16,
  },
  consentCard: {
    padding: 16,
  },
  consentRow: {
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  consentContent: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    gap: 4,
  },
  description: {
    marginTop: 4,
  },
  link: {
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  note: {
    marginTop: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});

export default ConsentScreen;
