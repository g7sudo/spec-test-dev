/**
 * NotificationsSettingsScreen
 * 
 * Manages notification preferences for the user.
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
  getNotificationsSettings,
  updateNotificationsSettings,
  type NotificationsSettingsResponse,
} from '@/services/api/profileSettings';
import { useTenantStore } from '@/state/tenantStore';
import { useIsApiLoading } from '@/state/apiLoadingStore';

type NotificationsNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'Notifications'
>;

interface NotificationItem {
  id: keyof NotificationsSettingsResponse;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const notificationItems: NotificationItem[] = [
  {
    id: 'pushEnabled',
    title: 'Push Notifications',
    subtitle: 'Receive push notifications on your device',
    icon: 'notifications-outline',
  },
  {
    id: 'emailEnabled',
    title: 'Email Notifications',
    subtitle: 'Receive notifications via email',
    icon: 'mail-outline',
  },
  {
    id: 'notifyMaintenanceUpdates',
    title: 'Maintenance Updates',
    subtitle: 'Updates on your maintenance requests',
    icon: 'construct-outline',
  },
  {
    id: 'notifyAmenityBookings',
    title: 'Amenity Bookings',
    subtitle: 'Reminders and updates for amenity bookings',
    icon: 'calendar-outline',
  },
  {
    id: 'notifyVisitorAtGate',
    title: 'Visitor at Gate',
    subtitle: 'Alerts when visitors check in',
    icon: 'people-outline',
  },
  {
    id: 'notifyAnnouncements',
    title: 'Announcements',
    subtitle: 'Community announcements and events',
    icon: 'megaphone-outline',
  },
  {
    id: 'notifyMarketplace',
    title: 'Marketplace',
    subtitle: 'Updates on marketplace activity',
    icon: 'storefront-outline',
  },
];

export const NotificationsSettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NotificationsNavigationProp>();
  const { selectedTenant, currentTenant } = useTenantStore();
  const isApiLoading = useIsApiLoading();

  const [settings, setSettings] = useState<NotificationsSettingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, [selectedTenant?.tenantId, currentTenant?.id]);

  const loadSettings = async () => {
    const tenantId = selectedTenant?.tenantId || currentTenant?.id;
    if (!tenantId) {
      console.warn('[NotificationsScreen] ⚠️ No tenant selected');
      setError('No tenant selected. Please select a community first.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getNotificationsSettings();
      setSettings(data);
      console.log('[NotificationsScreen] ✅ Settings loaded');
    } catch (err: any) {
      console.error('[NotificationsScreen] ❌ Failed to load settings:', err);
      setError(err.message || 'Failed to load notification settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationsSettingsResponse, value: boolean) => {
    if (!settings) return;

    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);

    try {
      await updateNotificationsSettings(updatedSettings);
      console.log('[NotificationsScreen] ✅ Setting updated:', { key, value });
    } catch (err: any) {
      // Revert on error
      setSettings(settings);
      Alert.alert('Error', err.message || 'Failed to update setting. Please try again.');
      console.error('[NotificationsScreen] ❌ Failed to update setting:', err);
    }
  };

  const renderNotificationItem = (item: NotificationItem) => {
    const value = settings?.[item.id] ?? false;

    return (
      <View key={item.id}>
        <View style={styles.notificationItem}>
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
        {item.id !== 'notifyMarketplace' && (
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
        <Text variant="h2">Notifications</Text>
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
          <Card style={styles.settingsCard}>
            {notificationItems.map(renderNotificationItem)}
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
  settingsCard: {
    padding: 0,
    marginTop: 8,
    overflow: 'hidden',
  },
  notificationItem: {
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

export default NotificationsSettingsScreen;

