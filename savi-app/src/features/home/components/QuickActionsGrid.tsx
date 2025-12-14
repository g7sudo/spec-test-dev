import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Text } from '@/shared/components';
import { useTranslation } from 'react-i18next';
import { QUICK_ACTIONS } from '@/core/config/constants';

const { width } = Dimensions.get('window');
// Container: marginHorizontal(12*2=24) + paddingHorizontal(16*2=32) + gap(12) = 68
const ITEM_WIDTH = (width - 68) / 2;

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
      icon: 'people',
      labelKey: 'quickActions.preRegisterVisitor',
      color: '#1A237E', // Dark Blue
      backgroundColor: '#FFFFFF',
    },
    {
      id: QUICK_ACTIONS.MAINTENANCE_REQUEST,
      icon: 'construct',
      labelKey: 'quickActions.maintenanceRequest',
      color: '#1A237E',
      backgroundColor: '#FFFFFF',
    },
    {
      id: QUICK_ACTIONS.GIVE_FEEDBACK,
      icon: 'chatbubble',
      labelKey: 'quickActions.giveFeedback',
      color: '#1A237E',
      backgroundColor: '#FFFFFF',
    },
    {
      id: QUICK_ACTIONS.BOOK_FACILITY,
      icon: 'business',
      labelKey: 'quickActions.bookFacility',
      color: '#1A237E',
      backgroundColor: '#FFFFFF',
    },
    {
      id: QUICK_ACTIONS.EMERGENCY,
      icon: 'person',
      labelKey: 'quickActions.emergency',
      color: '#1A237E',
      backgroundColor: '#FFFFFF',
    },
    {
      id: QUICK_ACTIONS.ANNOUNCEMENTS,
      icon: 'megaphone',
      labelKey: 'quickActions.announcements',
      color: '#1A237E',
      backgroundColor: '#FFFFFF',
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
        <Text
          variant="bodyMedium"
          weight="semiBold"
          style={styles.label}
          numberOfLines={2}
        >
          {t(action.labelKey)}
        </Text>
        <View style={styles.iconContainer}>
          <Ionicons name={action.icon} size={24} color={action.color} />
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
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {actions.map(renderAction)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF', // White card section
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EDF2', // Softer border
    // Enhanced shadow for depth
    shadowColor: '#1A237E', // Tinted shadow for warmth
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    // Elevation for Android
    elevation: 3,
    height: 72, // Fixed height for consistency
  },
  iconContainer: {
    position: 'relative',
    marginLeft: 8,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  label: {
    flex: 1,
    color: '#1A1A2E',
  },
});

export default QuickActionsGrid;
