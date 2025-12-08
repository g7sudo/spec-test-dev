import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/core/theme';
import { Text } from './Text';

type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface AvatarProps {
  source?: string | null;
  imageUrl?: string | null; // Alias for source
  name?: string;
  size?: AvatarSize;
  showBadge?: boolean;
  badgeText?: string;
  badgeColor?: string;
  style?: ViewStyle;
}

const PLACEHOLDER_URL = 'https://picsum.photos/200/200';

export const Avatar: React.FC<AvatarProps> = ({
  source,
  imageUrl,
  name,
  size = 'medium',
  showBadge = false,
  badgeText,
  badgeColor,
  style,
}) => {
  const { theme } = useTheme();
  const imageSource = source || imageUrl; // Support both props

  const sizeMap = {
    small: 32,
    medium: 48,
    large: 64,
    xlarge: 96,
  };

  const avatarSize = sizeMap[size];
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const containerStyle: ViewStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    backgroundColor: theme.colors.surfaceVariant,
    overflow: 'hidden',
  };

  return (
    <View style={[containerStyle, style]}>
      {imageSource ? (
        <Image
          source={{ uri: imageSource }}
          style={styles.image}
          contentFit="cover"
          placeholder={PLACEHOLDER_URL}
          transition={200}
        />
      ) : (
        <View style={[styles.initialsContainer, { backgroundColor: theme.colors.primary }]}>
          <Text
            color={theme.colors.textInverse}
            weight="semiBold"
            style={{ fontSize: avatarSize * 0.4 }}
          >
            {initials}
          </Text>
        </View>
      )}
      {showBadge && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: badgeColor || theme.colors.success,
              width: badgeText ? 'auto' : avatarSize * 0.3,
              height: badgeText ? 'auto' : avatarSize * 0.3,
              borderRadius: avatarSize * 0.15,
              paddingHorizontal: badgeText ? 6 : 0,
              paddingVertical: badgeText ? 2 : 0,
            },
          ]}
        >
          {badgeText && (
            <Text variant="caption" color={theme.colors.textInverse} weight="bold">
              {badgeText}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  initialsContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    minHeight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
});

export default Avatar;
