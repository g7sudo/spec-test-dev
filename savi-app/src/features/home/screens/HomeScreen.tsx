import React, { useCallback, useState, useRef } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import type { ScrollView as ScrollViewType } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/core/theme';
import { Screen } from '@/shared/components';
import { HomeStackParamList } from '@/app/navigation/types';
import { QUICK_ACTIONS } from '@/core/config/constants';
import { useScrollDirection } from '@/core/contexts/ScrollDirectionContext';
import {
  HomeHeader,
  BillDrawer,
  GreyStrip,
  HouseholdAvatars,
  QuickActionsGrid,
  MyVisitorsSection,
  MyRequestsSection,
  CommunityFeedsSection,
  PromoBanner,
  FeaturedCarousel,
} from '../components';
import { useHomeData } from '../hooks/useHomeData';

type HomeNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

export const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<HomeNavigationProp>();
  const { setIsScrollingUp, isScrollingUp } = useScrollDirection();
  
  // Billboard drawer state - expanded by default on fresh load
  const [isBillboardExpanded, setIsBillboardExpanded] = useState(true);
  const [scrollOffset, setScrollOffset] = useState(0);
  const scrollViewRef = useRef<ScrollViewType>(null);
  const lastScrollOffset = useRef(0);
  const scrollStartOffset = useRef(0);
  const stateChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastStateChangeTime = useRef(0);
  const scrollDirectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBottomNavDirectionRef = useRef<'up' | 'down' | null>(null); // Track last direction to avoid resetting timeout
  
  // Shared value for scroll offset - used for seamless billboard collapse
  const scrollOffsetShared = useSharedValue(0);
  
  // Threshold for collapse (matches BillDrawer constant)
  const COLLAPSE_SCROLL_THRESHOLD = 50;
  const EXPAND_THRESHOLD = 5; // Threshold for expand (must be at top)
  const MIN_STATE_CHANGE_INTERVAL = 300; // Minimum time between state changes (ms)
  const DRAWER_HEIGHT = 140; // Matches BillDrawer DRAWER_HEIGHT constant
  
  // Helper function to calculate expected height based on scroll (for logging)
  const calculateExpectedHeight = (scroll: number, isExpanded: boolean): number => {
    if (!isExpanded) return 0;
    const clampedScroll = Math.max(0, Math.min(scroll, COLLAPSE_SCROLL_THRESHOLD));
    return DRAWER_HEIGHT - (clampedScroll / COLLAPSE_SCROLL_THRESHOLD) * DRAWER_HEIGHT;
  };
  
  // Helper function to calculate expected opacity based on scroll (for logging)
  const calculateExpectedOpacity = (scroll: number, isExpanded: boolean): number => {
    if (!isExpanded) return 0;
    const clampedScroll = Math.max(0, scroll);
    if (clampedScroll <= COLLAPSE_SCROLL_THRESHOLD * 0.4) {
      // Interpolate from 1 to 0.3
      const t = clampedScroll / (COLLAPSE_SCROLL_THRESHOLD * 0.4);
      return 1 - (t * 0.7);
    } else if (clampedScroll <= COLLAPSE_SCROLL_THRESHOLD) {
      // Interpolate from 0.3 to 0
      const t = (clampedScroll - COLLAPSE_SCROLL_THRESHOLD * 0.4) / (COLLAPSE_SCROLL_THRESHOLD * 0.6);
      return 0.3 - (t * 0.3);
    }
    return 0;
  };

  // Note: Debug logging removed to prevent console spam
  // Billboard expanded state is managed internally

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (stateChangeTimeoutRef.current) {
        clearTimeout(stateChangeTimeoutRef.current);
      }
      if (scrollDirectionTimeoutRef.current) {
        clearTimeout(scrollDirectionTimeoutRef.current);
      }
    };
  }, []);
  
  const {
    bill,
    householdMembers,
    visitors,
    maintenanceRequests,
    feedPosts,
    promoBanner,
    featuredOffers,
    unreadNotifications,
    unreadAnnouncements,
    isLoading,
    refetch,
  } = useHomeData();

  const handleAvatarPress = useCallback(() => {
    // Navigate to profile
    console.log('Navigate to profile');
  }, []);

  const handleNotificationsPress = useCallback(() => {
    navigation.navigate('Notifications');
  }, [navigation]);

  const handlePayBill = useCallback((billId: string) => {
    // Navigate to bill payment
    console.log('Pay bill:', billId);
  }, []);

  const handleMemberPress = useCallback((memberId: string) => {
    // Navigate to member profile
    console.log('View member:', memberId);
  }, []);

  const handleQuickAction = useCallback(
    (actionId: string) => {
      switch (actionId) {
        case QUICK_ACTIONS.PRE_REGISTER_VISITOR:
          // Navigate to pre-register visitor
          console.log('Pre-register visitor');
          break;
        case QUICK_ACTIONS.MAINTENANCE_REQUEST:
          navigation.navigate('CreateMaintenance');
          break;
        case QUICK_ACTIONS.GIVE_FEEDBACK:
          // Navigate to feedback
          console.log('Give feedback');
          break;
        case QUICK_ACTIONS.BOOK_FACILITY:
          // Navigate to facility booking
          console.log('Book facility');
          break;
        case QUICK_ACTIONS.EMERGENCY:
          // Navigate to emergency screen
          console.log('Emergency');
          break;
        case QUICK_ACTIONS.ANNOUNCEMENTS:
          // Navigate to announcements
          console.log('Announcements');
          break;
      }
    },
    [navigation]
  );

  const handleViewAllVisitors = useCallback(() => {
    // Navigate to visitors list
    console.log('View all visitors');
  }, []);

  const handleVisitorPress = useCallback((visitorId: string) => {
    // Navigate to visitor detail
    console.log('View visitor:', visitorId);
  }, []);

  const handlePreRegisterVisitor = useCallback(() => {
    // Navigate to pre-register visitor
    console.log('Pre-register visitor');
  }, []);

  const handleViewRequestDetails = useCallback(
    (requestId: string) => {
      navigation.navigate('MaintenanceDetail', { requestId });
    },
    [navigation]
  );

  const handleCreateRequest = useCallback(() => {
    navigation.navigate('CreateMaintenance');
  }, [navigation]);

  const handleViewAllFeeds = useCallback(() => {
    // Navigate to community feed
    console.log('View all feeds');
  }, []);

  const handlePostPress = useCallback((postId: string) => {
    // Navigate to post detail
    console.log('View post:', postId);
  }, []);

  const handleLikePost = useCallback((postId: string) => {
    // Toggle like
    console.log('Like post:', postId);
  }, []);

  const handleCommentPost = useCallback((postId: string) => {
    // Navigate to comments
    console.log('Comment on post:', postId);
  }, []);

  const handleBannerPress = useCallback((bannerId: string) => {
    // Navigate to campaign
    console.log('Banner pressed:', bannerId);
  }, []);

  const handleOfferPress = useCallback((offerId: string) => {
    // Navigate to offer
    console.log('Offer pressed:', offerId);
  }, []);

  // Handlers for billboard drawer expand/collapse
  const handleCollapseDrawer = useCallback(() => {
    setIsBillboardExpanded(false);
  }, []);

  const handleExpandDrawer = useCallback(() => {
    setIsBillboardExpanded(true);
    // Reset scroll offset when expanding to ensure smooth transition
    scrollOffsetShared.value = 0;
  }, []);

  // Handle scroll begin - track scroll start position
  const handleScrollBeginDrag = useCallback((event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    scrollStartOffset.current = offset;
    lastScrollOffset.current = offset;
  }, []);

  // Track scroll position - update shared value for seamless billboard collapse
  // The scroll-driven animation handles the visual collapse, state only tracks for programmatic control
  const handleScroll = useCallback((event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    const clampedOffset = Math.max(0, offset); // Clamp to prevent negative values from bounce
    
    // Detect scroll direction for bottom nav visibility
    // More sensitive threshold for scroll down detection (shows navbar sooner)
    const scrollDelta = clampedOffset - lastScrollOffset.current;
    const isScrollingUpward = scrollDelta > 1.5; // Threshold to prevent jitter (slightly lower for responsiveness)
    const isScrollingDownward = scrollDelta < -1; // More sensitive - even small scroll down shows navbar
    
    // Track time for debouncing state changes
    const now = Date.now();
    
    // Update bottom nav visibility based on scroll direction
    // Behavior:
    // - Scrolling UP → Hide navbar for full-screen experience
    // - Scrolling DOWN (even slightly) → Show navbar so users can navigate
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
    
    // Update shared value for seamless billboard collapse (this drives the smooth animation)
    scrollOffsetShared.value = clampedOffset;
    
    setScrollOffset(clampedOffset);
    lastScrollOffset.current = clampedOffset;
    
    // Prevent rapid state changes - enforce minimum interval
    // Reuse 'now' variable declared earlier for bottom nav logging
    const timeSinceLastChange = now - lastStateChangeTime.current;
    
    // Auto-collapse state when scrolled past threshold
    // Only trigger if enough time has passed and no pending timeout exists
    if (
      isBillboardExpanded && 
      clampedOffset > COLLAPSE_SCROLL_THRESHOLD &&
      timeSinceLastChange > MIN_STATE_CHANGE_INTERVAL &&
      !stateChangeTimeoutRef.current
    ) {
      console.log('[HomeScreen] ⏳ Setting collapse timeout...');
      stateChangeTimeoutRef.current = setTimeout(() => {
        const currentOffset = Math.max(0, scrollOffsetShared.value);
        console.log('[HomeScreen] ⏰ Collapse timeout fired:', {
          currentOffset: currentOffset.toFixed(2),
          threshold: COLLAPSE_SCROLL_THRESHOLD,
          willCollapse: currentOffset > COLLAPSE_SCROLL_THRESHOLD,
        });
        if (currentOffset > COLLAPSE_SCROLL_THRESHOLD) {
          console.log('[HomeScreen] 📜 ✅ Auto-collapsing billboard at offset:', currentOffset.toFixed(2));
          lastStateChangeTime.current = Date.now();
          setIsBillboardExpanded(false);
        } else {
          console.log('[HomeScreen] 📜 ❌ Collapse cancelled - offset below threshold');
        }
        stateChangeTimeoutRef.current = null;
      }, 150); // Reduced delay for faster state updates
    }
    
    // Auto-expand state when scrolled back to top
    if (
      !isBillboardExpanded && 
      clampedOffset <= EXPAND_THRESHOLD &&
      offset >= 0 && // Don't expand on negative bounce
      timeSinceLastChange > MIN_STATE_CHANGE_INTERVAL &&
      !stateChangeTimeoutRef.current
    ) {
      console.log('[HomeScreen] ⏳ Setting expand timeout...');
      stateChangeTimeoutRef.current = setTimeout(() => {
        const currentOffset = Math.max(0, scrollOffsetShared.value);
        console.log('[HomeScreen] ⏰ Expand timeout fired:', {
          currentOffset: currentOffset.toFixed(2),
          threshold: EXPAND_THRESHOLD,
          willExpand: currentOffset <= EXPAND_THRESHOLD && currentOffset >= 0,
        });
        if (currentOffset <= EXPAND_THRESHOLD && currentOffset >= 0) {
          console.log('[HomeScreen] 📜 ✅ Auto-expanding billboard at offset:', currentOffset.toFixed(2));
          lastStateChangeTime.current = Date.now();
          setIsBillboardExpanded(true);
        } else {
          console.log('[HomeScreen] 📜 ❌ Expand cancelled - offset above threshold');
        }
        stateChangeTimeoutRef.current = null;
      }, 150); // Reduced delay for faster state updates
    }
  }, [isBillboardExpanded, scrollOffsetShared]);

  return (
    <Screen style={styles.screen} safeArea={false}>
      {/* Fixed Header Area - Always visible */}
      <View style={[styles.headerArea, { backgroundColor: '#FFE69C' }]}>
        <HomeHeader
          onAvatarPress={handleAvatarPress}
          onNotificationsPress={handleNotificationsPress}
          unreadNotifications={unreadNotifications}
        />

        {/* Billboard Banner - Always rendered but animated */}
        {bill && (
          <BillDrawer
            bill={bill}
            onPayNow={handlePayBill}
            isExpanded={isBillboardExpanded}
            scrollOffset={scrollOffsetShared}
            onCollapse={handleCollapseDrawer}
            onExpand={handleExpandDrawer}
          />
        )}
      </View>

      {/* Scrollable Page Content - Only this area scrolls */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          // Remove bottom padding when nav is hidden to eliminate blank space
          { paddingBottom: isScrollingUp ? 24 : 24 }, // Keep same padding for now, will adjust if needed
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        scrollEventThrottle={16}
        scrollEnabled={true} // Always allow scroll - collapse happens organically
        stickyHeaderIndices={[0]} // Make GreyStrip sticky at top
        // When at top, allow our gesture to take priority
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Grey Strip - Always sticky at top of scrollable content */}
        <GreyStrip
          isDrawerExpanded={isBillboardExpanded}
          onPullUp={handleCollapseDrawer}
          onPullDown={handleExpandDrawer}
          isScrollAtTop={scrollOffset <= 1} // Allow small threshold for floating point precision
        />

        <HouseholdAvatars
          members={householdMembers}
          onMemberPress={handleMemberPress}
        />

        <QuickActionsGrid
          onActionPress={handleQuickAction}
          unreadAnnouncements={unreadAnnouncements}
        />

        <MyVisitorsSection
          visitors={visitors}
          onViewAll={handleViewAllVisitors}
          onVisitorPress={handleVisitorPress}
          onPreRegister={handlePreRegisterVisitor}
        />

        <MyRequestsSection
          requests={maintenanceRequests}
          onViewDetails={handleViewRequestDetails}
          onCreateRequest={handleCreateRequest}
        />

        <CommunityFeedsSection
          posts={feedPosts}
          onViewAll={handleViewAllFeeds}
          onPostPress={handlePostPress}
          onLikePress={handleLikePost}
          onCommentPress={handleCommentPost}
        />

        <PromoBanner banner={promoBanner} onPress={handleBannerPress} />

        <FeaturedCarousel
          offers={featuredOffers}
          onOfferPress={handleOfferPress}
        />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Fixed header area - contains header and billboard drawer
  headerArea: {
    paddingBottom: 0, // No padding - grey strip follows immediately
  },
  // Scrollable content area - only this scrolls
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 24,
  },
});

export default HomeScreen;
