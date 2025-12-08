import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/core/theme';
import { Text, Card, Row, StatusPill, Button } from '@/shared/components';
import { useTranslation } from 'react-i18next';
import { MAINTENANCE_STATUS_COLORS } from '@/core/config/constants';

type MaintenanceStatus = keyof typeof MAINTENANCE_STATUS_COLORS;

interface MaintenanceRequest {
  id: string;
  title: string;
  requestDate: string;
  requestTime: string;
  category: string;
  status: MaintenanceStatus;
}

interface MyRequestsSectionProps {
  requests: MaintenanceRequest[];
  onViewDetails: (requestId: string) => void;
  onCreateRequest: () => void;
  isLoading?: boolean;
}

const getStatusDisplayInfo = (status: MaintenanceStatus): { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' } => {
  switch (status) {
    case 'New':
    case 'Assigned':
      return { label: 'Pending', variant: 'warning' };
    case 'InProgress':
      return { label: 'In Progress', variant: 'info' };
    case 'Completed':
      return { label: 'Confirmed', variant: 'success' };
    case 'Cancelled':
      return { label: 'Cancelled', variant: 'default' };
    case 'Rejected':
      return { label: 'Rejected', variant: 'error' };
    default:
      return { label: status, variant: 'default' };
  }
};

export const MyRequestsSection: React.FC<MyRequestsSectionProps> = ({
  requests,
  onViewDetails,
  onCreateRequest,
  isLoading,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const renderRequestItem = (request: MaintenanceRequest) => {
    const statusInfo = getStatusDisplayInfo(request.status);

    return (
      <Card key={request.id} style={styles.requestCard}>
        <Row style={styles.topRow}>
          <View style={styles.titleContainer}>
            <Text variant="bodyLarge" weight="semiBold" numberOfLines={1}>
              {request.title}
            </Text>
            <Text
              variant="caption"
              color={theme.colors.textSecondary}
              style={styles.dateTime}
            >
              {request.requestDate}, {request.requestTime}
            </Text>
          </View>
          <StatusPill
            label={statusInfo.label}
            variant={statusInfo.variant}
            size="small"
          />
        </Row>
        <Row style={styles.bottomRow}>
          <View style={styles.categoryContainer}>
            <Text variant="caption" color={theme.colors.textSecondary}>
              Pending Approval
            </Text>
            <Text variant="bodySmall" color={theme.colors.primary}>
              {request.category}
            </Text>
          </View>
          <TouchableOpacity onPress={() => onViewDetails(request.id)}>
            <Text variant="bodySmall" color={theme.colors.primary}>
              {t('viewDetails')}
            </Text>
          </TouchableOpacity>
        </Row>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text
        variant="body"
        color={theme.colors.textSecondary}
        align="center"
        style={styles.emptyText}
      >
        {t('noRequests', { ns: 'home' })}
      </Text>
      <Button
        title={t('createRequest', { ns: 'home' })}
        variant="outline"
        size="small"
        onPress={onCreateRequest}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Row style={styles.header}>
        <Text variant="bodyLarge" weight="semiBold">
          {t('myRequests', { ns: 'home' })}
        </Text>
      </Row>

      {requests.length === 0 ? (
        renderEmptyState()
      ) : (
        <View style={styles.requestsList}>
          {requests.slice(0, 3).map(renderRequestItem)}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  header: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  requestsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  requestCard: {
    padding: 16,
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
  dateTime: {
    marginTop: 4,
  },
  bottomRow: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  categoryContainer: {
    gap: 2,
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    marginBottom: 12,
  },
});

export default MyRequestsSection;
