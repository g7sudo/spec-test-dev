import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/core/theme';
import { Avatar, Text } from '@/shared/components';

interface HouseholdMember {
  id: string;
  name: string;
  photoUrl?: string;
  isNew?: boolean;
}

interface HouseholdAvatarsProps {
  members: HouseholdMember[];
  onMemberPress: (memberId: string) => void;
}

export const HouseholdAvatars: React.FC<HouseholdAvatarsProps> = ({
  members,
  onMemberPress,
}) => {
  const { theme } = useTheme();

  if (members.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {members.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={styles.memberContainer}
            onPress={() => onMemberPress(member.id)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarWrapper}>
              <Avatar
                size="large"
                name={member.name}
                imageUrl={member.photoUrl}
                style={[
                  styles.avatar,
                  member.isNew && styles.avatarWithBorder,
                ]}
              />
              {member.isNew && (
                <View style={styles.newBadge}>
                  <Text
                    variant="caption"
                    color="#FFFFFF"
                    style={styles.newBadgeText}
                  >
                    New
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    backgroundColor: '#F7F8FA', // Match scroll background for seamless sticky
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  memberContainer: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarWithBorder: {
    borderColor: '#1A1A2E', // Primary color
  },
  newBadge: {
    position: 'absolute',
    top: -4,
    left: 0,
    backgroundColor: '#1A1A2E', // Dark Blue/Primary
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 1,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default HouseholdAvatars;
