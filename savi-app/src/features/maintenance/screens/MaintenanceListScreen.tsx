import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Card, Row, StatusPill, Button } from '@/shared/components';
import { useTranslation } from 'react-i18next';

type NavigationProp = NativeStackNavigationProp<any>;

interface MaintenanceRequest {
  id: string;
  title: string;
  category: string;
  status: 'New' | 'Assigned' | 'InProgress' | 'Completed' | 'Cancelled';
  requestDate: string;
}

const mockRequests: MaintenanceRequest[] = [
  {
    id: '1',
    title: 'Leaking Bathroom Faucet',
    category: 'Plumber',
    status: 'New',
    requestDate: 'Sept 23, 2024',
  },
  {
    id: '2',
    title: 'AC Not Cooling',
    category: 'AC Tech',
    status: 'InProgress',
    requestDate: 'Sept 22, 2024',
  },
  {
    id: '3',
    title: 'Electrical Issue',
    category: 'Electrician',
    status: 'Completed',
    requestDate: 'Sept 20, 2024',
  },
];

const getStatusVariant = (status: MaintenanceRequest['status']): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  switch (status) {
    case 'New':
    case 'Assigned':
      return 'warning';
    case 'InProgress':
      return 'info';
    case 'Completed':
      return 'success';
    case 'Cancelled':
      return 'default';
    default:
      return 'default';
  }
};

export const MaintenanceListScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();

  const handleCreateRequest = () => {
    navigation.navigate('CreateMaintenance');
  };

  const handleRequestPress = (requestId: string) => {
    navigation.navigate('MaintenanceDetail', { requestId });
  };

  const renderRequest = ({ item }: { item: MaintenanceRequest }) => (
    <TouchableOpacity
      onPress={() => handleRequestPress(item.id)}
      activeOpacity={0.7}
    >
      <Card style={styles.requestCard}>
        <Row style={styles.topRow}>
          <View style={styles.titleContainer}>
            <Text variant="bodyLarge" weight="semiBold" numberOfLines={1}>
              {item.title}
            </Text>
            <Text variant="caption" color={theme.colors.textSecondary}>
              {item.requestDate}
            </Text>
          </View>
          <StatusPill
            label={item.status}
            variant={getStatusVariant(item.status)}
            size="small"
          />
        </Row>
        <Row style={styles.bottomRow}>
          <Text variant="bodySmall" color={theme.colors.primary}>
            {item.category}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textSecondary}
          />
        </Row>
      </Card>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="construct-outline"
        size={64}
        color={theme.colors.textSecondary}
      />
      <Text
        variant="body"
        color={theme.colors.textSecondary}
        align="center"
        style={styles.emptyText}
      >
        No maintenance requests yet
      </Text>
      <Button
        title="Create Request"
        variant="primary"
        onPress={handleCreateRequest}
        style={styles.createButton}
      />
    </View>
  );

  return (
    <Screen safeArea style={styles.screen}>
      <View style={styles.header}>
        <Text variant="h2">My Requests</Text>
        <TouchableOpacity onPress={handleCreateRequest}>
          <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={mockRequests}
        renderItem={renderRequest}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  requestCard: {
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  bottomRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    minWidth: 160,
  },
});

export default MaintenanceListScreen;
