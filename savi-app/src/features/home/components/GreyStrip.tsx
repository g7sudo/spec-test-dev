import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

interface GreyStripProps {
  onPullUp?: () => void; // Called when user pulls up (to collapse drawer)
  onPullDown?: () => void; // Called when user pulls down (to expand drawer)
  isDrawerExpanded: boolean; // Whether the drawer above is expanded
  isScrollAtTop: boolean; // Whether scroll position is at the top
}

/**
 * GreyStrip Component
 * 
 * Always visible grey strip that sits at the top edge of the scrollable content area.
 * Acts as a handle for expanding/collapsing the billboard drawer above it.
 * 
 * Behavior:
 * - Pull up on strip → collapses drawer (if expanded)
 * - Pull down on strip → expands drawer (if collapsed)
 */
export const GreyStrip: React.FC<GreyStripProps> = ({
  onPullUp,
  onPullDown,
  isDrawerExpanded,
  isScrollAtTop,
}) => {
  // Gesture handler for pull interactions
  // Only works when scroll is at the top
  const panGesture = Gesture.Pan()
    .enabled(isScrollAtTop) // Only enable when scroll is at top
    .activeOffsetY([-5, 5]) // Lower threshold for easier activation
    .failOffsetX([-30, 30]) // Fail if horizontal movement exceeds 30px
    .minPointers(1)
    .maxPointers(1)
    .onEnd((event) => {
      // Only allow interactions when scroll is at top
      if (!isScrollAtTop) return;

      const threshold = 30; // Minimum movement to trigger action
      
      if (event.translationY < -threshold || event.velocityY < -300) {
        // Pulled up - collapse drawer if expanded
        if (isDrawerExpanded && onPullUp) {
          runOnJS(onPullUp)();
        }
      } else if (event.translationY > threshold || event.velocityY > 300) {
        // Pulled down - expand drawer if collapsed
        if (!isDrawerExpanded && onPullDown) {
          runOnJS(onPullDown)();
        }
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <View style={styles.handleBar} />
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 20, // Fixed height for the strip
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Transparent background - only handle bar visible
    paddingVertical: 8,
    // Ensure it stays on top when sticky
    zIndex: 10,
    elevation: 10, // For Android
  },
  handleBar: {
    width: 60,
    height: 4,
    backgroundColor: '#E0E0E0', // Grey color for the handle bar
    borderRadius: 2,
  },
});

export default GreyStrip;
