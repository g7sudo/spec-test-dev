import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Text, Avatar, Row } from '@/shared/components';
import { useTenantStore } from '@/state/tenantStore';
import { useAuthStore } from '@/state/authStore';

interface HomeHeaderProps {
  onAvatarPress: () => void;
  onNotificationsPress: () => void;
  unreadNotifications?: number;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  onAvatarPress,
  onNotificationsPress,
  unreadNotifications = 0,
}) => {
  const { theme } = useTheme();
  const { currentTenant, currentUnit } = useTenantStore();
  const { user } = useAuthStore();

  const unitDisplay = currentUnit?.unitNumber || 'Unit';
  const communityLocation = currentTenant?.city || currentTenant?.name || 'Community';

  return (
    <Row style={styles.container}>
      <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.7}>
        <Avatar
          size="medium"
          name={user?.displayName || user?.email || 'User'}
          imageUrl={user?.photoURL || undefined}
        />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text variant="bodyLarge" weight="semiBold">
          {unitDisplay}
        </Text>
        <Row style={styles.locationRow}>
          <Ionicons
            name="location"
            size={12}
            color={theme.colors.textSecondary}
          />
          <Text
            variant="caption"
            color={theme.colors.textSecondary}
            style={styles.locationText}
          >
            {communityLocation}
          </Text>
        </Row>
      </View>

      <Row style={styles.iconsContainer}>
        <TouchableOpacity
          onPress={onNotificationsPress}
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={theme.colors.text}
          />
          {unreadNotifications > 0 && (
            <View
              style={[
                styles.badge,
                { backgroundColor: theme.colors.error },
              ]}
            >
              <Text
                variant="caption"
                color="#FFFFFF"
                style={styles.badgeText}
              >
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Row>
    </Row>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    paddingTop: 60, // Add top padding for status bar if not handled by SafeAreaView
  },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  locationRow: {
    marginTop: 2,
    gap: 4,
  },
  locationText: {
    marginLeft: 2,
  },
  iconsContainer: {
    gap: 8,
  },
  iconButton: {
    padding: 8,
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
});

export default HomeHeader;
