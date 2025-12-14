/**
 * MaintenanceDetailScreen
 * 
 * Displays detailed information about a maintenance request.
 * Includes request details, timeline, comments, and actions.
 * 
 * Features:
 * - View request details and status
 * - View timeline of events
 * - View and add comments
 * - Cancel request (if New/Assigned)
 * - Rate completed request
 */

import React, { useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';
import { Screen, Text, Card, Row, StatusPill, Button } from '@/shared/components';
import { ErrorState } from '@/shared/components/feedback';
import { 
  useMaintenanceRequestDetail, 
  useMaintenanceComments,
  useAddMaintenanceComment,
  useCancelMaintenanceRequest,
  useRateMaintenanceRequest,
} from '../hooks';
import {
  MaintenanceRequestDetailDto,
  MaintenanceCommentDto,
  MaintenanceTimelineEvent,
  getMaintenanceStatusVariant,
  getMaintenanceStatusLabel,
  canCancelRequest,
  canRateRequest,
} from '../types';

// ============================================================================
// TYPES
// ============================================================================

type RouteParams = {
  MaintenanceDetail: {
    requestId: string;
  };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format date for display
 */
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/**
 * Build timeline events from request data
 */
const buildTimeline = (request: MaintenanceRequestDetailDto): MaintenanceTimelineEvent[] => {
  const events: MaintenanceTimelineEvent[] = [];

  // Request created
  events.push({
    id: 'created',
    type: 'created',
    title: 'Request Submitted',
    timestamp: request.requestedAt,
    icon: 'create-outline',
    color: '#28A745',
  });

  // Assigned
  if (request.assignedAt) {
    events.push({
      id: 'assigned',
      type: 'assigned',
      title: 'Technician Assigned',
      description: request.assignedToUserName || undefined,
      timestamp: request.assignedAt,
      icon: 'person-add-outline',
      color: '#17A2B8',
    });
  }

  // Started
  if (request.startedAt) {
    events.push({
      id: 'started',
      type: 'started',
      title: 'Work Started',
      timestamp: request.startedAt,
      icon: 'hammer-outline',
      color: '#007BFF',
    });
  }

  // Completed
  if (request.completedAt) {
    events.push({
      id: 'completed',
      type: 'completed',
      title: 'Work Completed',
      timestamp: request.completedAt,
      icon: 'checkmark-circle-outline',
      color: '#28A745',
    });
  }

  // Rejected
  if (request.rejectedAt) {
    events.push({
      id: 'rejected',
      type: 'rejected',
      title: 'Request Rejected',
      description: request.rejectionReason || undefined,
      timestamp: request.rejectedAt,
      icon: 'close-circle-outline',
      color: '#DC3545',
    });
  }

  // Cancelled
  if (request.cancelledAt) {
    events.push({
      id: 'cancelled',
      type: 'cancelled',
      title: 'Request Cancelled',
      description: request.cancellationReason || undefined,
      timestamp: request.cancelledAt,
      icon: 'ban-outline',
      color: '#6C757D',
    });
  }

  // Rated
  if (request.ratedAt) {
    events.push({
      id: 'rated',
      type: 'rated',
      title: 'Service Rated',
      description: `${request.residentRating}/5 stars`,
      timestamp: request.ratedAt,
      icon: 'star-outline',
      color: '#FFC107',
    });
  }

  return events;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MaintenanceDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('maintenance');
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'MaintenanceDetail'>>();
  const { requestId } = route.params;

  // Local state
  const [commentText, setCommentText] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  // Fetch request details
  const { 
    data: request, 
    isLoading, 
    error, 
    refetch,
    isRefetching,
  } = useMaintenanceRequestDetail(requestId);

  // Fetch comments
  const { 
    data: comments,
    refetch: refetchComments,
  } = useMaintenanceComments(requestId);

  // Mutations
  const addCommentMutation = useAddMaintenanceComment();
  const cancelMutation = useCancelMaintenanceRequest();
  const rateMutation = useRateMaintenanceRequest();

  // Handle add comment
  const handleAddComment = useCallback(() => {
    if (!commentText.trim()) return;

    addCommentMutation.mutate(
      { requestId, message: commentText.trim() },
      {
        onSuccess: () => {
          setCommentText('');
          refetchComments();
        },
        onError: (error: any) => {
          Alert.alert('Error', error.message || 'Failed to add comment');
        },
      }
    );
  }, [requestId, commentText, addCommentMutation, refetchComments]);

  // Handle cancel request
  const handleCancelRequest = useCallback(() => {
    Alert.prompt(
      t('actions.cancel'),
      t('actions.cancelConfirm'),
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: (reason) => {
            if (!reason?.trim()) {
              Alert.alert('Error', 'Cancellation reason is required');
              return;
            }
            cancelMutation.mutate(
              { requestId, reason: reason.trim() },
              {
                onSuccess: () => {
                  Alert.alert('Success', 'Request cancelled successfully');
                  navigation.goBack();
                },
                onError: (error: any) => {
                  Alert.alert('Error', error.message || 'Failed to cancel request');
                },
              }
            );
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  }, [requestId, cancelMutation, navigation, t]);

  // Handle submit rating
  const handleSubmitRating = useCallback(() => {
    if (selectedRating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    rateMutation.mutate(
      { 
        requestId, 
        rating: selectedRating, 
        feedback: feedbackText.trim() || undefined 
      },
      {
        onSuccess: () => {
          Alert.alert('Thank You', 'Your feedback has been submitted!');
          setShowRating(false);
          refetch();
        },
        onError: (error: any) => {
          Alert.alert('Error', error.message || 'Failed to submit rating');
        },
      }
    );
  }, [requestId, selectedRating, feedbackText, rateMutation, refetch]);

  // Render star rating selector
  const renderStarSelector = () => (
    <Row style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => setSelectedRating(star)}
        >
          <Ionicons
            name={star <= selectedRating ? 'star' : 'star-outline'}
            size={32}
            color={star <= selectedRating ? '#FFC107' : theme.colors.textSecondary}
          />
        </TouchableOpacity>
      ))}
    </Row>
  );

  // Loading state
  if (isLoading && !request) {
    return (
      <Screen safeArea style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text 
            variant="body" 
            color={theme.colors.textSecondary}
            style={styles.loadingText}
          >
            Loading request details...
          </Text>
        </View>
      </Screen>
    );
  }

  // Error state
  if (error && !request) {
    return (
      <Screen safeArea style={styles.screen}>
        <ErrorState
          message={error.message || 'Failed to load request details'}
          onRetry={refetch}
        />
      </Screen>
    );
  }

  if (!request) return null;

  const timeline = buildTimeline(request);

  return (
    <Screen safeArea style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header Card - Title, Status, Ticket Number */}
        <Card style={styles.headerCard}>
          <Row style={styles.titleRow}>
            <Text variant="h3" weight="bold" style={styles.title}>
              {request.title}
            </Text>
            <StatusPill 
              label={getMaintenanceStatusLabel(request.status)} 
              variant={getMaintenanceStatusVariant(request.status)} 
            />
          </Row>
          <Text
            variant="caption"
            color={theme.colors.textSecondary}
            style={styles.ticketNumber}
          >
            {request.ticketNumber} • Requested on {formatDate(request.requestedAt)}
          </Text>
        </Card>

        {/* Description Card */}
        {request.description && (
          <Card style={styles.detailCard}>
            <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
              {t('detail.description')}
            </Text>
            <Text variant="body" color={theme.colors.textSecondary}>
              {request.description}
            </Text>
          </Card>
        )}

        {/* Details Card - Category, Priority, Unit */}
        <Card style={styles.detailCard}>
          <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
            Details
          </Text>
          <Row style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text variant="caption" color={theme.colors.textSecondary}>
                {t('detail.category')}
              </Text>
              <Text variant="body">{request.categoryName}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text variant="caption" color={theme.colors.textSecondary}>
                {t('detail.priority')}
              </Text>
              <Text variant="body">{request.priority}</Text>
            </View>
          </Row>
          <Row style={[styles.detailRow, styles.detailRowMargin]}>
            <View style={styles.detailItem}>
              <Text variant="caption" color={theme.colors.textSecondary}>
                Unit
              </Text>
              <Text variant="body">{request.unitNumber}</Text>
            </View>
            {request.dueBy && (
              <View style={styles.detailItem}>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Due By
                </Text>
                <Text variant="body">{formatDate(request.dueBy)}</Text>
              </View>
            )}
          </Row>
        </Card>

        {/* Assigned Technician Card */}
        {request.assignedToUserName && (
          <Card style={styles.detailCard}>
            <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
              {t('detail.assignedTo')}
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
                  {request.assignedToUserName}
                </Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  Technician
                </Text>
              </View>
            </Row>
          </Card>
        )}

        {/* Timeline Card */}
        <Card style={styles.detailCard}>
          <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
            {t('detail.timeline')}
          </Text>
          {timeline.map((event, index) => (
            <View key={event.id} style={styles.timelineItem}>
              <View
                style={[
                  styles.timelineDot,
                  { backgroundColor: event.color },
                ]}
              />
              {index < timeline.length - 1 && (
                <View 
                  style={[
                    styles.timelineLine, 
                    { backgroundColor: theme.colors.border }
                  ]} 
                />
              )}
              <View style={styles.timelineContent}>
                <Text variant="body" weight="semiBold">
                  {event.title}
                </Text>
                {event.description && (
                  <Text variant="bodySmall" color={theme.colors.textSecondary}>
                    {event.description}
                  </Text>
                )}
                <Text variant="caption" color={theme.colors.textSecondary}>
                  {formatDate(event.timestamp)}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Comments Card */}
        <Card style={styles.detailCard}>
          <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
            {t('detail.comments')} ({comments?.length || 0})
          </Text>
          
          {/* Comment list */}
          {comments && comments.length > 0 ? (
            comments.map((comment: MaintenanceCommentDto) => (
              <View key={comment.id} style={styles.commentItem}>
                <Row style={styles.commentHeader}>
                  <Text variant="bodySmall" weight="semiBold">
                    {comment.createdByName}
                  </Text>
                  <Text variant="caption" color={theme.colors.textSecondary}>
                    {formatDate(comment.createdAt)}
                  </Text>
                </Row>
                <Text variant="body" color={theme.colors.textSecondary}>
                  {comment.message}
                </Text>
              </View>
            ))
          ) : (
            <Text variant="body" color={theme.colors.textSecondary}>
              No comments yet
            </Text>
          )}

          {/* Add comment input */}
          <View style={styles.addCommentContainer}>
            <TextInput
              style={[
                styles.commentInput,
                { 
                  backgroundColor: theme.colors.surfaceVariant,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder={t('detail.addComment')}
              placeholderTextColor={theme.colors.textTertiary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <Button
              title="Send"
              variant="primary"
              size="small"
              onPress={handleAddComment}
              loading={addCommentMutation.isPending}
              disabled={!commentText.trim()}
              style={styles.sendButton}
            />
          </View>
        </Card>

        {/* Rating Section (for completed requests) */}
        {canRateRequest(request.status) && !request.ratedAt && (
          <Card style={styles.detailCard}>
            <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
              {t('detail.rateService')}
            </Text>
            
            {!showRating ? (
              <Button
                title={t('detail.rateService')}
                variant="outline"
                onPress={() => setShowRating(true)}
                fullWidth
              />
            ) : (
              <View>
                {renderStarSelector()}
                <TextInput
                  style={[
                    styles.feedbackInput,
                    { 
                      backgroundColor: theme.colors.surfaceVariant,
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  placeholder="Share your feedback (optional)"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  multiline
                  numberOfLines={3}
                />
                <Row style={styles.ratingButtons}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    size="small"
                    onPress={() => {
                      setShowRating(false);
                      setSelectedRating(0);
                      setFeedbackText('');
                    }}
                    style={styles.ratingButton}
                  />
                  <Button
                    title={t('detail.submitRating')}
                    variant="primary"
                    size="small"
                    onPress={handleSubmitRating}
                    loading={rateMutation.isPending}
                    style={styles.ratingButton}
                  />
                </Row>
              </View>
            )}
          </Card>
        )}

        {/* Existing Rating Display */}
        {request.ratedAt && request.residentRating && (
          <Card style={styles.detailCard}>
            <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
              Your Rating
            </Text>
            <Row style={styles.existingRating}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= request.residentRating! ? 'star' : 'star-outline'}
                  size={24}
                  color={star <= request.residentRating! ? '#FFC107' : theme.colors.textSecondary}
                />
              ))}
            </Row>
            {request.residentFeedback && (
              <Text 
                variant="body" 
                color={theme.colors.textSecondary}
                style={styles.existingFeedback}
              >
                "{request.residentFeedback}"
              </Text>
            )}
          </Card>
        )}

        {/* Cancel Request Button (for New/Assigned requests) */}
        {canCancelRequest(request.status) && (
          <Button
            title={t('actions.cancel')}
            variant="outline"
            onPress={handleCancelRequest}
            loading={cancelMutation.isPending}
            fullWidth
            style={styles.cancelButton}
          />
        )}
      </ScrollView>
    </Screen>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
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
  ticketNumber: {
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
  detailRowMargin: {
    marginTop: 12,
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
    position: 'relative',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  timelineLine: {
    position: 'absolute',
    left: 5,
    top: 18,
    width: 2,
    height: 40,
  },
  timelineContent: {
    flex: 1,
  },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  commentHeader: {
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  addCommentContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 40,
    maxHeight: 80,
  },
  sendButton: {
    minWidth: 60,
  },
  starRow: {
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  feedbackInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  ratingButtons: {
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  ratingButton: {
    flex: 1,
  },
  existingRating: {
    gap: 4,
  },
  existingFeedback: {
    marginTop: 12,
    fontStyle: 'italic',
  },
  cancelButton: {
    marginTop: 8,
    borderColor: '#DC3545',
  },
});

export default MaintenanceDetailScreen;

