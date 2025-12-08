import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme } from '@/core/theme';
import { Screen, Text, Card, Row } from '@/shared/components';

interface Facility {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
}

const mockFacilities: Facility[] = [
  {
    id: '1',
    name: 'Swimming Pool',
    description: 'Olympic-sized swimming pool with lifeguard',
    imageUrl: 'https://picsum.photos/400/200?random=1',
    isAvailable: true,
  },
  {
    id: '2',
    name: 'Gym',
    description: 'Fully equipped fitness center',
    imageUrl: 'https://picsum.photos/400/200?random=2',
    isAvailable: true,
  },
  {
    id: '3',
    name: 'Party Hall',
    description: 'Multi-purpose hall for events',
    imageUrl: 'https://picsum.photos/400/200?random=3',
    isAvailable: false,
  },
  {
    id: '4',
    name: 'Tennis Court',
    description: 'Professional tennis court',
    imageUrl: 'https://picsum.photos/400/200?random=4',
    isAvailable: true,
  },
];

export const FacilityScreen: React.FC = () => {
  const { theme } = useTheme();

  const handleFacilityPress = (facilityId: string) => {
    console.log('Book facility:', facilityId);
  };

  const renderFacility = ({ item }: { item: Facility }) => (
    <TouchableOpacity
      onPress={() => handleFacilityPress(item.id)}
      activeOpacity={0.7}
    >
      <Card style={styles.facilityCard}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.facilityImage}
          contentFit="cover"
        />
        <View style={styles.facilityContent}>
          <Row style={styles.titleRow}>
            <Text variant="bodyLarge" weight="semiBold">
              {item.name}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: item.isAvailable
                    ? theme.colors.successLight
                    : theme.colors.errorLight,
                },
              ]}
            >
              <Text
                variant="caption"
                color={item.isAvailable ? theme.colors.success : theme.colors.error}
              >
                {item.isAvailable ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </Row>
          <Text
            variant="bodySmall"
            color={theme.colors.textSecondary}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <Screen safeArea style={styles.screen}>
      <View style={styles.header}>
        <Text variant="h2">Facilities</Text>
      </View>
      <FlatList
        data={mockFacilities}
        renderItem={renderFacility}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  facilityCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  facilityImage: {
    width: '100%',
    height: 150,
  },
  facilityContent: {
    padding: 16,
  },
  titleRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});

export default FacilityScreen;
