import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Text } from '@/shared/components';
import { useTranslation } from 'react-i18next';
import { QUICK_ACTIONS } from '@/core/config/constants';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 3;

interface QuickAction {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  color: string;
  backgroundColor: string;
}

interface QuickActionsGridProps {
  onActionPress: (actionId: string) => void;
  unreadAnnouncements?: number;
}

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({
  onActionPress,
  unreadAnnouncements = 0,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('home');

  const actions: QuickAction[] = [
    {
      id: QUICK_ACTIONS.PRE_REGISTER_VISITOR,
      icon: 'person-add-outline',
      labelKey: 'quickActions.preRegisterVisitor',
      color: theme.colors.primary,
      backgroundColor: theme.colors.primaryLight,
    },
    {
      id: QUICK_ACTIONS.MAINTENANCE_REQUEST,
      icon: 'construct-outline',
      labelKey: 'quickActions.maintenanceRequest',
      color: '#FF9800',
      backgroundColor: '#FFF3E0',
    },
    {
      id: QUICK_ACTIONS.GIVE_FEEDBACK,
      icon: 'chatbubble-ellipses-outline',
      labelKey: 'quickActions.giveFeedback',
      color: '#9C27B0',
      backgroundColor: '#F3E5F5',
    },
    {
      id: QUICK_ACTIONS.BOOK_FACILITY,
      icon: 'calendar-outline',
      labelKey: 'quickActions.bookFacility',
      color: '#2196F3',
      backgroundColor: '#E3F2FD',
    },
    {
      id: QUICK_ACTIONS.EMERGENCY,
      icon: 'warning-outline',
      labelKey: 'quickActions.emergency',
      color: '#F44336',
      backgroundColor: '#FFEBEE',
    },
    {
      id: QUICK_ACTIONS.ANNOUNCEMENTS,
      icon: 'megaphone-outline',
      labelKey: 'quickActions.announcements',
      color: '#4CAF50',
      backgroundColor: '#E8F5E9',
    },
  ];

  const renderAction = (action: QuickAction) => {
    const showBadge =
      action.id === QUICK_ACTIONS.ANNOUNCEMENTS && unreadAnnouncements > 0;

    return (
      <TouchableOpacity
        key={action.id}
        style={[styles.actionItem, { width: ITEM_WIDTH }]}
        onPress={() => onActionPress(action.id)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: action.backgroundColor },
          ]}
        >
          <Ionicons name={action.icon} size={28} color={action.color} />
          {showBadge && (
            <View
              style={[
                styles.badge,
                { backgroundColor: theme.colors.error },
              ]}
            >
              <Text variant="caption" color="#FFFFFF" style={styles.badgeText}>
                {unreadAnnouncements > 9 ? '9+' : unreadAnnouncements}
              </Text>
            </View>
          )}
        </View>
        <Text
          variant="caption"
          align="center"
          style={styles.label}
          numberOfLines={2}
        >
          {t(action.labelKey)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {actions.slice(0, 3).map(renderAction)}
      </View>
      <View style={styles.grid}>
        {actions.slice(3, 6).map(renderAction)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionItem: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
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
  label: {
    maxWidth: 80,
  },
});

export default QuickActionsGrid;
