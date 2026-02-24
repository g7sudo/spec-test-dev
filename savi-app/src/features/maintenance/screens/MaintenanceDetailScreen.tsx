/**
 * MaintenanceDetailScreen
 * 
 * Redesigned maintenance request detail view with improved UX.
 * Features a hero image gallery, clean status indicators, and intuitive layout.
 * 
 * Features:
 * - Hero image gallery with swipeable photos
 * - Clean status badge with progress indicator
 * - Collapsible sections for details, timeline, comments
 * - Floating action buttons for key actions
 * - Rate completed requests with star rating
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  FlatList,
  Modal,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

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
  MaintenanceAttachmentDto,
  getMaintenanceStatusVariant,
  getMaintenanceStatusLabel,
  canCancelRequest,
  canRateRequest,
} from '../types';
import { CommentImageAttachment } from '@/services/api/maintenance';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 220;

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
 * Format date for display - compact version
 */
const formatDateShort = (dateString: string | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date with time
 */
const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/**
 * Get relative time string
 */
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateShort(dateString);
};

/**
 * Get status step index for progress indicator
 */
const getStatusStep = (status: string): number => {
  const steps: Record<string, number> = {
    New: 0,
    Assigned: 1,
    InProgress: 2,
    WaitingForResident: 2,
    Completed: 3,
    Rejected: -1,
    Cancelled: -1,
  };
  return steps[status] ?? 0;
};

/**
 * Build timeline events from request data
 */
