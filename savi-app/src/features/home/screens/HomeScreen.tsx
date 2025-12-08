import React, { useCallback, useState, useRef } from 'react';
import { View, StyleSheet, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import type { ScrollView as ScrollViewType } from 'react-native-gesture-handler';
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
  }, []);

  // Track scroll position to enable interactions only at top
  const handleScroll = useCallback((event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    setScrollOffset(offset);
    // Debug log when near top
    if (offset <= 5) {
      console.log('[HomeScreen] 📍 Scroll position:', offset, 'isScrollAtTop:', offset <= 1);
    }
  }, []);

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
        scrollEventThrottle={16}
        scrollEnabled={true}
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

        {/* TEMPORARY DEBUG: Test buttons - Remove after validation */}
        <View style={{ padding: 16, backgroundColor: '#FFF3CD', marginBottom: 8 }}>
          <Text style={{ marginBottom: 8, fontWeight: 'bold' }}>
            Debug: isBillboardExpanded = {isBillboardExpanded ? 'true ✅' : 'false ❌'}
          </Text>
          <Text style={{ marginBottom: 8 }}>
            Scroll Offset: {scrollOffset.toFixed(2)} | isScrollAtTop: {scrollOffset <= 1 ? 'Yes' : 'No'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={handleCollapseDrawer}
              style={{ padding: 8, backgroundColor: '#FF6B6B', borderRadius: 4 }}
            >
              <Text style={{ color: 'white' }}>Force Collapse</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleExpandDrawer}
              style={{ padding: 8, backgroundColor: '#51CF66', borderRadius: 4 }}
            >
              <Text style={{ color: 'white' }}>Force Expand</Text>
            </TouchableOpacity>
          </View>
        </View>

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
