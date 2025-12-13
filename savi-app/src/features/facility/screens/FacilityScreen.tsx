/**
 * FacilityScreen
 * 
 * Main screen for viewing all available amenities/facilities.
 * Displays a list of amenities with images, status, and basic info.
 * Users can tap on an amenity to view details and book if available.
 */

import React, { useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme } from '@/core/theme';
import { Screen, Text, Card, Row } from '@/shared/components';
import { ErrorState, EmptyState } from '@/shared/components/feedback';
import { useAmenities } from '../hooks';
import { AmenitySummaryDto } from '@/services/api/amenities';
import { FacilityStackParamList } from '@/app/navigation/types';
import { useScrollDirection } from '@/core/contexts/ScrollDirectionContext';

type NavigationProp = NativeStackNavigationProp<FacilityStackParamList>;

// Placeholder image URL for amenities without primary image
const PLACEHOLDER_IMAGE_URL = 'https://picsum.photos/400/200.jpg';

export const FacilityScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { setIsScrollingUp } = useScrollDirection();
  
  // Refs for scroll tracking
  const lastScrollOffset = useRef(0);
  const scrollDirectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBottomNavDirectionRef = useRef<'up' | 'down' | null>(null);
  
  // Fetch amenities using React Query hook
  const {
    data: amenitiesData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useAmenities({
    isVisibleInApp: true, // Only show amenities visible in app
    page: 1,
    pageSize: 50, // Load enough amenities for initial view
  });

  /**
   * Handle amenity card press - navigate to detail screen
   */
  const handleAmenityPress = (amenityId: string) => {
    navigation.navigate('AmenityDetail', { amenityId });
  };

  /**
   * Handle my bookings press - navigate to bookings screen
   */
  const handleMyBookingsPress = () => {
    navigation.navigate('MyBookings');
  };

  /**
   * Handle pull to refresh - ensure refetch completes properly
   */
  const handleRefresh = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('[FacilityScreen] ❌ Refresh error:', error);
      // Error is already handled by React Query, just ensure it completes
    }
  };

  /**
   * Handle scroll begin drag - reset scroll tracking
   */
  const handleScrollBeginDrag = useCallback((event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    lastScrollOffset.current = offset;
  }, []);

  /**
   * Handle scroll - detect scroll direction and update nav bar visibility
   * 
   * Behavior:
   * - Scrolling UP → Hide navbar for full-screen experience
   * - Scrolling DOWN (even slightly) → Show navbar so users can navigate
   */
  const handleScroll = useCallback((event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    const clampedOffset = Math.max(0, offset); // Clamp to prevent negative values from bounce
    
    // Detect scroll direction for bottom nav visibility
    // More sensitive threshold for scroll down detection (shows navbar sooner)
    const scrollDelta = clampedOffset - lastScrollOffset.current;
    const isScrollingUpward = scrollDelta > 1.5; // Threshold to prevent jitter (slightly lower for responsiveness)
    const isScrollingDownward = scrollDelta < -1; // More sensitive - even small scroll down shows navbar
    
    // Update bottom nav visibility based on scroll direction
    // Only hide when scrolling up past a small threshold (to avoid hiding at top)
    const shouldHide = isScrollingUpward && clampedOffset > 10;
    // Show navbar when scrolling down OR when near top (for easy navigation)
    const shouldShow = isScrollingDownward || clampedOffset <= 10;
    
    // Determine current direction
    const currentDirection: 'up' | 'down' | null = shouldHide ? 'up' : (shouldShow ? 'down' : null);
    
    // Only set timeout if direction changed or no timeout exists
    const directionChanged = currentDirection !== null && currentDirection !== lastBottomNavDirectionRef.current;
    
    if (shouldHide && (directionChanged || !scrollDirectionTimeoutRef.current)) {
      // Scrolling up - hide bottom nav for full-screen view
      if (scrollDirectionTimeoutRef.current) {
        clearTimeout(scrollDirectionTimeoutRef.current);
        scrollDirectionTimeoutRef.current = null;
      }

      lastBottomNavDirectionRef.current = 'up';
      scrollDirectionTimeoutRef.current = setTimeout(() => {
        setIsScrollingUp(true);
        scrollDirectionTimeoutRef.current = null;
        lastBottomNavDirectionRef.current = null;
      }, 30); // Reduced delay for faster response
    } else if (shouldShow && (directionChanged || !scrollDirectionTimeoutRef.current)) {
      // Scrolling down (even slightly) or near top - show bottom nav for navigation
      if (scrollDirectionTimeoutRef.current) {
        clearTimeout(scrollDirectionTimeoutRef.current);
        scrollDirectionTimeoutRef.current = null;
      }

      lastBottomNavDirectionRef.current = 'down';
      scrollDirectionTimeoutRef.current = setTimeout(() => {
        setIsScrollingUp(false);
        scrollDirectionTimeoutRef.current = null;
        lastBottomNavDirectionRef.current = null;
      }, 30); // Reduced delay for faster response - shows navbar quickly
    }
    
    // Update last scroll offset
    lastScrollOffset.current = clampedOffset;
  }, [setIsScrollingUp]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollDirectionTimeoutRef.current) {
        clearTimeout(scrollDirectionTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Get image URL for amenity, fallback to placeholder if null
   */
  const getImageUrl = (amenity: AmenitySummaryDto): string => {
    return amenity.primaryImageUrl || PLACEHOLDER_IMAGE_URL;
  };

  /**
   * Get status badge color based on availability
   */
  const getStatusBadgeStyle = (isAvailable: boolean) => ({
    backgroundColor: isAvailable
      ? theme.colors.successLight
      : theme.colors.errorLight,
  });

  /**
   * Get status text color based on availability
   */
  const getStatusTextColor = (isAvailable: boolean) =>
    isAvailable ? theme.colors.success : theme.colors.error;

  /**
   * Render amenity card item
   */
  const renderAmenity = ({ item }: { item: AmenitySummaryDto }) => (
    <TouchableOpacity
      onPress={() => handleAmenityPress(item.id)}
      activeOpacity={0.7}
    >
      <Card style={styles.amenityCard}>
        <Image
          source={{ uri: getImageUrl(item) }}
          style={styles.amenityImage}
          contentFit="cover"
          placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
          transition={200}
        />
        <View style={styles.amenityContent}>
          <Row style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text variant="bodyLarge" weight="semiBold" numberOfLines={1}>
                {item.name}
              </Text>
              {item.locationText && (
                <Text
                  variant="caption"
                  color={theme.colors.textSecondary}
                  numberOfLines={1}
                >
                  {item.locationText}
                </Text>
              )}
            </View>
            <View
              style={[
                styles.statusBadge,
                getStatusBadgeStyle(item.isAvailableForBooking),
              ]}
            >
              <Text
                variant="caption"
                color={getStatusTextColor(item.isAvailableForBooking)}
                weight="medium"
              >
                {item.isAvailableForBooking ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </Row>
          <Row style={styles.metaRow}>
            {item.isBookable && (
              <View style={styles.metaItem}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={theme.colors.primary}
                />
                <Text variant="caption" color={theme.colors.primary} style={styles.metaText}>
                  Bookable
                </Text>
              </View>
            )}
            {item.depositRequired && (
              <View style={styles.metaItem}>
                <Ionicons
                  name="card-outline"
                  size={14}
                  color={theme.colors.warning}
                />
                <Text variant="caption" color={theme.colors.warning} style={styles.metaText}>
                  Deposit Required
                </Text>
              </View>
            )}
          </Row>
        </View>
      </Card>
    </TouchableOpacity>
  );

  // Loading state
  if (isLoading && !amenitiesData) {
    return (
      <Screen safeArea style={styles.screen}>
        <View style={styles.header}>
          <Text variant="h2" style={styles.headerTitle}>Facilities</Text>
          <TouchableOpacity
            onPress={handleMyBookingsPress}
            style={[styles.myBookingsButton, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }]}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar" size={16} color={theme.colors.primary} />
            <Text variant="bodySmall" weight="semiBold" color={theme.colors.primary}>
              My Bookings
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            variant="body"
            color={theme.colors.textSecondary}
            style={styles.loadingText}
          >
            Loading facilities...
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
          <Text variant="h2" style={styles.headerTitle}>Facilities</Text>
          <TouchableOpacity
            onPress={handleMyBookingsPress}
            style={[styles.myBookingsButton, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }]}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar" size={16} color={theme.colors.primary} />
            <Text variant="bodySmall" weight="semiBold" color={theme.colors.primary}>
              My Bookings
            </Text>
          </TouchableOpacity>
        </View>
        <ErrorState
          title="Unable to Load Facilities"
          message={error?.message || 'Something went wrong. Please try again.'}
          onRetry={() => refetch()}
        />
      </Screen>
    );
  }

  const amenities = amenitiesData?.items || [];

  return (
    <Screen safeArea style={styles.screen}>
      <View style={styles.header}>
        <Text variant="h2" style={styles.headerTitle}>Facilities</Text>
        <TouchableOpacity
          onPress={handleMyBookingsPress}
          style={[styles.myBookingsButton, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }]}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar" size={16} color={theme.colors.primary} />
          <Text variant="bodySmall" weight="semiBold" color={theme.colors.primary}>
            My Bookings
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={amenities}
        renderItem={renderAmenity}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          amenities.length === 0 ? styles.emptyListContent : styles.listContent
        }

        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }

        ListEmptyComponent={
          <EmptyState
            title="No Facilities Available"
            message="There are no facilities available at this time."
            icon="business-outline"
          />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    flex: 1,
  },
  myBookingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  amenityCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  amenityImage: {
    width: '100%',
    height: 150,
  },
  amenityContent: {
    padding: 16,
  },
  titleRow: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  metaRow: {
    marginTop: 8,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    marginLeft: 2,
  },
});

export default FacilityScreen;
