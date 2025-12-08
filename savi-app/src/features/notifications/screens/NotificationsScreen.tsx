import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Card, Row, Avatar } from '@/shared/components';
import { useTranslation } from 'react-i18next';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'maintenance' | 'visitor' | 'announcement' | 'payment';
}

// Mock data
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Maintenance Update',
    message: 'Your maintenance request has been assigned to a technician.',
    timestamp: '5 minutes ago',
    isRead: false,
    type: 'maintenance',
  },
  {
    id: '2',
    title: 'Visitor Arrived',
    message: 'Your visitor John Doe has arrived at the gate.',
    timestamp: '1 hour ago',
    isRead: false,
    type: 'visitor',
  },
  {
    id: '3',
    title: 'New Announcement',
    message: 'Community meeting scheduled for this weekend.',
    timestamp: '2 hours ago',
    isRead: true,
    type: 'announcement',
  },
];

const getNotificationIcon = (type: Notification['type']): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'maintenance':
      return 'construct-outline';
    case 'visitor':
      return 'person-outline';
    case 'announcement':
      return 'megaphone-outline';
    case 'payment':
      return 'card-outline';
    default:
      return 'notifications-outline';
  }
};

export const NotificationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity activeOpacity={0.7}>
      <Card
        style={[
          styles.notificationCard,
          !item.isRead && { backgroundColor: theme.colors.primaryLight },
        ] as any}
      >
        <Row style={styles.row}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: item.isRead ? theme.colors.backgroundSecondary : '#FFFFFF' },
            ]}
          >
            <Ionicons
              name={getNotificationIcon(item.type)}
              size={20}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.content}>
            <Text variant="bodySmall" weight="semiBold" numberOfLines={1}>
              {item.title}
            </Text>
            <Text
              variant="caption"
              color={theme.colors.textSecondary}
              numberOfLines={2}
              style={styles.message}
            >
              {item.message}
            </Text>
            <Text variant="caption" color={theme.colors.textSecondary}>
              {item.timestamp}
            </Text>
          </View>
          {!item.isRead && (
            <View
              style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]}
            />
          )}
        </Row>
      </Card>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="notifications-off-outline"
        size={64}
        color={theme.colors.textSecondary}
      />
      <Text
        variant="body"
        color={theme.colors.textSecondary}
        align="center"
        style={styles.emptyText}
      >
        No notifications yet
      </Text>
    </View>
  );

  return (
    <Screen safeArea style={styles.screen}>
      <View style={styles.header}>
        <Text variant="h2">Notifications</Text>
      </View>
      <FlatList
        data={mockNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  notificationCard: {
    padding: 16,
    marginBottom: 12,
  },
  row: {
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  message: {
    marginVertical: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
  },
});

export default NotificationsScreen;
