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
    .onStart(() => {
      console.log('[GreyStrip] Gesture started', {
        isScrollAtTop,
        isDrawerExpanded,
      });
    })
    .onUpdate((event) => {
      // Log during gesture for debugging
      if (Math.abs(event.translationY) > 20) {
        console.log('[GreyStrip] Gesture update', {
          translationY: event.translationY,
          velocityY: event.velocityY,
        });
      }
    })
    .onEnd((event) => {
      console.log('[GreyStrip] Gesture ended', {
        translationY: event.translationY,
        velocityY: event.velocityY,
        isScrollAtTop,
        isDrawerExpanded,
      });

      // Only allow interactions when scroll is at top
      if (!isScrollAtTop) {
        console.log('[GreyStrip] ❌ Blocked: scroll not at top');
        return;
      }

      const threshold = 30; // Minimum movement to trigger action
      
      if (event.translationY < -threshold || event.velocityY < -300) {
        // Pulled up - collapse drawer if expanded
        console.log('[GreyStrip] ✅ Pull UP detected - attempting collapse');
        if (isDrawerExpanded && onPullUp) {
          runOnJS(onPullUp)();
        } else {
          console.log('[GreyStrip] ❌ Cannot collapse:', {
            isDrawerExpanded,
            hasCallback: !!onPullUp,
          });
        }
      } else if (event.translationY > threshold || event.velocityY > 300) {
        // Pulled down - expand drawer if collapsed
        console.log('[GreyStrip] ✅ Pull DOWN detected - attempting expand');
        if (!isDrawerExpanded && onPullDown) {
          runOnJS(onPullDown)();
        } else {
          console.log('[GreyStrip] ❌ Cannot expand:', {
            isDrawerExpanded,
            hasCallback: !!onPullDown,
          });
        }
      } else {
        console.log('[GreyStrip] ⚠️ Gesture threshold not met:', {
          translationY: event.translationY,
          threshold,
          velocityY: event.velocityY,
        });
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

