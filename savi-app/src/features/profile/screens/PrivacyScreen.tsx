/**
 * PrivacyScreen
 * 
 * Manages privacy and directory visibility settings.
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
import { useTheme } from '@/core/theme';
import { Screen, Text, Card, Row } from '@/shared/components';
import { ProfileStackParamList } from '@/app/navigation/types';
import {
  getPrivacySettings,
  updatePrivacySettings,
  type PrivacySettingsResponse,
} from '@/services/api/profileSettings';
import { useTenantStore } from '@/state/tenantStore';
import { useIsApiLoading } from '@/state/apiLoadingStore';

type PrivacyNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Privacy'>;

interface PrivacyItem {
  id: keyof PrivacySettingsResponse;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const privacyItems: PrivacyItem[] = [
  {
    id: 'showInDirectory',
    title: 'Show in Directory',
    subtitle: 'Make your profile visible in the community directory',
    icon: 'eye-outline',
  },
  {
    id: 'showNameInDirectory',
    title: 'Show Name',
    subtitle: 'Display your name in the directory',
    icon: 'person-outline',
  },
  {
    id: 'showUnitInDirectory',
    title: 'Show Unit',
    subtitle: 'Display your unit number in the directory',
    icon: 'home-outline',
  },
  {
    id: 'showPhoneInDirectory',
    title: 'Show Phone Number',
    subtitle: 'Display your phone number in the directory',
    icon: 'call-outline',
  },
  {
    id: 'showEmailInDirectory',
    title: 'Show Email',
    subtitle: 'Display your email address in the directory',
    icon: 'mail-outline',
  },
  {
    id: 'showProfilePhotoInDirectory',
    title: 'Show Profile Photo',
    subtitle: 'Display your profile photo in the directory',
    icon: 'image-outline',
  },
];

const directoryVisibilityOptions: Array<{
  value: 'Hidden' | 'BlockOnly' | 'Community';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { value: 'Hidden', label: 'Hidden', icon: 'eye-off-outline' },
  { value: 'BlockOnly', label: 'Block Only', icon: 'lock-closed-outline' },
  { value: 'Community', label: 'Community', icon: 'people-outline' },
];

export const PrivacyScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<PrivacyNavigationProp>();
  const { selectedTenant, currentTenant } = useTenantStore();
  const isApiLoading = useIsApiLoading();

  const [settings, setSettings] = useState<PrivacySettingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVisibilityOptions, setShowVisibilityOptions] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [selectedTenant?.tenantId, currentTenant?.id]);

  const loadSettings = async () => {
    const tenantId = selectedTenant?.tenantId || currentTenant?.id;
    if (!tenantId) {
      console.warn('[PrivacyScreen] ⚠️ No tenant selected');
      setError('No tenant selected. Please select a community first.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getPrivacySettings();
      setSettings(data);
      console.log('[PrivacyScreen] ✅ Settings loaded');
    } catch (err: any) {
      console.error('[PrivacyScreen] ❌ Failed to load settings:', err);
      setError(err.message || 'Failed to load privacy settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: keyof PrivacySettingsResponse, value: boolean) => {
    if (!settings) return;

    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);

    try {
      await updatePrivacySettings(updatedSettings);
      console.log('[PrivacyScreen] ✅ Setting updated:', { key, value });
    } catch (err: any) {
      // Revert on error
      setSettings(settings);
      Alert.alert('Error', err.message || 'Failed to update setting. Please try again.');
      console.error('[PrivacyScreen] ❌ Failed to update setting:', err);
    }
  };

  const handleVisibilityChange = async (value: 'Hidden' | 'BlockOnly' | 'Community') => {
    if (!settings) return;

    const updatedSettings = { ...settings, directoryVisibility: value };
    setSettings(updatedSettings);
    setShowVisibilityOptions(false);

    try {
      await updatePrivacySettings(updatedSettings);
      console.log('[PrivacyScreen] ✅ Visibility updated:', value);
    } catch (err: any) {
      // Revert on error
      setSettings(settings);
      Alert.alert('Error', err.message || 'Failed to update visibility. Please try again.');
      console.error('[PrivacyScreen] ❌ Failed to update visibility:', err);
    }
  };

  const renderPrivacyItem = (item: PrivacyItem) => {
    const value = settings?.[item.id] ?? false;

    return (
      <View key={item.id}>
        <View style={styles.privacyItem}>
          <Row align="center" gap={12}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <Ionicons name={item.icon} size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.content}>
              <Text variant="body" weight="medium">
                {item.title}
              </Text>
              <Text variant="caption" color={theme.colors.textSecondary}>
                {item.subtitle}
              </Text>
            </View>
            <Switch
              value={value}
              onValueChange={(newValue) => handleToggle(item.id, newValue)}
              disabled={isApiLoading}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor={theme.colors.surface}
            />
          </Row>
        </View>
        {item.id !== 'showProfilePhotoInDirectory' && (
          <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
        )}
      </View>
    );
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
        <Text variant="h2">Privacy</Text>
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
          {/* Directory Visibility */}
          <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
            Directory Visibility
          </Text>
          <Card style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.visibilityItem}
              onPress={() => setShowVisibilityOptions(!showVisibilityOptions)}
            >
              <Row align="center" gap={12}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Ionicons name="eye-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.content}>
                  <Text variant="body" weight="medium">
                    Visibility Level
                  </Text>
                  <Text variant="caption" color={theme.colors.textSecondary}>
                    {settings?.directoryVisibility || 'Community'}
                  </Text>
                </View>
                <Ionicons
                  name={showVisibilityOptions ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.textTertiary}
                />
              </Row>
            </TouchableOpacity>

            {showVisibilityOptions && (
              <View style={styles.optionsContainer}>
                {directoryVisibilityOptions.map((option) => {
                  const isSelected = settings?.directoryVisibility === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => handleVisibilityChange(option.value)}
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
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={theme.colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Card>

          {/* Directory Details */}
          <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
            Directory Details
          </Text>
          <Card style={styles.settingsCard}>
            {privacyItems.map(renderPrivacyItem)}
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
  visibilityItem: {
    padding: 16,
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
  privacyItem: {
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
});

export default PrivacyScreen;

