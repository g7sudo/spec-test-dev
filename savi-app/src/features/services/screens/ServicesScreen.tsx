import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/core/theme';
import { Screen, Text, Card } from '@/shared/components';
import { ServicesStackParamList } from '@/app/navigation/types';

type NavigationProp = NativeStackNavigationProp<ServicesStackParamList>;

interface Service {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route?: keyof ServicesStackParamList;
}

const mockServices: Service[] = [
  {
    id: '1',
    name: 'Maintenance',
    description: 'Request home repairs and maintenance',
    icon: 'construct-outline',
    color: '#FF9800',
    route: 'MaintenanceList',
  },
  {
    id: '2',
    name: 'Visitor Management',
    description: 'Pre-register and manage visitors',
    icon: 'people-outline',
    color: '#2196F3',
    route: 'VisitorList',
  },
  {
    id: '3',
    name: 'Payments',
    description: 'View and pay bills',
    icon: 'card-outline',
    color: '#4CAF50',
  },
  {
    id: '4',
    name: 'Helpdesk',
    description: 'Get help with any issues',
    icon: 'help-circle-outline',
    color: '#9C27B0',
  },
  {
    id: '5',
    name: 'Documents',
    description: 'Access community documents',
    icon: 'document-text-outline',
    color: '#607D8B',
  },
  {
    id: '6',
    name: 'Emergency',
    description: 'Contact emergency services',
    icon: 'warning-outline',
    color: '#F44336',
  },
];

export const ServicesScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const handleServicePress = (service: Service) => {
    if (service.route) {
      navigation.navigate(service.route as any);
    } else {
      Alert.alert('Coming Soon', `${service.name} feature is coming soon!`);
    }
  };

  const renderService = ({ item }: { item: Service }) => (
    <TouchableOpacity
      onPress={() => handleServicePress(item)}
      activeOpacity={0.7}
      style={styles.serviceWrapper}
    >
      <Card style={styles.serviceCard}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${item.color}20` },
          ]}
        >
          <Ionicons name={item.icon} size={28} color={item.color} />
        </View>
        <Text variant="bodyLarge" weight="semiBold" style={styles.serviceName}>
          {item.name}
        </Text>
        <Text
          variant="caption"
          color={theme.colors.textSecondary}
          align="center"
          numberOfLines={2}
        >
          {item.description}
        </Text>
      </Card>
    </TouchableOpacity>
  );

  return (
    <Screen safeArea style={styles.screen}>
      <View style={styles.header}>
        <Text variant="h2">Services</Text>
      </View>
      <FlatList
        data={mockServices}
        renderItem={renderService}
        keyExtractor={(item) => item.id}
        numColumns={2}
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
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  serviceWrapper: {
    flex: 1,
    padding: 4,
  },
  serviceCard: {
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    marginBottom: 4,
    textAlign: 'center',
  },
});

export default ServicesScreen;
