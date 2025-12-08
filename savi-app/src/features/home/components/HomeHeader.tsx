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
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name="ellipse-outline"
            size={24}
            color={theme.colors.text}
          />
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
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default HomeHeader;
