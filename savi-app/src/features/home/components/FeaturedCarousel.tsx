import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/core/theme';
import { Text, Button } from '@/shared/components';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

interface FeaturedOffer {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaText: string;
}

interface FeaturedCarouselProps {
  offers: FeaturedOffer[];
  onOfferPress: (offerId: string) => void;
  isLoading?: boolean;
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({
  offers,
  onOfferPress,
  isLoading,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('home');

  if (offers.length === 0) {
    return null;
  }

  const renderOfferCard = (offer: FeaturedOffer) => (
    <TouchableOpacity
      key={offer.id}
      onPress={() => onOfferPress(offer.id)}
      activeOpacity={0.9}
      style={styles.cardWrapper}
    >
      <View style={[styles.card, { width: CARD_WIDTH }]}>
        <Image
          source={{ uri: offer.imageUrl }}
          style={styles.image}
          contentFit="cover"
        />
        <View style={styles.overlay}>
          <View style={styles.textContainer}>
            <Text
              variant="h3"
              color="#FFFFFF"
              weight="bold"
              numberOfLines={2}
              style={styles.title}
            >
              {offer.title}
            </Text>
            {offer.subtitle && (
              <Text
                variant="bodySmall"
                color="#FFFFFF"
                numberOfLines={2}
                style={styles.subtitle}
              >
                {offer.subtitle}
              </Text>
            )}
          </View>
          <Button
            title={offer.ctaText}
            variant="secondary"
            size="small"
            onPress={() => onOfferPress(offer.id)}
            style={styles.ctaButton}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text
        variant="caption"
        color={theme.colors.textSecondary}
        weight="semiBold"
        style={styles.sectionTitle}
      >
        {t('featuredForYou')}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 16}
      >
        {offers.map(renderOfferCard)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginBottom: 12,
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  cardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 16,
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.9,
    marginBottom: 8,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
});

export default FeaturedCarousel;
