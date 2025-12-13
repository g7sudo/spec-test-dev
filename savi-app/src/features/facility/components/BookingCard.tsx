/**
 * BookingCard Component
 * 
 * Reusable card component for displaying booking information in lists.
 * Shows amenity name, date/time, status, and booking details.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Text, Card, Row, StatusPill } from '@/shared/components';
import { AmenityBookingSummaryDto, AmenityBookingStatus } from '@/services/api/amenities';

interface BookingCardProps extends Omit<TouchableOpacityProps, 'onPress'> {
  booking: AmenityBookingSummaryDto;
  onPress: (bookingId: string) => void;
  /** Optional callback for cancel action - only shown for cancellable bookings */
  onCancel?: (booking: AmenityBookingSummaryDto) => void;
  /** Whether the booking can be cancelled (e.g., upcoming, not already cancelled) */
  showCancelButton?: boolean;
}

/**
 * Format date and time for display
 */
const formatDateTime = (dateTimeStr: string): { date: string; time: string } => {
  const date = new Date(dateTimeStr);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return { date: dateStr, time: timeStr };
};

/**
 * Get status variant for StatusPill component
 */
const getStatusVariant = (status: AmenityBookingStatus): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  switch (status) {
    case AmenityBookingStatus.Approved:
      return 'success';
    case AmenityBookingStatus.PendingApproval:
      return 'warning';
    case AmenityBookingStatus.Rejected:
    case AmenityBookingStatus.CancelledByAdmin:
    case AmenityBookingStatus.CancelledByResident:
      return 'error';
    case AmenityBookingStatus.Completed:
      return 'info';
    case AmenityBookingStatus.NoShow:
      return 'default';
    default:
      return 'default';
  }
};

/**
 * Get status label for display
 */
const getStatusLabel = (status: AmenityBookingStatus): string => {
  switch (status) {
    case AmenityBookingStatus.PendingApproval:
      return 'Pending';
    case AmenityBookingStatus.Approved:
      return 'Approved';
    case AmenityBookingStatus.Rejected:
      return 'Rejected';
    case AmenityBookingStatus.CancelledByResident:
      return 'Cancelled';
    case AmenityBookingStatus.CancelledByAdmin:
      return 'Cancelled';
    case AmenityBookingStatus.Completed:
      return 'Completed';
    case AmenityBookingStatus.NoShow:
      return 'No Show';
    default:
      return status;
  }
};

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onPress,
  onCancel,
  showCancelButton = false,
  style,
  ...props
}) => {
  const { theme } = useTheme();

  const { date, time } = formatDateTime(booking.startAt);
  const endTime = new Date(booking.endAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  /**
   * Handle cancel button press - prevents event propagation to card
   */
  const handleCancelPress = () => {
    if (onCancel) {
      onCancel(booking);
    }
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(booking.id)}
      activeOpacity={0.7}
      {...props}
    >
      <Card style={[styles.card, style]}>
        <Row style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text variant="bodyLarge" weight="semiBold" numberOfLines={1}>
              {String(booking.amenityName || '')}
            </Text>
            {booking.title && (
              <Text variant="bodySmall" color={theme.colors.textSecondary} numberOfLines={1}>
                {String(booking.title || '')}
              </Text>
            )}
          </View>
          <StatusPill
            label={getStatusLabel(booking.status)}
            variant={getStatusVariant(booking.status)}
            size="small"
          />
        </Row>

        <View style={styles.detailsContainer}>
          <Row style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
            <Text variant="bodySmall" color={theme.colors.textSecondary} style={styles.detailText}>
              {String(date || '')}
            </Text>
          </Row>
          <Row style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
            <Text variant="bodySmall" color={theme.colors.textSecondary} style={styles.detailText}>
              {String(time || '')} - {String(endTime || '')}
            </Text>
          </Row>
          {booking.unitNumber && (
            <Row style={styles.detailRow}>
              <Ionicons name="home-outline" size={16} color={theme.colors.textSecondary} />
              <Text variant="bodySmall" color={theme.colors.textSecondary} style={styles.detailText}>
                Unit {String(booking.unitNumber || '')}
              </Text>
            </Row>
          )}
          {booking.numberOfGuests != null && booking.numberOfGuests > 0 && (
            <Row style={styles.detailRow}>
              <Ionicons name="people-outline" size={16} color={theme.colors.textSecondary} />
              <Text variant="bodySmall" color={theme.colors.textSecondary} style={styles.detailText}>
                {String(booking.numberOfGuests)} {booking.numberOfGuests === 1 ? 'guest' : 'guests'}
              </Text>
            </Row>
          )}
        </View>

        {/* Cancel Button - only shown for cancellable bookings */}
        {showCancelButton && onCancel && (
          <TouchableOpacity
            onPress={handleCancelPress}
            style={[styles.cancelButton, { borderColor: theme.colors.error }]}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle-outline" size={16} color={theme.colors.error} />
            <Text variant="bodySmall" weight="semiBold" color={theme.colors.error}>
              Cancel Booking
            </Text>
          </TouchableOpacity>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 16,
  },
  headerRow: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    gap: 8,
    alignItems: 'center',
  },
  detailText: {
    flex: 1,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
});

