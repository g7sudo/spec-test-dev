/**
 * AmenityCard Component
 * 
 * Reusable card component for displaying amenity information in lists.
 * Shows image, name, location, status, and booking indicators.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme } from '@/core/theme';
import { Text, Card, Row } from '@/shared/components';
import { AmenitySummaryDto } from '@/services/api/amenities';

interface AmenityCardProps extends Omit<TouchableOpacityProps, 'onPress'> {
  amenity: AmenitySummaryDto;
  onPress: (amenityId: string) => void;
  placeholderImageUrl?: string;
}

const DEFAULT_PLACEHOLDER = 'https://picsum.photos/400/200.jpg';

export const AmenityCard: React.FC<AmenityCardProps> = ({
  amenity,
  onPress,
  placeholderImageUrl = DEFAULT_PLACEHOLDER,
  style,
  ...props
}) => {
  const { theme } = useTheme();

  const imageUrl = amenity.primaryImageUrl || placeholderImageUrl;

  const getStatusBadgeStyle = (isAvailable: boolean) => ({
    backgroundColor: isAvailable
      ? theme.colors.successLight
      : theme.colors.errorLight,
  });

  const getStatusTextColor = (isAvailable: boolean) =>
    isAvailable ? theme.colors.success : theme.colors.error;

  return (
    <TouchableOpacity
      onPress={() => onPress(amenity.id)}
      activeOpacity={0.7}
      {...props}
    >
      <Card style={[styles.card, style]}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
          transition={200}
        />
        <View style={styles.content}>
          <Row style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text variant="bodyLarge" weight="semiBold" numberOfLines={1}>
                {amenity.name}
              </Text>
              {amenity.locationText && (
                <Text
                  variant="caption"
                  color={theme.colors.textSecondary}
                  numberOfLines={1}
                >
                  {amenity.locationText}
                </Text>
              )}
            </View>
            <View
              style={[
                styles.statusBadge,
                getStatusBadgeStyle(amenity.isAvailableForBooking),
              ]}
            >
              <Text
                variant="caption"
                color={getStatusTextColor(amenity.isAvailableForBooking)}
                weight="medium"
              >
                {amenity.isAvailableForBooking ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </Row>
          <Row style={styles.metaRow}>
            {amenity.isBookable && (
              <View style={styles.metaItem}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={theme.colors.primary}
                />
                <Text variant="caption" color={theme.colors.primary} style={styles.metaText}>
                  Bookable
                </Text>
              </View>
            )}
            {amenity.depositRequired && (
              <View style={styles.metaItem}>
                <Ionicons
                  name="card-outline"
                  size={14}
                  color={theme.colors.warning}
                />
                <Text variant="caption" color={theme.colors.warning} style={styles.metaText}>
                  Deposit Required
                </Text>
              </View>
            )}
          </Row>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 150,
  },
  content: {
    padding: 16,
  },
  titleRow: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  metaRow: {
    marginTop: 8,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    marginLeft: 2,
  },
});

