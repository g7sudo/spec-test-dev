import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Text, Card, Row, Avatar } from '@/shared/components';
import { useTranslation } from 'react-i18next';

interface FeedPost {
  id: string;
  authorName: string;
  authorRole: string;
  authorPhotoUrl?: string;
  content: string;
  timestamp: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
}

interface CommunityFeedsSectionProps {
  posts: FeedPost[];
  onViewAll: () => void;
  onPostPress: (postId: string) => void;
  onLikePress: (postId: string) => void;
  onCommentPress: (postId: string) => void;
  isLoading?: boolean;
}

export const CommunityFeedsSection: React.FC<CommunityFeedsSectionProps> = ({
  posts,
  onViewAll,
  onPostPress,
  onLikePress,
  onCommentPress,
  isLoading,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const renderPostCard = (post: FeedPost) => (
    <TouchableOpacity
      key={post.id}
      onPress={() => onPostPress(post.id)}
      activeOpacity={0.7}
    >
      <Card style={styles.postCard}>
        <Row style={styles.authorRow}>
          <Row style={styles.authorInfo}>
            <Avatar
              size="small"
              name={post.authorName}
              imageUrl={post.authorPhotoUrl}
            />
            <View style={styles.authorDetails}>
              <Text variant="bodySmall" weight="semiBold">
                {post.authorName}
              </Text>
              <Text variant="caption" color={theme.colors.textSecondary}>
                {post.timestamp}
              </Text>
            </View>
          </Row>
          <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </Row>

        <Text
          variant="body"
          style={styles.content}
          numberOfLines={3}
        >
          {post.content}
        </Text>

        <Row style={styles.interactionRow}>
          <Row style={styles.interactions}>
            <TouchableOpacity
              style={styles.interactionButton}
              onPress={() => onLikePress(post.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={post.isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={post.isLiked ? theme.colors.error : theme.colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.interactionButton}
              onPress={() => onCommentPress(post.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="chatbubble-outline"
                size={18}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.interactionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="share-outline"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </Row>
          {post.likeCount > 0 && (
            <Text variant="caption" color={theme.colors.textSecondary}>
              {post.likeCount} liked this
            </Text>
          )}
        </Row>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text
        variant="body"
        color={theme.colors.textSecondary}
        align="center"
      >
        {t('noRecentUpdates', { ns: 'home' })}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Row style={styles.header}>
        <Text variant="bodyLarge" weight="semiBold">
          {t('communityFeeds', { ns: 'home' })}
        </Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text variant="bodySmall" color={theme.colors.primary}>
            {t('viewAll')}
          </Text>
        </TouchableOpacity>
      </Row>

      {posts.length === 0 ? (
        renderEmptyState()
      ) : (
        <View style={styles.postsList}>
          {posts.slice(0, 2).map(renderPostCard)}
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
  postsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  postCard: {
    padding: 16,
  },
  authorRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorInfo: {
    gap: 12,
  },
  authorDetails: {
    gap: 2,
  },
  content: {
    marginBottom: 12,
  },
  interactionRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  interactions: {
    gap: 16,
  },
  interactionButton: {
    padding: 4,
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
});

export default CommunityFeedsSection;
