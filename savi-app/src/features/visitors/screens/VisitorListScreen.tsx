import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/core/theme';
import { Screen, Text, Card, Row, Button, Badge } from '@/shared/components';
import { ServicesStackParamList } from '@/app/navigation/types';
import { Image } from 'expo-image';

type NavigationProp = NativeStackNavigationProp<ServicesStackParamList>;

interface Visitor {
  id: string;
  name: string;
  phone: string;
  purpose: string;
  expectedDate: string;
  expectedTime: string;
  status: 'pending' | 'approved' | 'checked_in' | 'checked_out' | 'cancelled';
  vehicleNumber?: string;
  photoUrl?: string;
  visitorType: 'guest' | 'delivery' | 'service' | 'cab';
}

const mockVisitors: Visitor[] = [
  {
    id: '1',
    name: 'John Smith',
    phone: '+1 234 567 8901',
    purpose: 'Family visit',
    expectedDate: '2024-01-15',
    expectedTime: '10:00 AM',
    status: 'approved',
    visitorType: 'guest',
    photoUrl: 'https://picsum.photos/seed/visitor1/100/100',
  },
  {
    id: '2',
    name: 'Amazon Delivery',
    phone: '+1 234 567 8902',
    purpose: 'Package delivery',
    expectedDate: '2024-01-15',
    expectedTime: '02:00 PM',
    status: 'pending',
    visitorType: 'delivery',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    phone: '+1 234 567 8903',
    purpose: 'Plumber service',
    expectedDate: '2024-01-16',
    expectedTime: '09:00 AM',
    status: 'checked_in',
    vehicleNumber: 'ABC 1234',
    visitorType: 'service',
  },
  {
    id: '4',
    name: 'Uber Driver',
    phone: '+1 234 567 8904',
    purpose: 'Cab pickup',
    expectedDate: '2024-01-14',
    expectedTime: '06:00 PM',
    status: 'checked_out',
    vehicleNumber: 'XYZ 5678',
    visitorType: 'cab',
  },
  {
    id: '5',
    name: 'Sarah Williams',
    phone: '+1 234 567 8905',
    purpose: 'Friend visit',
    expectedDate: '2024-01-14',
    expectedTime: '04:00 PM',
    status: 'cancelled',
    visitorType: 'guest',
    photoUrl: 'https://picsum.photos/seed/visitor5/100/100',
  },
];

type FilterType = 'all' | 'upcoming' | 'today' | 'past';

const filterOptions: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
];

export const VisitorListScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const getStatusColor = (status: Visitor['status']) => {
    switch (status) {
      case 'approved':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'checked_in':
        return theme.colors.info;
      case 'checked_out':
        return theme.colors.textSecondary;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusLabel = (status: Visitor['status']) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending';
      case 'checked_in':
        return 'Checked In';
      case 'checked_out':
        return 'Checked Out';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getVisitorTypeIcon = (type: Visitor['visitorType']): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'guest':
        return 'person-outline';
      case 'delivery':
        return 'cube-outline';
      case 'service':
        return 'construct-outline';
      case 'cab':
        return 'car-outline';
      default:
        return 'person-outline';
    }
  };

  const handleVisitorPress = (visitorId: string) => {
    navigation.navigate('VisitorDetail', { visitorId });
  };

  const handleCreateVisitor = () => {
    navigation.navigate('CreateVisitor');
  };

  const renderVisitor = ({ item }: { item: Visitor }) => (
    <TouchableOpacity
      onPress={() => handleVisitorPress(item.id)}
      activeOpacity={0.7}
    >
      <Card style={styles.visitorCard}>
        <Row align="flex-start" gap={12}>
          {item.photoUrl ? (
            <Image
              source={{ uri: item.photoUrl }}
              style={styles.visitorPhoto}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                styles.visitorPhotoPlaceholder,
                { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <Ionicons
                name={getVisitorTypeIcon(item.visitorType)}
                size={24}
                color={theme.colors.primary}
              />
            </View>
          )}
          <View style={styles.visitorInfo}>
            <Row justify="space-between" align="center">
              <Text variant="bodyLarge" weight="semiBold" numberOfLines={1} style={styles.visitorName}>
                {item.name}
              </Text>
              <Badge
                label={getStatusLabel(item.status)}
                color={getStatusColor(item.status)}
                size="small"
              />
            </Row>
            <Text variant="caption" color={theme.colors.textSecondary} style={styles.purpose}>
              {item.purpose}
            </Text>
            <Row gap={16} style={styles.detailsRow}>
              <Row gap={4} align="center">
                <Ionicons name="calendar-outline" size={14} color={theme.colors.textTertiary} />
                <Text variant="caption" color={theme.colors.textTertiary}>
                  {item.expectedDate}
                </Text>
              </Row>
              <Row gap={4} align="center">
                <Ionicons name="time-outline" size={14} color={theme.colors.textTertiary} />
                <Text variant="caption" color={theme.colors.textTertiary}>
                  {item.expectedTime}
                </Text>
              </Row>
            </Row>
            {item.vehicleNumber && (
              <Row gap={4} align="center" style={styles.vehicleRow}>
                <Ionicons name="car-outline" size={14} color={theme.colors.textTertiary} />
                <Text variant="caption" color={theme.colors.textTertiary}>
                  {item.vehicleNumber}
                </Text>
              </Row>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
        </Row>
      </Card>
    </TouchableOpacity>
  );

  const renderFilters = () => (
    <View style={styles.filterContainer}>
      {filterOptions.map((filter) => (
        <TouchableOpacity
          key={filter.key}
          onPress={() => setActiveFilter(filter.key)}
          style={[
            styles.filterButton,
            {
              backgroundColor:
                activeFilter === filter.key
                  ? theme.colors.primary
                  : theme.colors.surfaceVariant,
            },
          ]}
        >
          <Text
            variant="caption"
            weight="medium"
            color={
              activeFilter === filter.key
                ? theme.colors.textInverse
                : theme.colors.textSecondary
            }
          >
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Screen safeArea style={styles.screen}>
      <View style={styles.header}>
        <Row justify="space-between" align="center">
          <Row gap={8} align="center">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text variant="h2">Visitors</Text>
          </Row>
          <TouchableOpacity
            onPress={handleCreateVisitor}
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          >
            <Ionicons name="add" size={24} color={theme.colors.textInverse} />
          </TouchableOpacity>
        </Row>
        {renderFilters()}
      </View>
      <FlatList
        data={mockVisitors}
        renderItem={renderVisitor}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={theme.colors.textTertiary} />
            <Text variant="body" color={theme.colors.textSecondary} style={styles.emptyText}>
              No visitors found
            </Text>
            <Button
              title="Add Visitor"
              onPress={handleCreateVisitor}
              variant="primary"
              size="medium"
            />
          </View>
        }
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
    paddingVertical: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  visitorCard: {
    padding: 16,
    marginBottom: 12,
  },
  visitorPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  visitorPhotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitorInfo: {
    flex: 1,
  },
  visitorName: {
    flex: 1,
    marginRight: 8,
  },
  purpose: {
    marginTop: 2,
  },
  detailsRow: {
    marginTop: 8,
  },
  vehicleRow: {
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginVertical: 16,
  },
});

export default VisitorListScreen;
