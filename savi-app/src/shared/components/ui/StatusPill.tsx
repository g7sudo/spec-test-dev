import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/core/theme';
import { Text } from './Text';

type StatusType =
  | 'pending'
  | 'confirmed'
  | 'inProgress'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'new'
  | 'assigned'
  | 'approved'
  | 'checkedIn'
  | 'checkedOut'
  | 'expired';

type VariantType = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface StatusPillProps {
  status?: StatusType | string;
  variant?: VariantType; // Alternative to status for simple color-based variants
  label?: string;
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  variant,
  label,
  size = 'medium',
  style,
}) => {
  const { theme } = useTheme();

  const getStatusConfig = (status: string) => {
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '');

    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: '#FFF3CD', text: '#856404', label: 'Pending' },
      new: { bg: '#FFF3CD', text: '#856404', label: 'New' },
      assigned: { bg: '#FFF3CD', text: '#856404', label: 'Assigned' },
      confirmed: { bg: '#D4EDDA', text: '#155724', label: 'Confirmed' },
      approved: { bg: '#D4EDDA', text: '#155724', label: 'Approved' },
      inprogress: { bg: '#CCE5FF', text: '#004085', label: 'In Progress' },
      completed: { bg: '#D4EDDA', text: '#155724', label: 'Completed' },
      cancelled: { bg: '#E2E3E5', text: '#383D41', label: 'Cancelled' },
      rejected: { bg: '#F8D7DA', text: '#721C24', label: 'Rejected' },
      checkedin: { bg: '#CCE5FF', text: '#004085', label: 'Checked In' },
      checkedout: { bg: '#E2E3E5', text: '#383D41', label: 'Checked Out' },
      expired: { bg: '#E2E3E5', text: '#383D41', label: 'Expired' },
    };

    return (
      statusMap[normalizedStatus] || {
        bg: '#E2E3E5',
        text: '#383D41',
        label: status,
      }
    );
  };

  // Handle variant-based styling
  const getVariantConfig = (variant: VariantType) => {
    const variantMap: Record<VariantType, { bg: string; text: string }> = {
      default: { bg: '#E2E3E5', text: '#383D41' },
      success: { bg: '#D4EDDA', text: '#155724' },
      warning: { bg: '#FFF3CD', text: '#856404' },
      error: { bg: '#F8D7DA', text: '#721C24' },
      info: { bg: '#CCE5FF', text: '#004085' },
    };
    return variantMap[variant];
  };

  const config = variant
    ? { ...getVariantConfig(variant), label: label || '' }
    : getStatusConfig(status || 'pending');
  const displayLabel = label || config.label;

  const sizeStyles = {
    small: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      fontSize: 10,
    },
    medium: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      fontSize: 12,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: config.bg,
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
        },
        style,
      ]}
    >
      <Text
        weight="semiBold"
        color={config.text}
        style={{ fontSize: currentSize.fontSize }}
      >
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
});

export default StatusPill;
