/**
 * MyBookingsScreen
 * 
 * Screen for viewing user's amenity bookings.
 * Shows bookings in tabs: Past, Current, and Upcoming.
 * Users can view booking details and create new bookings.
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Button } from '@/shared/components';
import { ErrorState, EmptyState } from '@/shared/components/feedback';
import { useMyBookings } from '../hooks';
import { BookingCard } from '../components';
import { FacilityStackParamList } from '@/app/navigation/types';
import { AmenityBookingSummaryDto, AmenityBookingStatus } from '@/services/api/amenities';

type NavigationProp = NativeStackNavigationProp<FacilityStackParamList>;

type TabType = 'upcoming' | 'current' | 'past';

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
  
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');

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
          <BookingCard booking={item} onPress={handleBookingPress} />
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
});

export default MyBookingsScreen;

