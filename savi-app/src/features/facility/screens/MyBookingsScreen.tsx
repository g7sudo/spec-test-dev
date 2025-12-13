/**
 * MyBookingsScreen
 * 
 * Screen for viewing user's amenity bookings.
 * Shows bookings in tabs: Past, Current, and Upcoming.
 * Users can view booking details and create new bookings.
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Button } from '@/shared/components';
import { ErrorState, EmptyState } from '@/shared/components/feedback';
import { useMyBookings } from '../hooks';
import { BookingCard } from '../components';
import { FacilityStackParamList } from '@/app/navigation/types';
import { AmenityBookingSummaryDto, AmenityBookingStatus, cancelBooking } from '@/services/api/amenities';
import { queryKeys } from '@/services/api/queryClient';

type NavigationProp = NativeStackNavigationProp<FacilityStackParamList>;

type TabType = 'upcoming' | 'current' | 'past';

/**
 * Predefined cancellation reasons for user selection
 */
const CANCEL_REASONS = [
  'Need to reschedule',
  'Change of plans',
  'Emergency',
  'Weather concerns',
  'Found alternative',
  'Other',
] as const;

/**
 * Check if booking is upcoming (start date is in the future)
 */
const isUpcoming = (booking: AmenityBookingSummaryDto): boolean => {
  const startDate = new Date(booking.startAt);
  const now = new Date();
  return startDate > now;
};

/**
 * Check if booking is current (start date is in the past but end date is in the future)
 */
const isCurrent = (booking: AmenityBookingSummaryDto): boolean => {
  const startDate = new Date(booking.startAt);
  const endDate = new Date(booking.endAt);
  const now = new Date();
  return startDate <= now && endDate > now;
};

/**
 * Check if booking is past (end date is in the past)
 */
const isPast = (booking: AmenityBookingSummaryDto): boolean => {
  const endDate = new Date(booking.endAt);
  const now = new Date();
  return endDate <= now;
};

