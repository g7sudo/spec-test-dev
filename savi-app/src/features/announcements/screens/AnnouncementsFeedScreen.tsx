/**
 * AnnouncementsFeedScreen
 * 
 * Main screen for viewing announcements feed.
 * Features category filtering, infinite scroll, and pull-to-refresh.
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/core/theme';
import { Screen, Text } from '@/shared/components';
import { useTranslation } from 'react-i18next';
import { CommunityStackParamList } from '@/app/navigation/types';
import { useScrollDirection } from '@/core/contexts/ScrollDirectionContext';
import {
  AnnouncementSummaryDto,
  AnnouncementCategory,
} from '@/services/api/announcements';
import { useAnnouncementsFeedInfinite, useToggleLike } from '../hooks';
import { AnnouncementCard, CategoryFilter } from '../components';

type NavigationProp = NativeStackNavigationProp<CommunityStackParamList, 'CommunityMain'>;

/**
 * AnnouncementsFeedScreen - Full feed with category filtering
 * 
 * Features:
 * - Category filter chips at the top
 * - Infinite scroll with pagination
 * - Pull-to-refresh
 * - Empty state
 * - Loading and error states
 */
export const AnnouncementsFeedScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('announcements');
  const navigation = useNavigation<NavigationProp>();
  const { setIsScrollingUp } = useScrollDirection();

  // Refs for scroll tracking (navbar hide/show)
  const lastScrollOffset = useRef(0);
  const scrollDirectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBottomNavDirectionRef = useRef<'up' | 'down' | null>(null);

  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<AnnouncementCategory | null>(null);

  // Track liked states for optimistic UI (key: announcementId, value: isLiked)
  const [likedStates, setLikedStates] = useState<Record<string, boolean>>({});

  // Like mutation hook
  const { toggleLike, isToggling } = useToggleLike();

  // Fetch announcements with infinite scroll
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = useAnnouncementsFeedInfinite({
    category: selectedCategory || undefined,
    pageSize: 15,
  });

  // Flatten pages into single list
  const announcements = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.items);
  }, [data?.pages]);

  // Handlers
  const handleAnnouncementPress = useCallback(
    (id: string) => {
      navigation.navigate('AnnouncementDetail', { announcementId: id });
    },
    [navigation]
  );

  // Handle like toggle directly in the feed (no navigation)
  const handleLikePress = useCallback((id: string) => {
    // Find the announcement to get its current like state
    const announcement = announcements.find((a) => a.id === id);
    if (!announcement) return;

    // Use local state if exists, otherwise use API state (hasLiked from backend)
    const currentlyLiked = likedStates[id] ?? announcement.hasLiked ?? false;
    const newLikedState = !currentlyLiked;

    // Optimistic update
    setLikedStates((prev) => ({ ...prev, [id]: newLikedState }));

    // Call API
    toggleLike(
      { announcementId: id, isCurrentlyLiked: currentlyLiked },
      {
        onError: () => {
          // Revert on error
          setLikedStates((prev) => ({ ...prev, [id]: currentlyLiked }));
        },
      }
    );
  }, [announcements, likedStates, toggleLike]);

  const handleCommentPress = useCallback(
    (id: string) => {
      // Navigate to detail screen with focus on comments
      navigation.navigate('AnnouncementDetail', { announcementId: id });
    },
    [navigation]
  );

  const handleCategorySelect = useCallback((category: AnnouncementCategory | null) => {
    setSelectedCategory(category);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

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
    const scrollDelta = clampedOffset - lastScrollOffset.current;
    const isScrollingUpward = scrollDelta > 1.5; // Threshold to prevent jitter
    const isScrollingDownward = scrollDelta < -1; // More sensitive - shows navbar quickly
    
    // Only hide when scrolling up past a small threshold
    const shouldHide = isScrollingUpward && clampedOffset > 10;
    // Show navbar when scrolling down OR when near top
    const shouldShow = isScrollingDownward || clampedOffset <= 10;
    
    // Determine current direction
    const currentDirection: 'up' | 'down' | null = shouldHide ? 'up' : (shouldShow ? 'down' : null);
    
    // Only set timeout if direction changed
    const directionChanged = currentDirection !== null && currentDirection !== lastBottomNavDirectionRef.current;
    
    if (shouldHide && (directionChanged || !scrollDirectionTimeoutRef.current)) {
      if (scrollDirectionTimeoutRef.current) {
        clearTimeout(scrollDirectionTimeoutRef.current);
        scrollDirectionTimeoutRef.current = null;
      }

      lastBottomNavDirectionRef.current = 'up';
      scrollDirectionTimeoutRef.current = setTimeout(() => {
        setIsScrollingUp(true);
        scrollDirectionTimeoutRef.current = null;
        lastBottomNavDirectionRef.current = null;
      }, 30);
    } else if (shouldShow && (directionChanged || !scrollDirectionTimeoutRef.current)) {
      if (scrollDirectionTimeoutRef.current) {
        clearTimeout(scrollDirectionTimeoutRef.current);
        scrollDirectionTimeoutRef.current = null;
      }

      lastBottomNavDirectionRef.current = 'down';
      scrollDirectionTimeoutRef.current = setTimeout(() => {
        setIsScrollingUp(false);
        scrollDirectionTimeoutRef.current = null;
        lastBottomNavDirectionRef.current = null;
      }, 30);
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

  // Render item with like state from local tracking
  const renderItem = useCallback(
    ({ item }: { item: AnnouncementSummaryDto }) => (
      <AnnouncementCard
        announcement={item}
        onPress={handleAnnouncementPress}
        onLikePress={handleLikePress}
        onCommentPress={handleCommentPress}
        isLiked={likedStates[item.id] ?? item.hasLiked ?? false}
      />
    ),
    [handleAnnouncementPress, handleLikePress, handleCommentPress, likedStates]
  );

  // Key extractor
  const keyExtractor = useCallback((item: AnnouncementSummaryDto) => item.id, []);

  // Empty state
  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text variant="body" color={theme.colors.textSecondary} align="center">
          {selectedCategory
            ? t('noAnnouncementsInCategory', { defaultValue: 'No announcements in this category' })
            : t('noAnnouncements', { defaultValue: 'No announcements yet' })}
        </Text>
      </View>
    );
  }, [isLoading, selectedCategory, t, theme.colors.textSecondary]);

  // Footer loading indicator
  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }, [isFetchingNextPage, theme.colors.primary]);

  // Header with category filter
  const renderHeader = useCallback(
    () => (
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
        showAllOption
      />
    ),
    [selectedCategory, handleCategorySelect]
  );

  // Error state
  if (isError && !announcements.length) {
    return (
      <Screen safeArea style={styles.screen}>
        <View style={styles.header}>
          <Text variant="h2">{t('title', { defaultValue: 'Announcements' })}</Text>
        </View>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Text variant="body" color={theme.colors.error} align="center">
            {error?.message || t('errorLoading', { defaultValue: 'Error loading announcements' })}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h2">{t('title', { defaultValue: 'Announcements' })}</Text>
      </View>

      {/* Category Filter */}
      {renderHeader()}

      {/* Feed List */}
      <FlatList
        data={announcements}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        // Scroll handlers for navbar hide/show
        onScrollBeginDrag={handleScrollBeginDrag}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        // Performance optimizations
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
      />

      {/* Initial Loading State */}
      {isLoading && !announcements.length && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});

export default AnnouncementsFeedScreen;

