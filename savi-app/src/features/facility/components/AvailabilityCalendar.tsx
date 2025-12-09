/**
 * AvailabilityCalendar Component
 * 
 * Displays a calendar view showing availability for the next 5 days (starting from today).
 * Shows available time slots for each day and allows selection.
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Text, Card } from '@/shared/components';
import { AmenityAvailabilityDto, AvailableSlotDto } from '@/services/api/amenities';

interface AvailabilityCalendarProps {
  /**
   * Availability data for multiple dates
   * Key: date in YYYY-MM-DD format
   * Value: AmenityAvailabilityDto for that date
   */
  availabilityData: Record<string, AmenityAvailabilityDto>;
  /**
   * Selected date (YYYY-MM-DD format)
   */
  selectedDate?: string;
  /**
   * Selected time slot
   */
  selectedSlot?: AvailableSlotDto | null;
  /**
   * Callback when a date is selected
   */
  onDateSelect?: (date: string) => void;
  /**
   * Callback when a time slot is selected
   */
  onSlotSelect?: (date: string, slot: AvailableSlotDto) => void;
  /**
   * Loading state
   */
  isLoading?: boolean;
}

/**
 * Format date to display format (e.g., "Mon, Jan 15")
 */
const formatDateDisplay = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'Invalid Date';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return 'Invalid Date';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format time from HH:mm:ss to HH:mm
 */
const formatTime = (timeStr: string | null | undefined): string => {
  if (!timeStr) return 'N/A';
  return timeStr.substring(0, 5); // Extract HH:mm from HH:mm:ss
};

/**
 * Check if date is today
 */
