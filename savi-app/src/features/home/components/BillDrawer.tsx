import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
  cancelAnimation,
  interpolate,
  Extrapolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@/core/theme';
import { Text, Button, Row } from '@/shared/components';
import { useTranslation } from 'react-i18next';

const DRAWER_HEIGHT = 140; // Height of the drawer when expanded
const COLLAPSE_SCROLL_THRESHOLD = 50; // Scroll distance needed to fully collapse

interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  isOverdue: boolean;
}

interface BillDrawerProps {
  bill: Bill | null;
  onPayNow: (billId: string) => void;
  isExpanded: boolean; // Controlled from parent
  scrollOffset: Animated.SharedValue<number>; // Scroll offset for seamless collapse
  onCollapse?: () => void; // Callback when drawer should collapse
  onExpand?: () => void; // Callback when drawer should expand
}

export const BillDrawer: React.FC<BillDrawerProps> = ({
  bill,
  onPayNow,
  isExpanded,
  scrollOffset,
  onCollapse,
  onExpand,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('home');

  // Track expanded state as shared value for useDerivedValue
  const isExpandedShared = useSharedValue(isExpanded ? 1 : 0);
  const prevExpandedRef = useRef(isExpanded);
  
  // Update shared value with smooth transition to prevent glitches
  // Use withTiming for smooth state transitions that don't conflict with scroll
  useEffect(() => {
    const wasExpanded = prevExpandedRef.current;
    prevExpandedRef.current = isExpanded;
    
    console.log('[BillDrawer] 🔄 State prop changed:', {
      isExpanded,
      wasExpanded,
      prevValue: isExpandedShared.value,
    });
    
    // Only animate if state actually changed
    if (isExpanded !== wasExpanded) {
      if (isExpanded) {
        // Expanding: smooth transition to 1 for natural feel
        isExpandedShared.value = withTiming(1, {
          duration: 150,
          easing: Easing.out(Easing.ease),
        });
      } else {
        // Collapsing: instant transition to 0
        // Scroll-driven animation already handled the visual collapse smoothly
        // State change just locks it at 0, so instant is fine and prevents glitches
        isExpandedShared.value = 0;
      }
    }
  }, [isExpanded, isExpandedShared]);

  // Derived height and opacity that respond to scroll - seamless collapse as you scroll
  // Combines scroll-driven animation with state multiplier for smooth transitions
  const height = useDerivedValue(() => {
    const isExpandedValue = isExpandedShared.value;
    const scroll = Math.max(0, scrollOffset.value);
    
    // Calculate scroll-driven height (always calculated, regardless of state)
    const scrollDrivenHeight = interpolate(
      scroll,
      [0, COLLAPSE_SCROLL_THRESHOLD],
      [DRAWER_HEIGHT, 0],
      Extrapolate.CLAMP
    );
    
    // Apply state multiplier - allows smooth transition when state changes
    // When expanded (1): full scroll-driven height
    // When collapsed (0): height becomes 0
    // Transition between states is smooth due to withTiming
    return scrollDrivenHeight * isExpandedValue;
  });

  // Opacity follows scroll directly for smoother fade - independent of height
  const opacity = useDerivedValue(() => {
    const isExpandedValue = isExpandedShared.value;
    const scroll = Math.max(0, scrollOffset.value);
    
    // Calculate scroll-driven opacity
    const scrollDrivenOpacity = interpolate(
      scroll,
      [0, COLLAPSE_SCROLL_THRESHOLD * 0.4, COLLAPSE_SCROLL_THRESHOLD],
      [1, 0.3, 0],
      Extrapolate.CLAMP
    );
    
    // Apply state multiplier for smooth transitions
    return scrollDrivenOpacity * isExpandedValue;
  });

  if (!bill) {
    return null;
  }

  // Animated styles for smooth expand/collapse - responds to scroll seamlessly
  const animatedContainerStyle = useAnimatedStyle(() => {
    const currentHeight = height.value;
    const currentOpacity = opacity.value;
    const marginTop = interpolate(
      currentHeight,
      [0, 20],
      [0, 12],
      Extrapolate.CLAMP
    );
    
    // Removed logging from animated style to prevent crashes
    // Logging happens in derived values instead
    
    return {
      height: currentHeight,
      opacity: currentOpacity,
      overflow: 'hidden' as const,
      marginTop,
      marginBottom: 0,
    };
  });

  // Content wrapper - no separate animation needed
  const animatedContentStyle = useAnimatedStyle(() => {
    return {};
  });

  const handlePayNow = () => {
    onPayNow(bill.id);
  };

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <Animated.View style={[styles.contentWrapper, animatedContentStyle]}>
        <Row style={styles.topRow}>
          <Row style={styles.titleSection}>
        <View style={styles.iconContainer}>
              <Ionicons name="information" size={20} color="#FFFFFF" />
        </View>
            <Text variant="bodyLarge" weight="bold" style={styles.title}>
              {bill.title}
            </Text>
          </Row>
          <Text variant="bodySmall" weight="semiBold" style={styles.dueDate}>
              Due date {bill.dueDate}
            </Text>
          </Row>

          <Text variant="bodySmall" style={styles.warning}>
            {t('billWarning')}
          </Text>

      <Button
        title={t('payNow')}
        variant="primary"
        size="small"
        onPress={handlePayNow}
        style={styles.payButton}
          textStyle={styles.payButtonText}
      />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16, // Gap to show yellow background between drawer and white content
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contentWrapper: {
    padding: 16,
    // Remove minHeight - let animation control height
  },
  topRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleSection: {
    gap: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#1A1A2E',
  },
  dueDate: {
    color: '#FF0000',
  },
  warning: {
    color: '#666666',
    marginBottom: 16,
  },
  payButton: {
    backgroundColor: '#0F0F1A', // Black/Dark Blue
    alignSelf: 'center',
    paddingHorizontal: 32,
    borderRadius: 20,
    height: 36,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default BillDrawer;
