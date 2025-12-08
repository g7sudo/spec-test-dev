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
              />
              {member.isNew && (
                <View
                  style={[
                    styles.newBadge,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
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
    paddingVertical: 12,
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
  newBadge: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    transform: [{ translateX: -16 }],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
});

export default HouseholdAvatars;
