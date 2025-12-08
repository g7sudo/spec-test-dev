import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, ThemeMode } from '@/core/theme';
import { Screen, Text, Card, Row } from '@/shared/components';
import { useAppStore } from '@/state/appStore';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: 'toggle' | 'select' | 'navigate';
  value?: boolean | string;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

const languages: { key: 'en' | 'ar'; label: string }[] = [
  { key: 'en', label: 'English' },
  { key: 'ar', label: 'العربية (Arabic)' },
];

const themeOptions: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export const SettingsScreen: React.FC = () => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const navigation = useNavigation();
  const { language, setLanguage, notificationsConsent, setNotificationsConsent } = useAppStore();

  const [showThemeOptions, setShowThemeOptions] = useState(false);
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);

  const getCurrentThemeLabel = () => {
    const option = themeOptions.find((t) => t.key === themeMode);
    return option?.label || 'System';
  };

  const getCurrentLanguageLabel = () => {
    const lang = languages.find((l) => l.key === language);
    return lang?.label || 'English';
  };

  const appearanceSettings: SettingItem[] = [
    {
      id: 'theme',
      title: 'Theme',
      subtitle: getCurrentThemeLabel(),
      icon: theme.mode === 'dark' ? 'moon-outline' : 'sunny-outline',
      type: 'select',
      onPress: () => setShowThemeOptions(!showThemeOptions),
    },
    {
      id: 'language',
      title: 'Language',
      subtitle: getCurrentLanguageLabel(),
      icon: 'language-outline',
      type: 'select',
      onPress: () => setShowLanguageOptions(!showLanguageOptions),
    },
  ];

  const notificationSettings: SettingItem[] = [
    {
      id: 'push-notifications',
      title: 'Push Notifications',
      subtitle: 'Receive push notifications',
      icon: 'notifications-outline',
      type: 'toggle',
      value: notificationsConsent,
      onToggle: setNotificationsConsent,
    },
    {
      id: 'maintenance-updates',
      title: 'Maintenance Updates',
      subtitle: 'Updates on your maintenance requests',
      icon: 'construct-outline',
      type: 'toggle',
      value: true,
      onToggle: () => {},
    },
    {
      id: 'visitor-alerts',
      title: 'Visitor Alerts',
      subtitle: 'When visitors check in',
      icon: 'people-outline',
      type: 'toggle',
      value: true,
      onToggle: () => {},
    },
    {
      id: 'community-updates',
      title: 'Community Updates',
      subtitle: 'Announcements and events',
      icon: 'megaphone-outline',
      type: 'toggle',
      value: true,
      onToggle: () => {},
    },
  ];

  const privacySettings: SettingItem[] = [
    {
      id: 'biometric',
      title: 'Biometric Login',
      subtitle: 'Use Face ID / Touch ID',
      icon: 'finger-print-outline',
      type: 'toggle',
      value: false,
      onToggle: () => {},
    },
    {
      id: 'privacy-policy',
      title: 'Privacy Policy',
      icon: 'shield-outline',
      type: 'navigate',
      onPress: () => console.log('Privacy Policy'),
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      icon: 'document-text-outline',
      type: 'navigate',
      onPress: () => console.log('Terms'),
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      onPress={item.type === 'toggle' ? undefined : item.onPress}
      activeOpacity={item.type === 'toggle' ? 1 : 0.7}
      style={styles.settingItem}
    >
      <Row align="center" gap={12}>
        <View
          style={[
            styles.settingIcon,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Ionicons name={item.icon} size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.settingContent}>
          <Text variant="body" weight="medium">
            {item.title}
          </Text>
          {item.subtitle && (
            <Text variant="caption" color={theme.colors.textSecondary}>
              {item.subtitle}
            </Text>
          )}
        </View>
        {item.type === 'toggle' && (
          <Switch
            value={item.value as boolean}
            onValueChange={item.onToggle}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primary,
            }}
            thumbColor={theme.colors.surface}
          />
        )}
        {item.type === 'select' && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textTertiary}
          />
        )}
        {item.type === 'navigate' && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textTertiary}
          />
        )}
      </Row>
    </TouchableOpacity>
  );

  const renderThemeSelector = () => (
    <View style={styles.optionsContainer}>
      {themeOptions.map((option) => (
        <TouchableOpacity
          key={option.key}
          onPress={() => {
            setThemeMode(option.key);
            setShowThemeOptions(false);
          }}
          style={[
            styles.optionItem,
            {
              backgroundColor:
                themeMode === option.key
                  ? theme.colors.primaryLight
                  : theme.colors.surfaceVariant,
              borderColor:
                themeMode === option.key
                  ? theme.colors.primary
                  : theme.colors.border,
            },
          ]}
        >
          <Ionicons
            name={option.icon}
            size={20}
            color={
              themeMode === option.key
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
          />
          <Text
            variant="body"
            weight={themeMode === option.key ? 'semiBold' : 'regular'}
            color={
              themeMode === option.key
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
          >
            {option.label}
          </Text>
          {themeMode === option.key && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={theme.colors.primary}
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderLanguageSelector = () => (
    <View style={styles.optionsContainer}>
      {languages.map((lang) => (
        <TouchableOpacity
          key={lang.key}
          onPress={() => {
            setLanguage(lang.key);
            setShowLanguageOptions(false);
          }}
          style={[
            styles.optionItem,
            {
              backgroundColor:
                language === lang.key
                  ? theme.colors.primaryLight
                  : theme.colors.surfaceVariant,
              borderColor:
                language === lang.key
                  ? theme.colors.primary
                  : theme.colors.border,
            },
          ]}
        >
          <Text
            variant="body"
            weight={language === lang.key ? 'semiBold' : 'regular'}
            color={
              language === lang.key
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
          >
            {lang.label}
          </Text>
          {language === lang.key && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={theme.colors.primary}
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Screen safeArea style={styles.screen}>
      <View style={styles.header}>
        <Row gap={12} align="center">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text variant="h2">Settings</Text>
        </Row>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance Section */}
        <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
          Appearance
        </Text>
        <Card style={styles.settingsCard}>
          {appearanceSettings.map((item, index) => (
            <View key={item.id}>
              {renderSettingItem(item)}
              {item.id === 'theme' && showThemeOptions && renderThemeSelector()}
              {item.id === 'language' && showLanguageOptions && renderLanguageSelector()}
              {index < appearanceSettings.length - 1 && (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: theme.colors.divider },
                  ]}
                />
              )}
            </View>
          ))}
        </Card>

        {/* Notifications Section */}
        <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
          Notifications
        </Text>
        <Card style={styles.settingsCard}>
          {notificationSettings.map((item, index) => (
            <View key={item.id}>
              {renderSettingItem(item)}
              {index < notificationSettings.length - 1 && (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: theme.colors.divider },
                  ]}
                />
              )}
            </View>
          ))}
        </Card>

        {/* Privacy & Security Section */}
        <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
          Privacy & Security
        </Text>
        <Card style={styles.settingsCard}>
          {privacySettings.map((item, index) => (
            <View key={item.id}>
              {renderSettingItem(item)}
              {index < privacySettings.length - 1 && (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: theme.colors.divider },
                  ]}
                />
              )}
            </View>
          ))}
        </Card>

        {/* Data Management */}
        <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
          Data Management
        </Text>
        <Card style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingItem}>
            <Row align="center" gap={12}>
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <Ionicons name="trash-outline" size={20} color={theme.colors.warning} />
              </View>
              <View style={styles.settingContent}>
                <Text variant="body" weight="medium">
                  Clear Cache
                </Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Free up storage space
                </Text>
              </View>
            </Row>
          </TouchableOpacity>
          <View
            style={[styles.divider, { backgroundColor: theme.colors.divider }]}
          />
          <TouchableOpacity style={styles.settingItem}>
            <Row align="center" gap={12}>
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: theme.colors.errorLight },
                ]}
              >
                <Ionicons name="warning-outline" size={20} color={theme.colors.error} />
              </View>
              <View style={styles.settingContent}>
                <Text variant="body" weight="medium" color={theme.colors.error}>
                  Delete Account
                </Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Permanently delete your account
                </Text>
              </View>
            </Row>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 8,
  },
  settingsCard: {
    padding: 0,
    marginBottom: 16,
    overflow: 'hidden',
  },
  settingItem: {
    padding: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginLeft: 68,
  },
  optionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
});

export default SettingsScreen;
