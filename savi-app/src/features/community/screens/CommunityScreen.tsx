import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme';
import { Screen, Text, Card, Row, Avatar } from '@/shared/components';

interface Post {
  id: string;
  authorName: string;
  authorRole: string;
  authorPhotoUrl?: string;
  content: string;
  timestamp: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  imageUrl?: string;
}

const mockPosts: Post[] = [
  {
    id: '1',
    authorName: 'Security',
    authorRole: 'Admin',
    authorPhotoUrl: 'https://picsum.photos/100/100?random=1',
    content: 'Water supply will be interrupted on Sunday from 8 AM to 12 PM for maintenance work. Please store water in advance.',
    timestamp: '10 minutes ago',
    likeCount: 10,
    commentCount: 3,
    isLiked: true,
  },
  {
    id: '2',
    authorName: 'Community Manager',
    authorRole: 'Admin',
    authorPhotoUrl: 'https://picsum.photos/100/100?random=2',
    content: 'Dear residents, we are pleased to announce that the new playground equipment has been installed. Kids can start using it from tomorrow!',
    timestamp: '2 hours ago',
    likeCount: 25,
    commentCount: 8,
    isLiked: false,
    imageUrl: 'https://picsum.photos/400/200?random=5',
  },
  {
    id: '3',
    authorName: 'John Doe',
    authorRole: 'Resident',
    authorPhotoUrl: 'https://picsum.photos/100/100?random=3',
    content: 'Looking for recommendations for a good plumber. Anyone have any contacts?',
    timestamp: '5 hours ago',
    likeCount: 5,
    commentCount: 12,
    isLiked: false,
  },
];

export const CommunityScreen: React.FC = () => {
  const { theme } = useTheme();

  const handlePostPress = (postId: string) => {
    console.log('View post:', postId);
  };

  const handleLike = (postId: string) => {
    console.log('Like post:', postId);
  };

  const handleComment = (postId: string) => {
    console.log('Comment on post:', postId);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      onPress={() => handlePostPress(item.id)}
      activeOpacity={0.7}
    >
      <Card style={styles.postCard}>
        <Row style={styles.authorRow}>
          <Row style={styles.authorInfo}>
            <Avatar
              size="small"
              name={item.authorName}
              imageUrl={item.authorPhotoUrl}
            />
            <View style={styles.authorDetails}>
              <Text variant="bodySmall" weight="semiBold">
                {item.authorName}
              </Text>
              <Text variant="caption" color={theme.colors.textSecondary}>
                {item.timestamp}
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

        <Text variant="body" style={styles.content}>
          {item.content}
        </Text>

        {item.imageUrl && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.postImage}
            />
          </View>
        )}

        <Row style={styles.interactionRow}>
          <Row style={styles.interactions}>
            <TouchableOpacity
              style={styles.interactionButton}
              onPress={() => handleLike(item.id)}
            >
              <Ionicons
                name={item.isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={item.isLiked ? theme.colors.error : theme.colors.textSecondary}
              />
              <Text
                variant="caption"
                color={theme.colors.textSecondary}
                style={styles.interactionText}
              >
                {item.likeCount}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.interactionButton}
              onPress={() => handleComment(item.id)}
            >
              <Ionicons
                name="chatbubble-outline"
                size={18}
                color={theme.colors.textSecondary}
              />
              <Text
                variant="caption"
                color={theme.colors.textSecondary}
                style={styles.interactionText}
              >
                {item.commentCount}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.interactionButton}>
              <Ionicons
                name="share-outline"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </Row>
        </Row>
      </Card>
    </TouchableOpacity>
  );

  return (
    <Screen safeArea style={styles.screen}>
      <View style={styles.header}>
        <Text variant="h2">Community</Text>
        <TouchableOpacity>
          <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={mockPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
};

// Placeholder Image component since we can't use expo-image here
const Image = ({ source, style }: { source: { uri: string }; style: any }) => (
  <View style={[style, { backgroundColor: '#E0E0E0' }]} />
);

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
  },
  postCard: {
    padding: 16,
    marginBottom: 12,
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
  imageContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 180,
  },
  interactionRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  interactions: {
    gap: 24,
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  interactionText: {
    marginLeft: 4,
  },
});

export default CommunityScreen;
