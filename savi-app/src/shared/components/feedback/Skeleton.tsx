import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { useTheme } from '@/core/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Pre-built skeleton patterns
export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }, style]}>
      <Skeleton width={60} height={60} borderRadius={30} />
      <View style={styles.cardContent}>
        <Skeleton width="80%" height={16} />
        <Skeleton width="60%" height={14} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
};

export const SkeletonListItem: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.listItem, { backgroundColor: theme.colors.surface }, style]}>
      <View style={styles.listItemContent}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
      </View>
      <Skeleton width={80} height={24} borderRadius={12} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  listItemContent: {
    flex: 1,
  },
});

export default Skeleton;
