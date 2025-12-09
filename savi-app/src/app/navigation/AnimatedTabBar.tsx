import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useScrollDirection } from '@/core/contexts/ScrollDirectionContext';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * AnimatedTabBar Component
 * 
 * Custom tab bar that slides down when scrolling up and slides up when scrolling down.
 * Provides smooth animations for better UX.
 */
export const AnimatedTabBar: React.FC<BottomTabBarProps> = (props) => {
  const { isScrollingUp } = useScrollDirection();
  const insets = useSafeAreaInsets();
  
  // Calculate tab bar height consistently with MainNavigator
  // Base height: 60 (8 padding top + 44 content + 8 padding bottom)
  // Plus safe area bottom inset on iOS
  // Use useMemo to prevent recalculation on every render
  const baseHeight = 60;
  const tabBarHeight = useMemo(() => {
    return Platform.select({
      ios: baseHeight + insets.bottom,
      android: baseHeight,
    });
  }, [insets.bottom]);

  // Check if tab bar should be hidden via display: 'none' (from screen options)
  const currentRoute = props.state.routes[props.state.index];
  const currentDescriptor = props.descriptors[currentRoute.key];
  const tabBarStyle = currentDescriptor?.options?.tabBarStyle as any;
  const shouldHideViaDisplay = tabBarStyle?.display === 'none';

  // Track previous shouldHideViaDisplay to detect transitions
  // Initialize ref on first render to track the initial state
  const prevShouldHideViaDisplayRef = useRef(shouldHideViaDisplay);
  // Track previous route name to detect tab switches
  const prevRouteNameRef = useRef(currentRoute.name);
  
  // Shared value for animation (needed for useAnimatedStyle)
  // Initialize based on current state to prevent immediate jumps
  // If we're on a nested page initially, start hidden
  const translateY = useSharedValue(shouldHideViaDisplay ? tabBarHeight : 0);
  const opacity = useSharedValue(shouldHideViaDisplay ? 0 : 1);
  
  // Track if we should render the BottomTabBar (for conditional rendering)
  // This helps prevent React Navigation's display: 'none' from interfering
  const [shouldRenderTabBar, setShouldRenderTabBar] = useState(!shouldHideViaDisplay);
  
  // Sync shouldRenderTabBar with shouldHideViaDisplay state
  // But delay hiding to allow animation to complete
  useEffect(() => {
    if (shouldHideViaDisplay && shouldRenderTabBar) {
      // Delay hiding to allow animation to complete
      const timer = setTimeout(() => setShouldRenderTabBar(false), 300);
      return () => clearTimeout(timer);
    } else if (!shouldHideViaDisplay && !shouldRenderTabBar) {
      // Show immediately when not hiding (for smooth transition back)
      setShouldRenderTabBar(true);
    }
  }, [shouldHideViaDisplay, shouldRenderTabBar]);

  // Update shared values when scroll direction changes or display state changes
  // Use useLayoutEffect to ensure animation starts before React Navigation applies display: 'none'
  useLayoutEffect(() => {
    const prevShouldHideViaDisplay = prevShouldHideViaDisplayRef.current;
    const prevRouteName = prevRouteNameRef.current;
    const isTransitioningToNested = !prevShouldHideViaDisplay && shouldHideViaDisplay;
    const isTransitioningFromNested = prevShouldHideViaDisplay && !shouldHideViaDisplay;
    // Detect if we switched to a different main screen (tab switch)
    const switchedToMainScreen = prevRouteName !== currentRoute.name && !shouldHideViaDisplay;
    
    // Update refs for next comparison
    prevShouldHideViaDisplayRef.current = shouldHideViaDisplay;
    prevRouteNameRef.current = currentRoute.name;

    console.log('[AnimatedTabBar] 🎬 Animation state changed:', {
      isScrollingUp,
      shouldHideViaDisplay,
      prevShouldHideViaDisplay,
      isTransitioningToNested,
      isTransitioningFromNested,
      routeName: currentRoute.name,
      tabBarHeight,
      currentTranslateY: translateY.value,
      currentOpacity: opacity.value,
    });

    // Priority 1: Handle navigation transitions (nested pages)
    // When navigating TO a nested page, smoothly hide the tab bar
    if (isTransitioningToNested) {
      console.log('[AnimatedTabBar] 📄 Navigating to nested page - smoothly hiding tab bar');
      // Start animation immediately - use current values as starting point
      translateY.value = withTiming(tabBarHeight, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      opacity.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      // Hide BottomTabBar after animation completes
      setTimeout(() => setShouldRenderTabBar(false), 300);
      return;
    }
    
    // When navigating BACK from a nested page, smoothly show the tab bar
    if (isTransitioningFromNested) {
      console.log('[AnimatedTabBar] 🔙 Navigating back from nested page - smoothly showing tab bar');
      // Show BottomTabBar immediately so it can animate in
      setShouldRenderTabBar(true);
      // Ensure we start from hidden state (in case we're already hidden)
      // This prevents immediate jumps
      if (translateY.value >= tabBarHeight * 0.5) {
        translateY.value = tabBarHeight; // Start from hidden
        opacity.value = 0;
      }
      // Then animate to visible
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      opacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      return;
    }

    // Priority 2: If currently on a nested page, keep it hidden
    // Don't respond to scroll direction when on nested pages
    // Also ensure it stays hidden (in case animation didn't complete)
    if (shouldHideViaDisplay) {
      // Ensure it's fully hidden (in case of any race conditions)
      if (translateY.value < tabBarHeight * 0.9) {
        translateY.value = withTiming(tabBarHeight, {
          duration: 200, // Faster since we're just ensuring it's hidden
          easing: Easing.out(Easing.ease),
        });
        opacity.value = withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.ease),
        });
      }
      return;
    }

    // Priority 3: Respond to scroll direction (only on main screens)
    // When scrolling up → hide navbar for full-screen experience
    // When scrolling down (even slightly) → show navbar so users can navigate
    
    // If we just switched to a different main screen (tab switch), show navbar immediately
    // This handles the case when switching tabs while navbar was hidden from previous screen
    if (switchedToMainScreen) {
      console.log('[AnimatedTabBar] 🔄 Switched to main screen - showing navbar');
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      opacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      return;
    }
    
    if (isScrollingUp) {
      // Hide tab bar - slide down smoothly
      // This gives users a full-screen view when scrolling up
      console.log('[AnimatedTabBar] 👆 Scrolling UP - hiding navbar for full-screen view');
      translateY.value = withTiming(tabBarHeight, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      opacity.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    } else {
      // Show tab bar - slide up smoothly
      // Even a small scroll down will show the navbar, making it easy to navigate
      console.log('[AnimatedTabBar] 👇 Scrolling DOWN - showing navbar for navigation');
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      opacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [isScrollingUp, shouldHideViaDisplay, tabBarHeight, translateY, opacity, currentRoute.name]);

  // Animated style for slide up/down effect
  const animatedStyle = useAnimatedStyle(() => {
    const isHidden = translateY.value >= tabBarHeight * 0.5; // Consider hidden when halfway down
    
    return {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      height: isHidden ? 0 : tabBarHeight, // Set height to 0 when hidden to remove space
      overflow: 'hidden' as const,
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
      // When hidden, ensure it doesn't block touches
      pointerEvents: isHidden ? 'none' : 'auto',
    };
  }, [tabBarHeight]);

  return (
    <Animated.View style={animatedStyle}>
      {/* Conditionally render BottomTabBar to prevent React Navigation's display: 'none' from interfering */}
      {shouldRenderTabBar && <BottomTabBar {...props} />}
    </Animated.View>
  );
};

