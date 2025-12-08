import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/core/theme';
import { Text, Button } from '@/shared/components';

const { width } = Dimensions.get('window');

interface PromoBannerData {
  id: string;
  title: string;
  subtitle: string;
  discount?: string;
  ctaText: string;
  imageUrl?: string;
  gradientColors: string[];
}

interface PromoBannerProps {
  banner: PromoBannerData | null;
  onPress: (bannerId: string) => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({ banner, onPress }) => {
  const { theme } = useTheme();

  if (!banner) {
    return null;
  }

  const handlePress = () => {
    onPress(banner.id);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <View
          style={[
            styles.banner,
            { backgroundColor: banner.gradientColors[0] || theme.colors.primary },
          ]}
        >
          <View style={styles.contentContainer}>
            <View style={styles.textContent}>
              <Text variant="bodySmall" color="#FFFFFF" style={styles.subtitle}>
                {banner.subtitle}
              </Text>
              <Text variant="h3" color="#FFFFFF" weight="bold" style={styles.title}>
                {banner.title}
              </Text>
              {banner.discount && (
                <View style={styles.discountBadge}>
                  <Text variant="bodySmall" color="#FFFFFF" weight="semiBold">
                    {banner.discount}
                  </Text>
                </View>
              )}
              <Button
                title={banner.ctaText}
                variant="secondary"
                size="small"
                onPress={handlePress}
                style={styles.ctaButton}
              />
            </View>
            {banner.imageUrl && (
              <Image
                source={{ uri: banner.imageUrl }}
                style={styles.image}
                contentFit="contain"
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  banner: {
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 140,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  textContent: {
    flex: 1,
    justifyContent: 'center',
  },
  subtitle: {
    opacity: 0.9,
    marginBottom: 4,
  },
  title: {
    marginBottom: 8,
    maxWidth: '80%',
  },
  discountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
  image: {
    width: 100,
    height: 100,
    position: 'absolute',
    right: 10,
    bottom: 10,
  },
});

export default PromoBanner;
