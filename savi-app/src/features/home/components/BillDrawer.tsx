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
  const isExpandedShared = useSharedValue(isExpanded);
  
  // Update shared value when prop changes
  useEffect(() => {
    isExpandedShared.value = isExpanded;
  }, [isExpanded, isExpandedShared]);

  // Derived height that responds to scroll - seamless collapse as you scroll
  // When expanded: height follows scroll position directly
  // When collapsed: height is 0
  const height = useDerivedValue(() => {
    // If not expanded, always return 0
    if (!isExpandedShared.value) {
      return 0;
    }
    
    // When expanded, reduce height based on scroll offset
    // Interpolate scroll offset (0 to COLLAPSE_SCROLL_THRESHOLD) to height (DRAWER_HEIGHT to 0)
    const scroll = Math.max(0, scrollOffset.value); // Ensure non-negative
    const scrollCollapsedHeight = interpolate(
      scroll,
      [0, COLLAPSE_SCROLL_THRESHOLD],
      [DRAWER_HEIGHT, 0],
      Extrapolate.CLAMP
    );
    
    return scrollCollapsedHeight;
  });

  // Opacity follows height for smooth fade
  const opacity = useDerivedValue(() => {
    const currentHeight = height.value;
    return interpolate(
      currentHeight,
      [0, DRAWER_HEIGHT],
      [0, 1],
      Extrapolate.CLAMP
    );
  });

  if (!bill) {
    return null;
  }

  // Animated styles for smooth expand/collapse - responds to scroll seamlessly
  const animatedContainerStyle = useAnimatedStyle(() => {
    const currentHeight = height.value;
    const currentOpacity = opacity.value;
    
    return {
      height: currentHeight,
      opacity: currentOpacity,
      overflow: 'hidden' as const,
      // Animate marginTop smoothly based on height
      marginTop: currentHeight > 10 ? 12 : 0,
      marginBottom: 0,
    };
  });

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
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
    marginBottom: 0, // No bottom margin - grey strip follows immediately
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