const buildTimeline = (request: MaintenanceRequestDetailDto): MaintenanceTimelineEvent[] => {
  const events: MaintenanceTimelineEvent[] = [];

  events.push({
    id: 'created',
    type: 'created',
    title: 'Request Submitted',
    timestamp: request.requestedAt,
    icon: 'create-outline',
    color: '#28A745',
  });

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

  return events;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Attachment Thumbnails Component - Compact grid of images
 */
const AttachmentThumbnails: React.FC<{
  attachments: MaintenanceAttachmentDto[];
  onImagePress: (index: number) => void;
}> = ({ attachments, onImagePress }) => {
  const { theme } = useTheme();

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <View style={styles.thumbnailsContainer}>
      <Text variant="bodySmall" weight="medium" color={theme.colors.textSecondary} style={styles.thumbnailsLabel}>
        Attachments ({attachments.length})
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbnailsScrollContent}
      >
        {attachments.map((item, index) => (
          <TouchableOpacity 
            key={item.documentId}
            activeOpacity={0.8} 
            onPress={() => onImagePress(index)}
            style={styles.thumbnailItem}
          >
            <Image
              source={{ uri: item.downloadUrl }}
              style={styles.thumbnailImage}
              contentFit="cover"
            />
            {attachments.length > 1 && index === 0 && (
              <View style={styles.thumbnailBadge}>
                <Text variant="caption" weight="bold" color="#FFFFFF">
                  +{attachments.length - 1}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

/**
 * Legacy Image Gallery Component (kept for reference, now unused)
 */
const _ImageGallery: React.FC<{
  attachments: MaintenanceAttachmentDto[];
  onImagePress: (index: number) => void;
}> = ({ attachments, onImagePress }) => {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!attachments || attachments.length === 0) {
    return (
      <View style={[styles.noImageContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Ionicons name="construct-outline" size={48} color={theme.colors.textTertiary} />
        <Text variant="body" color={theme.colors.textTertiary} style={{ marginTop: 8 }}>
          No photos attached
        </Text>
      </View>
    );
  }

  return (
    <View>
      <FlatList
        data={attachments}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
        renderItem={({ item, index }) => (
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => onImagePress(index)}
          >
            <Image
              source={{ uri: item.downloadUrl }}
              style={styles.heroImage}
              contentFit="cover"
              transition={200}
            />
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.documentId}
      />
      {/* Image indicators */}
      {attachments.length > 1 && (
        <View style={styles.imageIndicators}>
          {attachments.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentIndex === index && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

/**
 * Progress Steps Component
 */
const ProgressSteps: React.FC<{ currentStep: number; isTerminal: boolean }> = ({ 
  currentStep, 
  isTerminal 
}) => {
  const steps = ['Submitted', 'Assigned', 'In Progress', 'Completed'];
  const { theme } = useTheme();

  if (isTerminal) return null;

  return (
    <View style={styles.progressContainer}>
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <View style={styles.progressStep}>
            <View
              style={[
                styles.progressDot,
                index <= currentStep && { backgroundColor: theme.colors.primary },
                index > currentStep && { backgroundColor: theme.colors.border },
              ]}
            >
              {index < currentStep && (
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              )}
            </View>
            <Text
              variant="caption"
              color={index <= currentStep ? theme.colors.primary : theme.colors.textTertiary}
              style={styles.progressLabel}
            >
              {step}
            </Text>
          </View>
          {index < steps.length - 1 && (
            <View
              style={[
                styles.progressLine,
                index < currentStep && { backgroundColor: theme.colors.primary },
                index >= currentStep && { backgroundColor: theme.colors.border },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

/**
 * Info Row Component
 */
const InfoRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}> = ({ icon, label, value, valueColor }) => {
  const { theme } = useTheme();
  return (
    <Row style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={theme.colors.textSecondary} />
      <Text variant="bodySmall" color={theme.colors.textSecondary} style={styles.infoLabel}>
        {label}
      </Text>
      <Text variant="body" weight="medium" color={valueColor || theme.colors.text}>
        {value}
      </Text>
    </Row>
  );
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
  const [commentAttachments, setCommentAttachments] = useState<CommentImageAttachment[]>([]);
  const [showRating, setShowRating] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  
  // Max 5 attachments for comments
  const MAX_COMMENT_ATTACHMENTS = 5;
  const [showTimeline, setShowTimeline] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [viewingImages, setViewingImages] = useState<{ url: string }[]>([]);

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
  // Handle adding comment with optional attachments
  const handleAddComment = useCallback(() => {
    if (!commentText.trim() && commentAttachments.length === 0) return;

    addCommentMutation.mutate(
      { 
        requestId, 
        message: commentText.trim() || ' ', // API requires message
        attachments: commentAttachments.length > 0 ? commentAttachments : undefined 
      },
      {
        onSuccess: () => {
          setCommentText('');
          setCommentAttachments([]);
          refetchComments();
        },
        onError: (error: any) => {
          Alert.alert('Error', error.message || 'Failed to add comment');
        },
      }
    );
  }, [requestId, commentText, commentAttachments, addCommentMutation, refetchComments]);

  // Pick image for comment attachment
  const handlePickCommentImage = useCallback(async () => {
    if (commentAttachments.length >= MAX_COMMENT_ATTACHMENTS) {
      Alert.alert('Limit Reached', `Maximum ${MAX_COMMENT_ATTACHMENTS} images allowed.`);
      return;
    }

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_COMMENT_ATTACHMENTS - commentAttachments.length,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newAttachments: CommentImageAttachment[] = result.assets.map((asset, index) => ({
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || `comment_photo_${Date.now()}_${index}.jpg`,
      }));
      setCommentAttachments((prev) => [...prev, ...newAttachments].slice(0, MAX_COMMENT_ATTACHMENTS));
    }
  }, [commentAttachments]);

  // Remove comment attachment
  const removeCommentAttachment = useCallback((index: number) => {
    setCommentAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Handle cancel request
  const handleCancelRequest = useCallback(() => {
    Alert.prompt(
      'Cancel Request',
      'Please provide a reason for cancellation:',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Request',
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
  }, [requestId, cancelMutation, navigation]);

  // Handle submit rating
  const handleSubmitRating = useCallback(() => {
    if (selectedRating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    rateMutation.mutate(
      { requestId, rating: selectedRating, feedback: feedbackText.trim() || undefined },
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

  // Loading state
  if (isLoading && !request) {
    return (
      <Screen safeArea edges={['bottom']} style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="body" color={theme.colors.textSecondary} style={{ marginTop: 12 }}>
            Loading...
          </Text>
        </View>
      </Screen>
    );
  }

  // Error state
  if (error && !request) {
    return (
      <Screen safeArea edges={['bottom']} style={styles.screen}>
        <ErrorState
          message={error.message || 'Failed to load request'}
          onRetry={refetch}
        />
      </Screen>
    );
  }

  if (!request) return null;

  const timeline = buildTimeline(request);
  const statusStep = getStatusStep(request.status);
  const isTerminal = request.status === 'Cancelled' || request.status === 'Rejected';
  const attachments = request.attachments || [];

  return (
    <Screen safeArea edges={['bottom']} style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Main Content */}
        <View style={styles.content}>
          {/* Status Badge & Ticket */}
          <Row style={styles.statusRow}>
            <StatusPill
              label={getMaintenanceStatusLabel(request.status)}
              variant={getMaintenanceStatusVariant(request.status)}
            />
            <Text variant="caption" color={theme.colors.textSecondary}>
              {request.ticketNumber}
            </Text>
          </Row>

          {/* Title */}
          <Text variant="h2" weight="bold" style={styles.title}>
            {request.title}
          </Text>

          {/* Progress Steps */}
          <ProgressSteps currentStep={statusStep} isTerminal={isTerminal} />

          {/* Quick Info */}
          <Card style={styles.infoCard}>
            <InfoRow 
              icon="folder-outline" 
              label="Category" 
              value={request.categoryName} 
            />
            <InfoRow 
              icon="flag-outline" 
              label="Priority" 
              value={request.priority}
              valueColor={
                request.priority === 'Critical' ? '#DC3545' :
                request.priority === 'High' ? '#FFC107' : undefined
              }
            />
            <InfoRow 
              icon="home-outline" 
              label="Unit" 
              value={request.unitNumber} 
            />
            <InfoRow 
              icon="calendar-outline" 
              label="Submitted" 
              value={formatDateShort(request.requestedAt)} 
            />
            {request.assignedToUserName && (
              <InfoRow 
                icon="person-outline" 
                label="Technician" 
                value={request.assignedToUserName} 
              />
            )}
          </Card>

          {/* Description & Attachments */}
          {(request.description || attachments.length > 0) && (
            <Card style={styles.descriptionCard}>
              {request.description && (
                <>
                  <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
                    Description
                  </Text>
                  <Text variant="body" color={theme.colors.textSecondary}>
                    {request.description}
                  </Text>
                </>
              )}
              
              {/* Attachment Thumbnails */}
              <AttachmentThumbnails 
                attachments={attachments}
                onImagePress={(index) => {
                  // Set both the images array and selected index for the modal
                  setViewingImages(attachments.map(a => ({ url: a.downloadUrl })));
                  setSelectedImageIndex(index);
                }}
              />
            </Card>
          )}

          {/* Timeline Toggle */}
          <TouchableOpacity
            style={[styles.timelineToggle, { backgroundColor: theme.colors.surfaceVariant }]}
            onPress={() => setShowTimeline(!showTimeline)}
          >
            <Row style={styles.timelineToggleContent}>
              <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
              <Text variant="body" weight="medium" style={{ marginLeft: 8 }}>
                Activity Timeline
              </Text>
            </Row>
            <Ionicons 
              name={showTimeline ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={theme.colors.textSecondary} 
            />
          </TouchableOpacity>

          {/* Timeline Content */}
          {showTimeline && (
            <Card style={styles.timelineCard}>
              {timeline.map((event, index) => (
                <View key={event.id} style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: event.color }]} />
                  {index < timeline.length - 1 && (
                    <View style={[styles.timelineLine, { backgroundColor: theme.colors.border }]} />
                  )}
                  <View style={styles.timelineContent}>
                    <Text variant="body" weight="semiBold">{event.title}</Text>
                    {event.description && (
                      <Text variant="caption" color={theme.colors.textSecondary}>
                        {event.description}
                      </Text>
                    )}
                    <Text variant="caption" color={theme.colors.textTertiary}>
                      {formatDateTime(event.timestamp)}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          )}

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Row style={styles.commentsSectionHeader}>
              <Text variant="bodyLarge" weight="semiBold">
                Comments
              </Text>
              <Text variant="caption" color={theme.colors.textSecondary}>
                {comments?.length || 0}
              </Text>
            </Row>

            {/* Comment Input with Attachments */}
            <View style={[styles.commentInputWrapper, { backgroundColor: theme.colors.surfaceVariant }]}>
              {/* Attachment Previews */}
              {commentAttachments.length > 0 && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.commentAttachmentPreviewContainer}
                  contentContainerStyle={styles.commentAttachmentPreviewContent}
                >
                  {commentAttachments.map((attachment, index) => (
                    <View key={index} style={styles.commentAttachmentPreview}>
                      <Image
                        source={{ uri: attachment.uri }}
                        style={styles.commentAttachmentImage}
                        contentFit="cover"
                      />
                      <TouchableOpacity
                        style={styles.removeAttachmentButton}
                        onPress={() => removeCommentAttachment(index)}
                      >
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
              
              {/* Input Row */}
              <View style={styles.commentInputContainer}>
                <TouchableOpacity
                  onPress={handlePickCommentImage}
                  style={styles.attachButton}
                  disabled={commentAttachments.length >= MAX_COMMENT_ATTACHMENTS}
                >
                  <Ionicons 
                    name="image-outline" 
                    size={22} 
                    color={commentAttachments.length >= MAX_COMMENT_ATTACHMENTS 
                      ? theme.colors.textTertiary 
                      : theme.colors.primary
                    } 
                  />
                </TouchableOpacity>
                <TextInput
                  style={[styles.commentInput, { color: theme.colors.text }]}
                  placeholder="Add a comment..."
                  placeholderTextColor={theme.colors.textTertiary}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                />
                <TouchableOpacity
                  onPress={handleAddComment}
                  disabled={(!commentText.trim() && commentAttachments.length === 0) || addCommentMutation.isPending}
                  style={[
                    styles.sendButton,
                    { backgroundColor: (commentText.trim() || commentAttachments.length > 0) ? theme.colors.primary : theme.colors.border },
                  ]}
                >
                  {addCommentMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="send" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Comment List */}
            {comments && comments.length > 0 && (
              <View style={styles.commentsList}>
                {comments.map((comment: MaintenanceCommentDto) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={[styles.commentAvatar, { backgroundColor: theme.colors.primaryLight }]}>
                      <Text variant="caption" weight="bold" color={theme.colors.primary}>
                        {comment.createdByName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.commentContent}>
                      <Row style={styles.commentMeta}>
                        <Text variant="bodySmall" weight="semiBold">
                          {comment.createdByName}
                        </Text>
                        <Text variant="caption" color={theme.colors.textTertiary}>
                          {getRelativeTime(comment.createdAt)}
                        </Text>
                      </Row>
                      <Text variant="body" color={theme.colors.textSecondary}>
                        {comment.message}
                      </Text>
                      
                      {/* Comment Attachments */}
                      {comment.attachments && comment.attachments.length > 0 && (
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false}
                          style={styles.commentAttachmentsScroll}
                        >
                          {comment.attachments.map((attachment, index) => (
                            <TouchableOpacity
                              key={attachment.documentId}
                              onPress={() => {
                                // Set comment images for the modal
                                setViewingImages(comment.attachments!.map(a => ({ url: a.downloadUrl })));
                                setSelectedImageIndex(index);
                              }}
                              style={styles.commentAttachmentThumbnail}
                            >
                              <Image
                                source={{ uri: attachment.downloadUrl }}
                                style={styles.commentAttachmentThumbnailImage}
                                contentFit="cover"
                              />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Rating Section */}
          {canRateRequest(request.status) && !request.ratedAt && (
            <Card style={styles.ratingCard}>
              <Text variant="bodyLarge" weight="semiBold" align="center">
                How was the service?
              </Text>
              <Row style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setSelectedRating(star)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={star <= selectedRating ? 'star' : 'star-outline'}
                      size={36}
                      color={star <= selectedRating ? '#FFC107' : theme.colors.border}
                    />
                  </TouchableOpacity>
                ))}
              </Row>
              {selectedRating > 0 && (
                <>
                  <TextInput
                    style={[
                      styles.feedbackInput,
                      { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.text },
                    ]}
                    placeholder="Share your feedback (optional)"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={feedbackText}
                    onChangeText={setFeedbackText}
                    multiline
                  />
                  <Button
                    title="Submit Rating"
                    variant="primary"
                    onPress={handleSubmitRating}
                    loading={rateMutation.isPending}
                    fullWidth
                  />
                </>
              )}
            </Card>
          )}

          {/* Existing Rating */}
          {request.ratedAt && request.residentRating && (
            <Card style={styles.existingRatingCard}>
              <Text variant="body" weight="semiBold" align="center">
                Your Rating
              </Text>
              <Row style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= request.residentRating! ? 'star' : 'star-outline'}
                    size={28}
                    color={star <= request.residentRating! ? '#FFC107' : theme.colors.border}
                  />
                ))}
              </Row>
              {request.residentFeedback && (
                <Text variant="body" color={theme.colors.textSecondary} align="center" style={{ marginTop: 8 }}>
                  "{request.residentFeedback}"
                </Text>
              )}
            </Card>
          )}

          {/* Cancel Button */}
          {canCancelRequest(request.status) && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelRequest}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <ActivityIndicator size="small" color="#DC3545" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={20} color="#DC3545" />
                  <Text variant="body" weight="medium" color="#DC3545" style={{ marginLeft: 8 }}>
                    Cancel Request
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Bottom spacing */}
          <View style={{ height: 32 }} />
        </View>
      </ScrollView>

      {/* Full Screen Image Modal */}
      <Modal
        visible={selectedImageIndex !== null && viewingImages.length > 0}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSelectedImageIndex(null);
          setViewingImages([]);
        }}
      >
        <View style={styles.imageModal}>
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => {
              setSelectedImageIndex(null);
              setViewingImages([]);
            }}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {selectedImageIndex !== null && viewingImages[selectedImageIndex] && (
            <Image
              source={{ uri: viewingImages[selectedImageIndex].url }}
              style={styles.fullScreenImage}
              contentFit="contain"
            />
          )}
          {/* Image counter */}
          {viewingImages.length > 1 && (
            <View style={styles.imageCounter}>
              <Text variant="bodySmall" color="#FFFFFF">
                {(selectedImageIndex ?? 0) + 1} / {viewingImages.length}
              </Text>
            </View>
          )}
        </View>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Hero Image
  noImageContainer: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  indicatorActive: {
    backgroundColor: '#FFFFFF',
    width: 18,
  },
  // Thumbnail Gallery (compact)
  thumbnailsContainer: {
    marginTop: 16,
  },
  thumbnailsLabel: {
    marginBottom: 8,
  },
  thumbnailsScrollContent: {
    gap: 8,
  },
  thumbnailItem: {
    position: 'relative',
  },
  thumbnailImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  thumbnailBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  // Content
  content: {
    padding: 16,
  },
  statusRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    marginBottom: 16,
  },
  // Progress Steps
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressLabel: {
    marginTop: 4,
    textAlign: 'center',
  },
  progressLine: {
    flex: 1,
    height: 2,
    marginTop: 11,
    marginHorizontal: -8,
  },
  // Info Card
  infoCard: {
    padding: 16,
    marginBottom: 12,
  },
  infoRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    flex: 1,
    marginLeft: 12,
  },
  // Description
  descriptionCard: {
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  // Timeline
  timelineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  timelineToggleContent: {
    alignItems: 'center',
  },
  timelineCard: {
    padding: 16,
    marginBottom: 12,
  },
  timelineItem: {
    flexDirection: 'row',
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
    height: 36,
  },
  timelineContent: {
    flex: 1,
  },
  // Comments
  commentsSection: {
    marginBottom: 16,
  },
  commentsSectionHeader: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsList: {
    gap: 12,
  },
  commentItem: {
    flexDirection: 'row',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentMeta: {
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  // Comment attachments (input)
  commentInputWrapper: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  commentAttachmentPreviewContainer: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  commentAttachmentPreviewContent: {
    gap: 8,
  },
  commentAttachmentPreview: {
    position: 'relative',
  },
  commentAttachmentImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
  },
  // Comment attachments (display)
  commentAttachmentsScroll: {
    marginTop: 8,
  },
  commentAttachmentThumbnail: {
    marginRight: 8,
  },
  commentAttachmentThumbnailImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  // Rating
  ratingCard: {
    padding: 20,
    marginBottom: 12,
  },
  starContainer: {
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  starButton: {
    padding: 4,
  },
  feedbackInput: {
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    fontSize: 15,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  existingRatingCard: {
    padding: 16,
    marginBottom: 12,
  },
  // Cancel
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  // Image Modal
  imageModal: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: '80%',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
});

export default MaintenanceDetailScreen;
