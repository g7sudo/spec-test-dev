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
  
  // Billboard drawer state - expanded by default on fresh load
  const [isBillboardExpanded, setIsBillboardExpanded] = useState(true);
  const [scrollOffset, setScrollOffset] = useState(0);
  const scrollViewRef = useRef<ScrollViewType>(null);
  const lastScrollOffset = useRef(0);
  const scrollStartOffset = useRef(0);
  
  // Shared value for scroll offset - used for seamless billboard collapse
  const scrollOffsetShared = useSharedValue(0);
  
  // Threshold for collapse (matches BillDrawer constant)
  const COLLAPSE_SCROLL_THRESHOLD = 50;

  // Debug: Log state changes
  React.useEffect(() => {
    console.log('[HomeScreen] 🎯 State changed: isBillboardExpanded =', isBillboardExpanded);
  }, [isBillboardExpanded]);
  
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
    console.log('[HomeScreen] 🔽 handleCollapseDrawer called - setting isBillboardExpanded to false');
    setIsBillboardExpanded(false);
  }, []);

  const handleExpandDrawer = useCallback(() => {
    console.log('[HomeScreen] 🔼 handleExpandDrawer called - setting isBillboardExpanded to true');
    setIsBillboardExpanded(true);
    // Reset scroll offset when expanding to ensure smooth transition
    scrollOffsetShared.value = 0;
  }, []);

  // Handle scroll begin - track scroll start position
  const handleScrollBeginDrag = useCallback((event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    scrollStartOffset.current = offset;
    lastScrollOffset.current = offset;
    
    console.log('[HomeScreen] 📜 Scroll drag started at offset:', offset, 'isBillboardExpanded:', isBillboardExpanded);
  }, [isBillboardExpanded]);

  // Track scroll position - update shared value for seamless billboard collapse
  const handleScroll = useCallback((event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    
    // Update shared value for seamless billboard collapse
    scrollOffsetShared.value = offset;
    
    setScrollOffset(offset);
    lastScrollOffset.current = offset;
    
    // Auto-collapse when scrolled past threshold (with hysteresis to prevent flickering)
    if (isBillboardExpanded && offset > COLLAPSE_SCROLL_THRESHOLD) {
      setIsBillboardExpanded(false);
    }
    
    // Auto-expand when scrolled back to top (with hysteresis)
    if (!isBillboardExpanded && offset <= 5) {
      setIsBillboardExpanded(true);
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
        contentContainerStyle={styles.scrollContent}
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
