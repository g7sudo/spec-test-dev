/**
 * AmenityDetailScreen
 * 
 * Screen for viewing amenity details and booking availability.
 * Shows amenity information, calendar view (today + next 5 days), and available time slots.
 * Allows users to select a time slot to create a booking.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueries } from '@tanstack/react-query';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme } from '@/core/theme';
import { Screen, Text, Card, Row, Button } from '@/shared/components';
import { ErrorState } from '@/shared/components/feedback';
import { useAmenity } from '../hooks';
import { getAmenityAvailability, createAmenityBooking, CreateAmenityBookingRequest } from '@/services/api/amenities';
import { queryKeys } from '@/services/api/queryClient';
import { AvailabilityCalendar } from '../components';
import { FacilityStackParamList } from '@/app/navigation/types';
import { AvailableSlotDto, AmenityAvailabilityDto } from '@/services/api/amenities';
import { useAuthStore } from '@/state/authStore';
import { useTenantStore } from '@/state/tenantStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getTenantAuth } from '@/services/api/auth';

type RouteProp = {
  params: {
    amenityId: string;
  };
};

type NavigationProp = NativeStackNavigationProp<FacilityStackParamList>;

const PLACEHOLDER_IMAGE_URL = 'https://picsum.photos/400/200.jpg';

/**
 * Generate array of dates starting from today for next N days
 */
const getNextDays = (days: number): string[] => {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    dates.push(dateStr);
  }
  
  return dates;
};

