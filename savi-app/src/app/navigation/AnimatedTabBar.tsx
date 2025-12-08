import React, { useEffect } from 'react';
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
  
  const tabBarHeight = Platform.select({
    ios: 60 + insets.bottom,
    android: 60,
  });

  // Shared value for animation (needed for useAnimatedStyle)
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Update shared values when scroll direction changes
  useEffect(() => {
    console.log('[AnimatedTabBar] 🎬 Animation state changed:', {
      isScrollingUp,
      tabBarHeight,
      currentTranslateY: translateY.value,
      currentOpacity: opacity.value,
    });

    if (isScrollingUp) {
      // Hide tab bar - slide down
      console.log('[AnimatedTabBar] 👆 Animating HIDE - sliding down');
      translateY.value = withTiming(tabBarHeight, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      opacity.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    } else {
      // Show tab bar - slide up
      console.log('[AnimatedTabBar] 👇 Animating SHOW - sliding up');
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      opacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [isScrollingUp, tabBarHeight, translateY, opacity]);

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
      <BottomTabBar {...props} />
    </Animated.View>
  );
};

