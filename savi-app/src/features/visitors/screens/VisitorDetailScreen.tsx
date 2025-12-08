import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '@/core/theme';
import { Screen, Text, Card, Row, Button, Badge } from '@/shared/components';
import { ServicesStackParamList } from '@/app/navigation/types';
import { Image } from 'expo-image';

type RouteProps = RouteProp<ServicesStackParamList, 'VisitorDetail'>;

interface Visitor {
  id: string;
  name: string;
  phone: string;
  email?: string;
  purpose: string;
  expectedDate: string;
  expectedTime: string;
  status: 'pending' | 'approved' | 'checked_in' | 'checked_out' | 'cancelled';
  vehicleNumber?: string;
  vehicleType?: string;
  photoUrl?: string;
  visitorType: 'guest' | 'delivery' | 'service' | 'cab';
  idType?: string;
  idNumber?: string;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  createdAt: string;
}

const mockVisitor: Visitor = {
  id: '1',
  name: 'John Smith',
  phone: '+1 234 567 8901',
  email: 'john.smith@email.com',
  purpose: 'Family visit for weekend gathering',
  expectedDate: '2024-01-15',
  expectedTime: '10:00 AM',
  status: 'approved',
  vehicleNumber: 'ABC 1234',
  vehicleType: 'Sedan',
  visitorType: 'guest',
  photoUrl: 'https://picsum.photos/seed/visitor1/200/200',
  idType: 'Driver License',
  idNumber: 'DL-123456',
  notes: 'Will bring 2 additional guests',
  createdAt: '2024-01-10',
};

export const VisitorDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { visitorId } = route.params;
  const [isLoading, setIsLoading] = useState(false);

  // In real app, fetch visitor by ID
  const visitor = mockVisitor;

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

  const getVisitorTypeLabel = (type: Visitor['visitorType']) => {
    switch (type) {
      case 'guest':
        return 'Guest';
      case 'delivery':
        return 'Delivery';
      case 'service':
        return 'Service Provider';
      case 'cab':
        return 'Cab/Taxi';
      default:
        return type;
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Visitor',
      'Are you sure you want to cancel this visitor pass?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            // API call to cancel
            setTimeout(() => {
              setIsLoading(false);
              navigation.goBack();
            }, 1000);
          },
        },
      ]
    );
  };

  const handleSharePass = () => {
    // Share visitor pass via share sheet
    Alert.alert('Share Pass', 'Visitor pass shared successfully!');
  };

  const handleCall = () => {
    // Open phone dialer
    Alert.alert('Call', `Calling ${visitor.phone}`);
  };

  const renderDetailRow = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    value: string
  ) => (
    <Row gap={12} align="flex-start" style={styles.detailRow}>
      <View
        style={[
          styles.detailIcon,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <View style={styles.detailContent}>
        <Text variant="caption" color={theme.colors.textSecondary}>
          {label}
        </Text>
        <Text variant="body" weight="medium">
          {value}
        </Text>
      </View>
    </Row>
  );

  return (
    <Screen safeArea style={styles.screen}>
      <View style={styles.header}>
        <Row justify="space-between" align="center">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text variant="h3" weight="semiBold">
            Visitor Details
          </Text>
          <TouchableOpacity onPress={handleSharePass}>
            <Ionicons name="share-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </Row>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Visitor Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {visitor.photoUrl ? (
              <Image
                source={{ uri: visitor.photoUrl }}
                style={styles.profilePhoto}
                contentFit="cover"
              />
            ) : (
              <View
                style={[
                  styles.profilePhotoPlaceholder,
                  { backgroundColor: theme.colors.primaryLight },
                ]}
              >
                <Ionicons name="person" size={40} color={theme.colors.primary} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text variant="h3" weight="bold">
                {visitor.name}
              </Text>
              <Text variant="body" color={theme.colors.textSecondary}>
                {getVisitorTypeLabel(visitor.visitorType)}
              </Text>
              <Badge
                label={getStatusLabel(visitor.status)}
                color={getStatusColor(visitor.status)}
                size="small"
                style={styles.statusBadge}
              />
            </View>
          </View>
          <View style={styles.profileActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.successLight }]}
              onPress={handleCall}
            >
              <Ionicons name="call-outline" size={20} color={theme.colors.success} />
              <Text variant="caption" weight="medium" color={theme.colors.success}>
                Call
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.infoLight }]}
              onPress={handleSharePass}
            >
              <Ionicons name="share-outline" size={20} color={theme.colors.info} />
              <Text variant="caption" weight="medium" color={theme.colors.info}>
                Share
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Visit Details Card */}
        <Card style={styles.detailsCard}>
          <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
            Visit Details
          </Text>
          {renderDetailRow('calendar-outline', 'Expected Date', visitor.expectedDate)}
          {renderDetailRow('time-outline', 'Expected Time', visitor.expectedTime)}
          {renderDetailRow('chatbubble-outline', 'Purpose', visitor.purpose)}
          {visitor.notes && renderDetailRow('document-text-outline', 'Notes', visitor.notes)}
        </Card>

        {/* Contact Details Card */}
        <Card style={styles.detailsCard}>
          <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
            Contact Information
          </Text>
          {renderDetailRow('call-outline', 'Phone', visitor.phone)}
          {visitor.email && renderDetailRow('mail-outline', 'Email', visitor.email)}
        </Card>

        {/* Vehicle Details Card */}
        {visitor.vehicleNumber && (
          <Card style={styles.detailsCard}>
            <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
              Vehicle Information
            </Text>
            {renderDetailRow('car-outline', 'Vehicle Number', visitor.vehicleNumber)}
            {visitor.vehicleType &&
              renderDetailRow('car-sport-outline', 'Vehicle Type', visitor.vehicleType)}
          </Card>
        )}

        {/* ID Details Card */}
        {visitor.idType && (
          <Card style={styles.detailsCard}>
            <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
              Identification
            </Text>
            {renderDetailRow('card-outline', 'ID Type', visitor.idType)}
            {visitor.idNumber &&
              renderDetailRow('finger-print-outline', 'ID Number', visitor.idNumber)}
          </Card>
        )}

        {/* Check-in/out Details */}
        {(visitor.checkInTime || visitor.checkOutTime) && (
          <Card style={styles.detailsCard}>
            <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
              Check-in/out
            </Text>
            {visitor.checkInTime &&
              renderDetailRow('log-in-outline', 'Check-in Time', visitor.checkInTime)}
            {visitor.checkOutTime &&
              renderDetailRow('log-out-outline', 'Check-out Time', visitor.checkOutTime)}
          </Card>
        )}

        {/* Action Buttons */}
        {(visitor.status === 'pending' || visitor.status === 'approved') && (
          <View style={styles.bottomActions}>
            <Button
              title="Cancel Visit"
              onPress={handleCancel}
              variant="outline"
              size="large"
              loading={isLoading}
              style={styles.cancelButton}
            />
          </View>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    padding: 20,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profilePhotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  statusBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  detailsCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  bottomActions: {
    marginTop: 8,
  },
  cancelButton: {
    borderColor: '#F44336',
  },
});

export default VisitorDetailScreen;