export const AmenityDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const route = useRoute<RouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { amenityId } = route.params;
  const queryClient = useQueryClient();

  // Get auth and tenant data
  const user = useAuthStore((state) => state.user);
  const currentUnit = useTenantStore((state) => state.currentUnit);
  const currentTenant = useTenantStore((state) => state.currentTenant);
  const tenantStoreHydrated = useTenantStore((state) => state._hasHydrated);
  const idToken = useAuthStore((state) => state.idToken);
  
  // Fetch unit if missing (user is logged in but unit not stored)
  useEffect(() => {
    const fetchMissingUnit = async () => {
      // Only fetch if:
      // 1. Store is hydrated
      // 2. User is authenticated
      // 3. Tenant is selected
      // 4. Unit is missing
      // 5. We have a token
      if (
        tenantStoreHydrated &&
        user &&
        currentTenant &&
        !currentUnit?.id &&
        idToken
      ) {
        console.log('[AmenityDetailScreen] 🔄 Unit missing, fetching from API...');
        try {
          // Fetch tenant auth data to get unit from leases
          const tenantAuthData = await getTenantAuth();
          
          // Extract unit from leases (use primary lease or first lease)
          const primaryLease = tenantAuthData.leases.find(lease => lease.isPrimary);
          const selectedLease = primaryLease || tenantAuthData.leases[0];
          
          if (selectedLease) {
            console.log('[AmenityDetailScreen] ✅ Unit fetched and stored:', {
              unitId: selectedLease.unitId,
              unitLabel: selectedLease.unitLabel,
              isPrimary: selectedLease.isPrimary,
            });
            
            // Store unit in tenant store
            useTenantStore.getState().setCurrentUnit({
              id: selectedLease.unitId,
              unitNumber: selectedLease.unitLabel,
            });
          } else {
            console.warn('[AmenityDetailScreen] ⚠️ No leases found in tenant auth data');
          }
        } catch (error: any) {
          console.error('[AmenityDetailScreen] ❌ Failed to fetch unit:', {
            error: error.message,
            status: error.response?.status,
          });
        }
      }
    };
    
    fetchMissingUnit();
  }, [tenantStoreHydrated, user, currentTenant, currentUnit, idToken]);
  
  // Refresh userId from tenantAuth if it might be outdated (platform-level instead of communityUserId)
  useEffect(() => {
    const refreshUserId = async () => {
      // Only refresh if:
      // 1. Store is hydrated
      // 2. User is authenticated
      // 3. Tenant is selected
      // 4. We have a token
      if (
        tenantStoreHydrated &&
        user?.userId &&
        currentTenant &&
        idToken
      ) {
        try {
          const tenantAuthData = await getTenantAuth();
          const correctCommunityUserId = tenantAuthData.communityUserId;
          
          // If stored userId doesn't match communityUserId, update it
          if (user.userId !== correctCommunityUserId) {
            console.warn('[AmenityDetailScreen] ⚠️ Stored userId does not match communityUserId, updating...', {
              storedUserId: user.userId,
              correctCommunityUserId: correctCommunityUserId,
            });
            
            // Update authStore with correct communityUserId
            useAuthStore.getState().setUser({
              ...user,
              userId: correctCommunityUserId,
            });
            
            console.log('[AmenityDetailScreen] ✅ Updated userId to communityUserId:', correctCommunityUserId);
          }
        } catch (error: any) {
          console.error('[AmenityDetailScreen] ❌ Failed to refresh userId:', {
            error: error.message,
          });
          // Don't throw - continue with existing userId if refresh fails
        }
      }
    };
    
    refreshUserId();
  }, [tenantStoreHydrated, user?.userId, currentTenant, idToken]);

  // State for selected date and slot
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotDto | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const BUTTON_HEIGHT = 80; // Approximate height of button + padding

  // Generate dates for next 5 days (including today)
  const dates = useMemo(() => getNextDays(5), []);

  // Fetch amenity details
  const {
    data: amenity,
    isLoading: isLoadingAmenity,
    isError: isErrorAmenity,
    error: errorAmenity,
  } = useAmenity(amenityId);

  // Fetch availability for all dates using useQueries
  const availabilityQueries = useQueries({
    queries: dates.map((date) => ({
      queryKey: queryKeys.amenities.availability(amenityId, date),
      queryFn: () => getAmenityAvailability(amenityId, date),
      enabled: !!amenityId && !!date && !!amenity?.isBookable,
      staleTime: 1000 * 60 * 2, // 2 minutes
    })),
  });

  // Combine availability data
  const availabilityData = useMemo(() => {
    const data: Record<string, AmenityAvailabilityDto> = {};
    dates.forEach((date, index) => {
      const queryResult = availabilityQueries[index];
      if (queryResult.data) {
        data[date] = queryResult.data;
      }
    });
    return data;
  }, [availabilityQueries, dates]);

  const isLoadingAvailability = availabilityQueries.some((q) => q.isLoading);
  const hasAvailabilityData = Object.keys(availabilityData).length > 0;

  // Set default selected date to today
  useEffect(() => {
    if (!selectedDate && dates.length > 0) {
      setSelectedDate(dates[0]);
    }
  }, [dates, selectedDate]);

  // Handle date selection
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null); // Clear slot selection when date changes
  };

  // Handle slot selection
  const handleSlotSelect = (date: string, slot: AvailableSlotDto) => {
    if (slot.isAvailable) {
      setSelectedSlot(slot);
      setSelectedDate(date);
    }
  };

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: (bookingData: CreateAmenityBookingRequest) => createAmenityBooking(bookingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.amenities.bookings.all });
      navigation.goBack();
    },
    onError: (error: any) => {
      setBookingError(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create booking. Please try again.'
      );
    },
  });

  /**
   * Formats time string (HH:mm:ss) to readable format (h:mm AM/PM)
   */
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  /**
   * Formats date string (YYYY-MM-DD) to readable format (Mon, Dec 13)
   */
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  /**
   * Executes the actual booking API call after confirmation
   */
  const confirmBooking = () => {
    const userId = user?.userId;
    const unitId = currentUnit?.id;

    if (!selectedDate || !selectedSlot || !userId || !unitId) return;

    setBookingError(null);

    // Build datetime strings and create booking
    const startDateTime = `${selectedDate}T${selectedSlot.startTime}`;
    const endDateTime = `${selectedDate}T${selectedSlot.endTime}`;
    const startAt = new Date(startDateTime).toISOString();
    const endAt = new Date(endDateTime).toISOString();
    
    const bookingData: CreateAmenityBookingRequest = {
      amenityId,
      unitId,
      startAt,
      endAt,
      source: 'MobileApp',
      title: amenity?.name || 'Amenity Booking',
      notes: '',
      numberOfGuests: 0,
      bookedForUserId: userId,
    };

    createBookingMutation.mutate(bookingData);
  };

  /**
   * Handle booking button press - validates and shows confirmation dialog
   */
  const handleBookPress = () => {
    // Validate all required fields first
    const userId = user?.userId;
    const unitId = currentUnit?.id;
    
    if (!selectedDate || !selectedSlot || !userId || !unitId) {
      if (!selectedDate || !selectedSlot) {
        setBookingError('Please select both a date and a time slot.');
      } else if (!userId) {
        setBookingError('User not authenticated. Please sign in again.');
      } else if (!unitId) {
        setBookingError('No unit selected. Please select a unit first.');
      }

      return;
    }

    // Show confirmation dialog with booking details
    const bookingDetails = `${amenity?.name || 'Facility'}\n${formatDate(selectedDate)}\n${formatTime(selectedSlot.startTime)} - ${formatTime(selectedSlot.endTime)}`;
    
    Alert.alert(
      'Confirm Booking',
      `Do you want to book?\n\n${bookingDetails}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, Book Now',
          onPress: confirmBooking,
        },
      ],
      { cancelable: true }
    );
  };

  // Handle back navigation
  const handleBack = () => {
    navigation.goBack();
  };

  // Loading state
  if (isLoadingAmenity) {
    return (
      <Screen safeArea style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="body" color={theme.colors.textSecondary} style={styles.loadingText}>
            Loading facility details...
          </Text>
        </View>
      </Screen>
    );
  }

  // Error state
  if (isErrorAmenity || !amenity) {
    return (
      <Screen safeArea style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text variant="h2">Facility Details</Text>
        </View>
        <ErrorState
          title="Unable to Load Facility"
          message={errorAmenity?.message || 'Facility not found'}
          onRetry={() => {
            // Refetch amenity data
            // React Query will handle the refetch automatically
          }}
        />
      </Screen>
    );
  }

  const imageUrl = amenity?.documents?.[0]?.downloadUrl || PLACEHOLDER_IMAGE_URL;
  const shouldShowBookButton = !!amenity?.isBookable;
  const isButtonDisabled = !selectedSlot || !selectedDate || createBookingMutation.isPending;

  return (
    <View style={styles.screen} pointerEvents="box-none">
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }} pointerEvents="box-none">
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text variant="h2" style={styles.headerTitle}>
            {String(amenity?.name || '')}
          </Text>
          {/* Spacer for centering */}
          <View style={styles.backButton} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          shouldShowBookButton && {
            paddingBottom: BUTTON_HEIGHT + insets.bottom + 16,
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Image */}
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
          transition={200}
        />

        {/* Basic Info */}
        <Card style={styles.infoCard}>
          <Text variant="h3" weight="bold" style={styles.sectionTitle}>
            About
          </Text>
          {amenity.description && (
            <Text variant="body" color={theme.colors.textSecondary} style={styles.description}>
              {String(amenity.description || '')}
            </Text>
          )}
          {amenity.locationText && (
            <Row style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={theme.colors.textSecondary} />
              <Text variant="body" color={theme.colors.textSecondary} style={styles.infoText}>
                {String(amenity.locationText || '')}
              </Text>
            </Row>
          )}

          {/* Booking Rules */}
          {amenity?.isBookable && (
            <View style={styles.rulesSection}>
              <Text variant="bodySmall" weight="semiBold" style={styles.rulesTitle}>
                Booking Information
              </Text>
              {amenity.slotDurationMinutes != null && amenity.slotDurationMinutes > 0 && (
                <Row style={styles.ruleRow}>
                  <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
                  <Text variant="bodySmall" color={theme.colors.textSecondary}>
                    Slot Duration: {String(amenity.slotDurationMinutes || 0)} minutes
                  </Text>
                </Row>
              )}
              {amenity.openTime && amenity.closeTime && (
                <Row style={styles.ruleRow}>
                  <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
                  <Text variant="bodySmall" color={theme.colors.textSecondary}>
                    Hours: {String(amenity.openTime?.substring(0, 5) || 'N/A')} - {String(amenity.closeTime?.substring(0, 5) || 'N/A')}
                  </Text>
                </Row>
              )}
              {amenity.requiresApproval && (
                <Row style={styles.ruleRow}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={theme.colors.warning} />
                  <Text variant="bodySmall" color={theme.colors.warning}>
                    Requires approval
                  </Text>
                </Row>
              )}
              {amenity.depositRequired && amenity.depositAmount != null && (
                <Row style={styles.ruleRow}>
                  <Ionicons name="card-outline" size={16} color={theme.colors.warning} />
                  <Text variant="bodySmall" color={theme.colors.warning}>
                    Deposit: ${String(amenity.depositAmount)}
                  </Text>
                </Row>
              )}
            </View>
          )}
        </Card>

        {/* Availability Calendar */}
        {amenity?.isBookable && (
          <View style={styles.calendarSection}>
            <Text variant="h3" weight="bold" style={styles.sectionTitle}>
              Select Date & Time
            </Text>
            {isLoadingAvailability && !hasAvailabilityData ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text variant="bodySmall" color={theme.colors.textSecondary} style={styles.loadingText}>
                  Loading availability...
                </Text>
              </View>
            ) : (
              <AvailabilityCalendar
                availabilityData={availabilityData}
                selectedDate={selectedDate || undefined}
                selectedSlot={selectedSlot}
                onDateSelect={handleDateSelect}
                onSlotSelect={handleSlotSelect}
                isLoading={isLoadingAvailability}
              />
            )}
          </View>
        )}

      </ScrollView>

      {shouldShowBookButton && (
        <View
          style={[
            styles.stickyButtonContainer,
            {
              paddingBottom: insets.bottom,
              backgroundColor: theme.colors.background,
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.stickyButtonWrapper} pointerEvents="auto">
            {bookingError && (
              <Text variant="caption" color={theme.colors.error} style={{ marginBottom: 8, textAlign: 'center' }}>
                {bookingError}
              </Text>
            )}
            <Button
              title={createBookingMutation.isPending ? 'Booking...' : 'Book Now'}
              onPress={handleBookPress}
              variant="primary"
              size="large"
              style={styles.stickyButton}
              disabled={isButtonDisabled || createBookingMutation.isPending}
              loading={createBookingMutation.isPending}
            />
          </View>
        </View>
      )}
    </View>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  image: {
    width: '100%',
    height: 250,
  },
  infoCard: {
    margin: 16,
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  description: {
    marginBottom: 16,
    lineHeight: 22,
  },
  infoRow: {
    marginTop: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
  },
  rulesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  rulesTitle: {
    marginBottom: 8,
  },
  ruleRow: {
    marginTop: 8,
    gap: 8,
  },
  calendarSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  bookButtonContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  bookButton: {
    width: '100%',
  },
  stickyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1000,
    overflow: 'hidden',
  },
  stickyButtonWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
  },
  stickyButton: {
    width: '100%',
  },
});

export default AmenityDetailScreen;