const isToday = (dateStr: string | null | undefined): boolean => {
  if (!dateStr) return false;
  try {
    const today = new Date();
    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return false;
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
};

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  availabilityData,
  selectedDate,
  selectedSlot,
  onDateSelect,
  onSlotSelect,
  isLoading = false,
}) => {
  const { theme } = useTheme();
  const [expandedDate, setExpandedDate] = useState<string | null>(selectedDate || null);

  // Get dates sorted chronologically
  const dates = useMemo(() => {
    return Object.keys(availabilityData).sort();
  }, [availabilityData]);

  // Default to first date if no selection
  const activeDate = selectedDate || dates[0] || null;

  const handleDatePress = (date: string) => {
    setExpandedDate(date);
    onDateSelect?.(date);
  };

  const handleSlotPress = (date: string, slot: AvailableSlotDto) => {
    console.log('[AvailabilityCalendar] 🎯 SLOT PRESSED:', {
      date,
      slot: {
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: slot.isAvailable,
        unavailableReason: slot.unavailableReason,
      },
    });
    if (slot.isAvailable) {
      console.log('[AvailabilityCalendar] ✅ Calling onSlotSelect callback');
      onSlotSelect?.(date, slot);
    } else {
      console.log('[AvailabilityCalendar] ⚠️ Slot not available, not calling callback');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text variant="body" color={theme.colors.textSecondary} align="center">
          Loading availability...
        </Text>
      </View>
    );
  }

  if (dates.length === 0) {
    return (
      <View style={styles.container}>
        <Text variant="body" color={theme.colors.textSecondary} align="center">
          No availability data available
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Date selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateSelector}
        contentContainerStyle={styles.dateSelectorContent}
      >
        {dates.map((date) => {
          const availability = availabilityData[date];
          const isSelected = date === activeDate;
          const isTodayDate = isToday(date);

          return (
            <TouchableOpacity
              key={date}
              onPress={() => handleDatePress(date)}
              style={[
                styles.dateButton,
                {
                  backgroundColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
            >
              <Text
                variant="caption"
                color={isSelected ? '#fff' : theme.colors.textSecondary}
                weight={isTodayDate ? 'semiBold' : 'regular'}
              >
                {isTodayDate ? 'Today' : (formatDateDisplay(date)?.split(',')[0] || '')}
              </Text>
              <Text
                variant="caption"
                color={isSelected ? '#fff' : theme.colors.text}
                weight={isSelected ? 'semiBold' : 'regular'}
                style={styles.dateNumber}
              >
                {String(new Date(date + 'T00:00:00').getDate())}
              </Text>
              {availability?.isBlackoutDate && (
                <View style={styles.blackoutIndicator}>
                  <Ionicons name="ban-outline" size={12} color={theme.colors.error} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Time slots for selected date */}
      {activeDate && availabilityData[activeDate] && (
        <Card style={styles.slotsCard}>
          <View style={styles.slotsHeader}>
            <Text variant="bodyLarge" weight="semiBold">
              {activeDate ? (isToday(activeDate) ? 'Today' : formatDateDisplay(activeDate)) : ''}
            </Text>
            {availabilityData[activeDate]?.isBlackoutDate && (
              <View style={styles.blackoutBadge}>
                <Ionicons name="ban-outline" size={16} color={theme.colors.error} />
                <Text variant="caption" color={theme.colors.error} style={styles.blackoutText}>
                  Blackout Date
                </Text>
              </View>
            )}
          </View>

          {availabilityData[activeDate]?.isBlackoutDate ? (
            <View style={styles.blackoutMessage}>
              <Text variant="bodySmall" color={theme.colors.textSecondary}>
                {String(availabilityData[activeDate]?.blackoutReason || 'This date is not available for booking')}
              </Text>
            </View>
          ) : (availabilityData[activeDate]?.availableSlots?.length || 0) === 0 ? (
            <View style={styles.emptySlots}>
              <Text variant="bodySmall" color={theme.colors.textSecondary}>
                No time slots available for this date
              </Text>
            </View>
          ) : (
            <View style={styles.slotsGrid}>
              {(availabilityData[activeDate]?.availableSlots || []).map((slot, index) => {
                const startTimeFormatted = formatTime(slot.startTime);
                const endTimeFormatted = formatTime(slot.endTime);
                const isSelected = selectedSlot && 
                  selectedSlot.startTime === slot.startTime && 
                  selectedSlot.endTime === slot.endTime;
                
                console.log('[AvailabilityCalendar] ⏰ SLOT RENDER:', {
                  index,
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                  startTimeFormatted,
                  endTimeFormatted,
                  isAvailable: slot.isAvailable,
                  isSelected,
                  unavailableReason: slot.unavailableReason,
                  slotType: typeof slot.startTime,
                });

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleSlotPress(activeDate, slot)}
                    disabled={!slot.isAvailable}
                    style={[
                      styles.slotButton,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary
                          : slot.isAvailable
                          ? theme.colors.primaryLight
                          : theme.colors.surface,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : slot.isAvailable
                          ? theme.colors.primary
                          : theme.colors.border,
                        borderWidth: isSelected ? 2 : 1,
                        opacity: slot.isAvailable ? 1 : 0.5,
                      },
                    ]}
                  >
                    <Text
                      variant="bodySmall"
                      weight={isSelected ? 'semiBold' : 'medium'}
                      color={isSelected 
                        ? theme.colors.textInverse || '#FFFFFF'
                        : slot.isAvailable 
                        ? theme.colors.primary 
                        : theme.colors.textSecondary}
                    >
                      {startTimeFormatted} - {endTimeFormatted}
                    </Text>
                    {!slot.isAvailable && slot.unavailableReason && (
                      <Text variant="caption" color={theme.colors.textSecondary} style={styles.slotReason}>
                        {String(slot.unavailableReason || '')}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateSelector: {
    marginBottom: 16,
  },
  dateSelectorContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  dateButton: {
    width: 60,
    height: 70,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dateNumber: {
    marginTop: 4,
  },
  blackoutIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  slotsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  slotsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  blackoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  blackoutText: {
    marginLeft: 4,
  },
  blackoutMessage: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
  },
  emptySlots: {
    padding: 12,
    alignItems: 'center',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  slotReason: {
    marginTop: 4,
    fontSize: 10,
  },
});

