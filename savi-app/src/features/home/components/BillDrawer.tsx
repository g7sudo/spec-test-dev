import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTheme } from '@/core/theme';
import { Text, Button, Row } from '@/shared/components';
import { useTranslation } from 'react-i18next';

const DRAWER_HEIGHT = 140; // Height of the drawer when expanded

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
  onCollapse?: () => void; // Callback when drawer should collapse
  onExpand?: () => void; // Callback when drawer should expand
}

export const BillDrawer: React.FC<BillDrawerProps> = ({
  bill,
  onPayNow,
  isExpanded,
  onCollapse,
  onExpand,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('home');

  // Animated values for smooth expand/collapse
  const height = useSharedValue(isExpanded ? DRAWER_HEIGHT : 0);
  const opacity = useSharedValue(isExpanded ? 1 : 0);
  const prevExpandedRef = useRef(isExpanded);

  // Debug: Log prop changes
  useEffect(() => {
    console.log('[BillDrawer] 📦 Received isExpanded prop:', isExpanded);
  }, [isExpanded]);

  // Sync animation when isExpanded prop changes
  // CRITICAL: Don't include height/opacity in dependencies - they're shared values, not React state
  useEffect(() => {
    // Only animate if state actually changed
    if (prevExpandedRef.current === isExpanded) {
      return;
    }
    
    prevExpandedRef.current = isExpanded;
    
    console.log('[BillDrawer] 🎬 Animation effect triggered, isExpanded:', isExpanded);
    
    // Cancel any ongoing animations
    cancelAnimation(height);
    cancelAnimation(opacity);
    
    if (isExpanded) {
      console.log('[BillDrawer] ⬆️ Expanding to height:', DRAWER_HEIGHT);
      height.value = withSpring(DRAWER_HEIGHT, {
        damping: 25, // Increased damping for less oscillation
        stiffness: 100,
        mass: 0.5,
      });
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      console.log('[BillDrawer] ⬇️ Collapsing to height: 0');
      height.value = withSpring(0, {
        damping: 25, // Increased damping for less oscillation
        stiffness: 100,
        mass: 0.5,
      });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isExpanded]); // Only depend on isExpanded

  if (!bill) {
    return null;
  }

  // Animated styles for smooth expand/collapse
  const animatedContainerStyle = useAnimatedStyle(() => {
    const currentHeight = height.value;
    const currentOpacity = opacity.value;
    
    return {
      height: currentHeight,
      opacity: currentOpacity,
      overflow: 'hidden' as const,
      // CRITICAL: Animate marginTop smoothly to prevent glitchy behavior
      marginTop: currentHeight > 10 ? 12 : 0, // Use threshold to prevent flickering
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
