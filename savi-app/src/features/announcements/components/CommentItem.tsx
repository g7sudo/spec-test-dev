/**
 * CommentItem Component
 * 
 * Displays a single comment with author info, content, and delete option.
 * Supports threaded replies.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Text, Row, Avatar } from '@/shared/components';
import { useTranslation } from 'react-i18next';
import { AnnouncementCommentDto } from '@/services/api/announcements';

interface CommentItemProps {
  /** The comment data to display */
  comment: AnnouncementCommentDto;
  /** Called when delete is pressed (only shown for current user's comments) */
  onDelete?: (commentId: string) => void;
  /** Called when reply is pressed */
  onReply?: (commentId: string) => void;
  /** Is this a nested reply (affects styling) */
  isReply?: boolean;
  /** Is delete in progress */
  isDeleting?: boolean;
}

/**
 * CommentItem - Displays a single comment
 * 
 * Features:
 * - Author avatar, name, and time
 * - Comment content
 * - Delete button for current user's comments
 * - Reply button (optional)
 * - Nested reply styling
 */
export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onDelete,
  onReply,
  isReply = false,
  isDeleting = false,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('announcements');

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return t('timeAgo.justNow', { defaultValue: 'Just now' });
      if (diffMins < 60) return t('timeAgo.minutes', { count: diffMins, defaultValue: `${diffMins}m ago` });
      if (diffHours < 24) return t('timeAgo.hours', { count: diffHours, defaultValue: `${diffHours}h ago` });
      if (diffDays < 7) return t('timeAgo.days', { count: diffDays, defaultValue: `${diffDays}d ago` });
      
      // Show full date for older comments
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Handle delete with confirmation
  const handleDelete = useCallback(() => {
    Alert.alert(
      t('deleteComment.title', { defaultValue: 'Delete Comment' }),
      t('deleteComment.message', { defaultValue: 'Are you sure you want to delete this comment?' }),
      [
        { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('common.delete', { defaultValue: 'Delete' }),
          style: 'destructive',
          onPress: () => onDelete?.(comment.id),
        },
      ]
    );
  }, [comment.id, onDelete, t]);

  // Handle reply
  const handleReply = useCallback(() => {
    onReply?.(comment.id);
  }, [comment.id, onReply]);

  return (
    <View style={[styles.container, isReply && styles.replyContainer]}>
      {/* Author Row */}
      <Row style={styles.authorRow}>
        <Row style={styles.authorInfo}>
          <Avatar
            size="small"
            name={comment.author.displayName}
            imageUrl={comment.author.profileImageUrl || undefined}
          />
          <View>
            <Row style={styles.nameRow}>
              <Text variant="bodySmall" weight="semiBold">
                {comment.author.displayName}
              </Text>
              {comment.author.isCurrentUser && (
                <View style={[styles.youBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Text variant="caption" color={theme.colors.textSecondary}>
                    {t('you', { defaultValue: 'You' })}
                  </Text>
                </View>
              )}
            </Row>
            <Text variant="caption" color={theme.colors.textSecondary}>
              {formatTimeAgo(comment.createdAt)}
            </Text>
          </View>
        </Row>

        {/* Delete button (only for current user's comments) */}
        {comment.author.isCurrentUser && onDelete && (
          <TouchableOpacity
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={isDeleting}
            style={styles.deleteButton}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={isDeleting ? theme.colors.textDisabled : theme.colors.error}
            />
          </TouchableOpacity>
        )}
      </Row>

      {/* Comment Content */}
      <Text variant="body" style={styles.content}>
        {comment.content}
      </Text>

      {/* Action Row (Reply) */}
      {onReply && !isReply && (
        <TouchableOpacity onPress={handleReply} style={styles.replyButton}>
          <Ionicons name="arrow-undo-outline" size={14} color={theme.colors.textSecondary} />
          <Text variant="caption" color={theme.colors.textSecondary}>
            {t('reply', { defaultValue: 'Reply' })}
          </Text>
        </TouchableOpacity>
      )}

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onDelete={onDelete}
              isReply
              isDeleting={isDeleting}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  replyContainer: {
    marginLeft: 32,
    paddingVertical: 8,
    borderBottomWidth: 0,
    borderLeftWidth: 2,
    borderLeftColor: '#E0E0E0',
    paddingLeft: 12,
  },
  authorRow: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  authorInfo: {
    gap: 10,
    alignItems: 'center',
  },
  nameRow: {
    gap: 6,
    alignItems: 'center',
  },
  youBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  content: {
    lineHeight: 20,
    marginLeft: 42, // Align with author name (avatar width + gap)
  },
  deleteButton: {
    padding: 4,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 42,
    marginTop: 8,
  },
  repliesContainer: {
    marginTop: 4,
  },
});

export default CommentItem;

