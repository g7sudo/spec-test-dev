import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/core/theme';
import { Screen } from '@/shared/components';
import { HomeStackParamList } from '@/app/navigation/types';
import { QUICK_ACTIONS } from '@/core/config/constants';
import {
  HomeHeader,
  BillDrawer,
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

  return (
    <Screen style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
          />
        }
      >
        <HomeHeader
          onAvatarPress={handleAvatarPress}
          onNotificationsPress={handleNotificationsPress}
          unreadNotifications={unreadNotifications}
        />

        <BillDrawer bill={bill} onPayNow={handlePayBill} />

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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});

export default HomeScreen;