export const MyBookingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  
  // Cancel modal state
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<AmenityBookingSummaryDto | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Fetch all bookings
  const {
    data: bookingsData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useMyBookings({
    page: 1,
    pageSize: 100, // Load enough bookings for all tabs
  });

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason: string }) =>
      cancelBooking(bookingId, reason),
    onSuccess: () => {
      // Invalidate bookings query to refresh the list
      queryClient.invalidateQueries({ queryKey: queryKeys.amenities.bookings.all });
      // Close modal and reset state
      closeCancelModal();
    },
    onError: (err: any) => {
      setCancelError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to cancel booking. Please try again.'
      );
    },
  });

  // Filter bookings by tab
  const filteredBookings = useMemo(() => {
    if (!bookingsData?.items) return [];

    const bookings = bookingsData.items;

    switch (activeTab) {
      case 'upcoming':
        return bookings.filter(isUpcoming).sort(
          (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        );
      case 'current':
        return bookings.filter(isCurrent).sort(
          (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        );
      case 'past':
        return bookings.filter(isPast).sort(
          (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
        );
      default:
        return [];
    }
  }, [bookingsData, activeTab]);

  // Handle booking press - navigate to detail (to be implemented)
  const handleBookingPress = (bookingId: string) => {
    console.log('View booking:', bookingId);
    // navigation.navigate('BookingDetail', { bookingId });
  };

  // Handle create booking - navigate to facility list
  const handleCreateBooking = () => {
    navigation.navigate('FacilityMain');
  };

  // Handle back navigation
  const handleBack = () => {
    navigation.goBack();
  };

  /**
   * Opens the cancel modal for a specific booking
   */
  const openCancelModal = (booking: AmenityBookingSummaryDto) => {
    setSelectedBooking(booking);
    setSelectedReason(null);
    setCancelError(null);
    setCancelModalVisible(true);
  };

  /**
   * Closes the cancel modal and resets state
   */
  const closeCancelModal = () => {
    setCancelModalVisible(false);
    setSelectedBooking(null);
    setSelectedReason(null);
    setCancelError(null);
  };

  /**
   * Handles the cancel confirmation action
   */
  const handleConfirmCancel = () => {
    if (!selectedBooking || !selectedReason) return;
    
    cancelMutation.mutate({
      bookingId: selectedBooking.id,
      reason: selectedReason,
    });
  };

  /**
   * Check if a booking can be cancelled (upcoming and not already cancelled/rejected)
   */
  const canCancelBooking = (booking: AmenityBookingSummaryDto): boolean => {
    const isCancellableStatus =
      booking.status === AmenityBookingStatus.Approved ||
      booking.status === AmenityBookingStatus.PendingApproval;
    return isUpcoming(booking) && isCancellableStatus;
  };

  // Handle pull to refresh - ensure refetch completes properly
  const handleRefresh = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('[MyBookingsScreen] ❌ Refresh error:', error);
      // Error is already handled by React Query, just ensure it completes
    }
  };

  // Loading state
  if (isLoading && !bookingsData) {
    return (
      <Screen safeArea style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text variant="h2">My Bookings</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="body" color={theme.colors.textSecondary} style={styles.loadingText}>
            Loading bookings...
          </Text>
        </View>
      </Screen>
    );
  }

  // Error state
  if (isError) {
    return (
      <Screen safeArea style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text variant="h2">My Bookings</Text>
          <View style={styles.backButton} />
        </View>
        <ErrorState
          title="Unable to Load Bookings"
          message={error?.message || 'Something went wrong. Please try again.'}
          onRetry={() => refetch()}
        />
      </Screen>
    );
  }

  const bookings = filteredBookings;

  return (
    <Screen safeArea style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="h2" style={styles.headerTitle}>
          My Bookings
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'upcoming' && {
              borderBottomColor: theme.colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text
            variant="bodyMedium"
            weight={activeTab === 'upcoming' ? 'semiBold' : 'regular'}
            color={activeTab === 'upcoming' ? theme.colors.primary : theme.colors.textSecondary}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'current' && {
              borderBottomColor: theme.colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab('current')}
        >
          <Text
            variant="bodyMedium"
            weight={activeTab === 'current' ? 'semiBold' : 'regular'}
            color={activeTab === 'current' ? theme.colors.primary : theme.colors.textSecondary}
          >
            Current
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'past' && {
              borderBottomColor: theme.colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab('past')}
        >
          <Text
            variant="bodyMedium"
            weight={activeTab === 'past' ? 'semiBold' : 'regular'}
            color={activeTab === 'past' ? theme.colors.primary : theme.colors.textSecondary}
          >
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <FlatList
        data={bookings}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            onPress={handleBookingPress}
            onCancel={openCancelModal}
            showCancelButton={canCancelBooking(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          bookings.length === 0 ? styles.emptyListContent : styles.listContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <EmptyState
              title={`No ${activeTab} bookings`}
              message={
                activeTab === 'upcoming'
                  ? "You don't have any upcoming bookings. Book a facility to get started."
                  : activeTab === 'current'
                  ? "You don't have any current bookings."
                  : "You don't have any past bookings."
              }
              icon="calendar-outline"
            />
            {activeTab === 'upcoming' && (
              <View style={styles.createButtonContainer}>
                <Button
                  title="Book a Facility"
                  onPress={handleCreateBooking}
                  variant="primary"
                  size="large"
                />
              </View>
            )}
          </View>
        }
      />

      {/* Cancel Booking Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeCancelModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeCancelModal}>
          <Pressable style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text variant="h3" weight="bold">
                Cancel Booking
              </Text>
              <TouchableOpacity onPress={closeCancelModal} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Booking Info */}
            {selectedBooking && (
              <View style={[styles.bookingInfo, { backgroundColor: theme.colors.surface }]}>
                <Text variant="bodyMedium" weight="semiBold">
                  {String(selectedBooking.amenityName || '')}
                </Text>
                <Text variant="bodySmall" color={theme.colors.textSecondary}>
                  {new Date(selectedBooking.startAt).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  •{' '}
                  {new Date(selectedBooking.startAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Text>
              </View>
            )}

            {/* Reason Selection */}
            <Text variant="bodyMedium" weight="semiBold" style={styles.reasonLabel}>
              Select a reason:
            </Text>
            <View style={styles.reasonContainer}>
              {CANCEL_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonTag,
                    {
                      backgroundColor:
                        selectedReason === reason
                          ? theme.colors.primary
                          : theme.colors.surface,
                      borderColor:
                        selectedReason === reason
                          ? theme.colors.primary
                          : theme.colors.border,
                    },
                  ]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <Text
                    variant="bodySmall"
                    color={selectedReason === reason ? '#FFFFFF' : theme.colors.text}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Error Message */}
            {cancelError && (
              <Text variant="bodySmall" color={theme.colors.error} style={styles.errorText}>
                {cancelError}
              </Text>
            )}

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton, { borderColor: theme.colors.border }]}
                onPress={closeCancelModal}
                disabled={cancelMutation.isPending}
              >
                <Text variant="bodyMedium" weight="semiBold">
                  No, Keep It
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmModalButton,
                  {
                    backgroundColor: selectedReason ? theme.colors.error : theme.colors.disabled,
                  },
                ]}
                onPress={handleConfirmCancel}
                disabled={!selectedReason || cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text variant="bodyMedium" weight="semiBold" color="#FFFFFF">
                    Yes, Cancel
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  createButtonContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalCloseButton: {
    padding: 4,
  },
  bookingInfo: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  reasonLabel: {
    marginBottom: 12,
  },
  reasonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  reasonTag: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  errorText: {
    marginBottom: 12,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalButton: {
    borderWidth: 1,
  },
  confirmModalButton: {
    minHeight: 44,
  },
});

export default MyBookingsScreen;

