import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Card, Row, StatusPill } from '@/shared/components';

type RouteParams = {
  MaintenanceDetail: {
    requestId: string;
  };
};

export const MaintenanceDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const route = useRoute<RouteProp<RouteParams, 'MaintenanceDetail'>>();
  const { requestId } = route.params;

  // Mock data - in production, fetch from API using requestId
  const request = {
    id: requestId,
    title: 'Leaking Bathroom Faucet',
    description: 'The bathroom faucet has been leaking for the past 2 days. Water drips continuously even when turned off.',
    category: 'Plumber',
    status: 'Assigned' as const,
    requestDate: 'Sept 23, 2024 10:00 AM',
    assignedTo: 'John Smith',
    estimatedTime: '2-3 hours',
  };

  return (
    <Screen safeArea style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.headerCard}>
          <Row style={styles.titleRow}>
            <Text variant="h3" weight="bold" style={styles.title}>
              {request.title}
            </Text>
            <StatusPill label={request.status} variant="warning" />
          </Row>
          <Text
            variant="caption"
            color={theme.colors.textSecondary}
            style={styles.date}
          >
            Requested on {request.requestDate}
          </Text>
        </Card>

        <Card style={styles.detailCard}>
          <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
            Description
          </Text>
          <Text variant="body" color={theme.colors.textSecondary}>
            {request.description}
          </Text>
        </Card>

        <Card style={styles.detailCard}>
          <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
            Details
          </Text>
          <Row style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text variant="caption" color={theme.colors.textSecondary}>
                Category
              </Text>
              <Text variant="body">{request.category}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text variant="caption" color={theme.colors.textSecondary}>
                Est. Time
              </Text>
              <Text variant="body">{request.estimatedTime}</Text>
            </View>
          </Row>
        </Card>

        {request.assignedTo && (
          <Card style={styles.detailCard}>
            <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
              Assigned Technician
            </Text>
            <Row style={styles.technicianRow}>
              <View
                style={[
                  styles.technicianAvatar,
                  { backgroundColor: theme.colors.primaryLight },
                ]}
              >
                <Ionicons
                  name="person"
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              <View>
                <Text variant="body" weight="semiBold">
                  {request.assignedTo}
                </Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  {request.category}
                </Text>
              </View>
            </Row>
          </Card>
        )}

        <Card style={styles.detailCard}>
          <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
            Timeline
          </Text>
          <View style={styles.timelineItem}>
            <View
              style={[
                styles.timelineDot,
                { backgroundColor: theme.colors.success },
              ]}
            />
            <View style={styles.timelineContent}>
              <Text variant="body" weight="semiBold">
                Request Submitted
              </Text>
              <Text variant="caption" color={theme.colors.textSecondary}>
                Sept 23, 2024 10:00 AM
              </Text>
            </View>
          </View>
          <View style={styles.timelineItem}>
            <View
              style={[
                styles.timelineDot,
                { backgroundColor: theme.colors.primary },
              ]}
            />
            <View style={styles.timelineContent}>
              <Text variant="body" weight="semiBold">
                Technician Assigned
              </Text>
              <Text variant="caption" color={theme.colors.textSecondary}>
                Sept 23, 2024 11:30 AM
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    padding: 16,
    marginBottom: 16,
  },
  titleRow: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    marginRight: 12,
  },
  date: {
    marginTop: 4,
  },
  detailCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  detailRow: {
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  technicianRow: {
    alignItems: 'center',
    gap: 12,
  },
  technicianAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
});

export default MaintenanceDetailScreen;
