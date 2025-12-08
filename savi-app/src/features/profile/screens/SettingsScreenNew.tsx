/**
 * SettingsScreen
 * 
 * App settings: Theme, Biometric, Locale
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '@/core/theme';
import { Screen, Text, Card, Row } from '@/shared/components';
import { ProfileStackParamList } from '@/app/navigation/types';
import {
  getAppSettings,
  updateAppSettings,
  type AppSettingsResponse,
} from '@/services/api/profileSettings';
import { useTenantStore } from '@/state/tenantStore';
import { useIsApiLoading } from '@/state/apiLoadingStore';
import { useAppStore } from '@/state/appStore';

type SettingsNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Settings'>;

const themeOptions: Array<{
  value: 'Light' | 'Dark' | 'System';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  themeMode: ThemeMode;
}> = [
  { value: 'Light', label: 'Light', icon: 'sunny-outline', themeMode: 'light' },
  { value: 'Dark', label: 'Dark', icon: 'moon-outline', themeMode: 'dark' },
  { value: 'System', label: 'System', icon: 'phone-portrait-outline', themeMode: 'system' },
];

const localeOptions: Array<{ value: string; label: string }> = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'ar-SA', label: 'العربية (Arabic)' },
];

export const SettingsScreen: React.FC = () => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const navigation = useNavigation<SettingsNavigationProp>();
  const { selectedTenant, currentTenant } = useTenantStore();
  const isApiLoading = useIsApiLoading();
  const { language, setLanguage } = useAppStore();

  const [settings, setSettings] = useState<AppSettingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showThemeOptions, setShowThemeOptions] = useState(false);
  const [showLocaleOptions, setShowLocaleOptions] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [selectedTenant?.tenantId, currentTenant?.id]);

  const loadSettings = async () => {
    const tenantId = selectedTenant?.tenantId || currentTenant?.id;
    if (!tenantId) {
      console.warn('[SettingsScreen] ⚠️ No tenant selected');
      setError('No tenant selected. Please select a community first.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getAppSettings();
      setSettings(data);
      
      // Sync theme with API setting
      const themeOption = themeOptions.find((t) => t.value === data.theme);
      if (themeOption && themeMode !== themeOption.themeMode) {
        setThemeMode(themeOption.themeMode);
      }
      
      console.log('[SettingsScreen] ✅ Settings loaded');
    } catch (err: any) {
      console.error('[SettingsScreen] ❌ Failed to load settings:', err);
      setError(err.message || 'Failed to load app settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = async (value: 'Light' | 'Dark' | 'System') => {
    if (!settings) return;

    const themeOption = themeOptions.find((t) => t.value === value);
    if (themeOption) {
      setThemeMode(themeOption.themeMode);
    }

    const updatedSettings = { ...settings, theme: value };
    setSettings(updatedSettings);
    setShowThemeOptions(false);

    try {
      await updateAppSettings(updatedSettings);
      console.log('[SettingsScreen] ✅ Theme updated:', value);
    } catch (err: any) {
      // Revert on error
      setSettings(settings);
      Alert.alert('Error', err.message || 'Failed to update theme. Please try again.');
      console.error('[SettingsScreen] ❌ Failed to update theme:', err);
    }
  };

  const handleLocaleChange = async (value: string) => {
    if (!settings) return;

    const updatedSettings = { ...settings, locale: value };
    setSettings(updatedSettings);
    setShowLocaleOptions(false);

    // Update app store language
    const lang = value.startsWith('ar') ? 'ar' : 'en';
    setLanguage(lang);

    try {
      await updateAppSettings(updatedSettings);
      console.log('[SettingsScreen] ✅ Locale updated:', value);
    } catch (err: any) {
      // Revert on error
      setSettings(settings);
      setLanguage(language);
      Alert.alert('Error', err.message || 'Failed to update locale. Please try again.');
      console.error('[SettingsScreen] ❌ Failed to update locale:', err);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (!settings) return;

    const updatedSettings = { ...settings, biometricEnabled: value };
    setSettings(updatedSettings);

    try {
      await updateAppSettings(updatedSettings);
      console.log('[SettingsScreen] ✅ Biometric updated:', value);
    } catch (err: any) {
      // Revert on error
      setSettings(settings);
      Alert.alert('Error', err.message || 'Failed to update biometric setting. Please try again.');
      console.error('[SettingsScreen] ❌ Failed to update biometric:', err);
    }
  };

  const getCurrentThemeLabel = () => {
    return settings?.theme || 'System';
  };

  const getCurrentLocaleLabel = () => {
    const locale = settings?.locale || 'en-US';
    const option = localeOptions.find((l) => l.value === locale);
    return option?.label || locale;
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
        <Text variant="h2">App Settings</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="body" color={theme.colors.textSecondary} style={styles.loadingText}>
            Loading settings...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text variant="h3" weight="bold" style={styles.errorTitle}>
            Unable to Load Settings
          </Text>
          <Text variant="body" color={theme.colors.textSecondary} align="center">
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={loadSettings}
          >
            <Text variant="body" weight="semiBold" color="#fff">
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Appearance */}
          <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
            Appearance
          </Text>
          <Card style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => setShowThemeOptions(!showThemeOptions)}
            >
              <Row align="center" gap={12}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Ionicons
                    name={theme.mode === 'dark' ? 'moon-outline' : 'sunny-outline'}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.content}>
                  <Text variant="body" weight="medium">
                    Theme
                  </Text>
                  <Text variant="caption" color={theme.colors.textSecondary}>
                    {getCurrentThemeLabel()}
                  </Text>
                </View>
                <Ionicons
                  name={showThemeOptions ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.textTertiary}
                />
              </Row>
            </TouchableOpacity>

            {showThemeOptions && (
              <View style={styles.optionsContainer}>
                {themeOptions.map((option) => {
                  const isSelected = settings?.theme === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => handleThemeChange(option.value)}
                      style={[
                        styles.optionItem,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primaryLight
                            : theme.colors.surfaceVariant,
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={option.icon}
                        size={20}
                        color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                      />
                      <Text
                        variant="body"
                        weight={isSelected ? 'semiBold' : 'regular'}
                        color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                      >
                        {option.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => setShowLocaleOptions(!showLocaleOptions)}
            >
              <Row align="center" gap={12}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Ionicons name="language-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.content}>
                  <Text variant="body" weight="medium">
                    Language
                  </Text>
                  <Text variant="caption" color={theme.colors.textSecondary}>
                    {getCurrentLocaleLabel()}
                  </Text>
                </View>
                <Ionicons
                  name={showLocaleOptions ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.textTertiary}
                />
              </Row>
            </TouchableOpacity>

            {showLocaleOptions && (
              <View style={styles.optionsContainer}>
                {localeOptions.map((option) => {
                  const isSelected = settings?.locale === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => handleLocaleChange(option.value)}
                      style={[
                        styles.optionItem,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primaryLight
                            : theme.colors.surfaceVariant,
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                    >
                      <Text
                        variant="body"
                        weight={isSelected ? 'semiBold' : 'regular'}
                        color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                      >
                        {option.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Card>

          {/* Security */}
          <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
            Security
          </Text>
          <Card style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <Row align="center" gap={12}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Ionicons name="finger-print-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.content}>
                  <Text variant="body" weight="medium">
                    Biometric Login
                  </Text>
                  <Text variant="caption" color={theme.colors.textSecondary}>
                    Use Face ID / Touch ID
                  </Text>
                </View>
                <Switch
                  value={settings?.biometricEnabled ?? false}
                  onValueChange={handleBiometricToggle}
                  disabled={isApiLoading}
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.primary,
                  }}
                  thumbColor={theme.colors.surface}
                />
              </Row>
            </View>
          </Card>
        </ScrollView>
      )}
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
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 12,
  },
  settingsCard: {
    padding: 0,
    marginBottom: 16,
    overflow: 'hidden',
  },
  settingItem: {
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
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

