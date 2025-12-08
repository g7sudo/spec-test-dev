import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/core/theme';
import { Screen, Text, Card, Row } from '@/shared/components';
import { useAuthStore } from '@/state/authStore';
import { useTenantStore } from '@/state/tenantStore';
import { Image } from 'expo-image';

type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  HouseholdMembers: undefined;
  LinkedUnits: undefined;
};

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

interface MenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress: () => void;
  showChevron?: boolean;
}

export const ProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user, signOut } = useAuthStore();
  const { selectedTenant, clearSelectedTenant } = useTenantStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            signOut();
            clearSelectedTenant();
          },
        },
      ]
    );
  };

  const handleSwitchCommunity = () => {
    Alert.alert(
      'Switch Community',
      'Are you sure you want to switch to a different community?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: () => {
            clearSelectedTenant();
          },
        },
      ]
    );
  };

  const accountMenuItems: MenuItem[] = [
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      icon: 'person-outline',
      onPress: () => console.log('Edit Profile'),
      showChevron: true,
    },
    {
      id: 'change-password',
      title: 'Change Password',
      subtitle: 'Update your password',
      icon: 'lock-closed-outline',
      onPress: () => console.log('Change Password'),
      showChevron: true,
    },
    {
      id: 'household',
      title: 'Household Members',
      subtitle: 'Manage family members',
      icon: 'people-outline',
      onPress: () => console.log('Household Members'),
      showChevron: true,
    },
    {
      id: 'units',
      title: 'My Units',
      subtitle: 'View linked units',
      icon: 'home-outline',
      onPress: () => console.log('My Units'),
      showChevron: true,
    },
  ];

  const communityMenuItems: MenuItem[] = [
    {
      id: 'switch-community',
      title: 'Switch Community',
      subtitle: selectedTenant?.tenantName || 'Select a community',
      icon: 'swap-horizontal-outline',
      iconColor: theme.colors.info,
      onPress: handleSwitchCommunity,
      showChevron: true,
    },
  ];

  const settingsMenuItems: MenuItem[] = [
    {
      id: 'settings',
      title: 'App Settings',
      subtitle: 'Theme, language, notifications',
      icon: 'settings-outline',
      onPress: () => navigation.navigate('Settings'),
      showChevron: true,
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'FAQs and contact support',
      icon: 'help-circle-outline',
      onPress: () => console.log('Help'),
      showChevron: true,
    },
    {
      id: 'about',
      title: 'About',
      subtitle: 'App version and legal info',
      icon: 'information-circle-outline',
      onPress: () => console.log('About'),
      showChevron: true,
    },
  ];

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      onPress={item.onPress}
      activeOpacity={0.7}
      style={styles.menuItem}
    >
      <Row align="center" gap={12}>
        <View
          style={[
            styles.menuIcon,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Ionicons
            name={item.icon}
            size={20}
            color={item.iconColor || theme.colors.primary}
          />
        </View>
        <View style={styles.menuContent}>
          <Text variant="body" weight="medium">
            {item.title}
          </Text>
          {item.subtitle && (
            <Text variant="caption" color={theme.colors.textSecondary}>
              {item.subtitle}
            </Text>
          )}
        </View>
        {item.showChevron && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textTertiary}
          />
        )}
      </Row>
    </TouchableOpacity>
  );

  return (
    <Screen safeArea style={styles.screen}>
      <View style={styles.header}>
        <Text variant="h2">Profile</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Card */}
        <Card style={styles.profileCard}>
          <Row align="center" gap={16}>
            {user?.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: theme.colors.primaryLight },
                ]}
              >
                <Text variant="h2" color={theme.colors.primary}>
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text variant="h3" weight="bold">
                {user?.displayName || 'User'}
              </Text>
              <Text variant="body" color={theme.colors.textSecondary}>
                {user?.email || 'email@example.com'}
              </Text>
              {selectedTenant && (
                <Row gap={4} align="center" style={styles.unitInfo}>
                  <Ionicons
                    name="home-outline"
                    size={14}
                    color={theme.colors.textTertiary}
                  />
                  <Text variant="caption" color={theme.colors.textTertiary}>
                    {selectedTenant.unitName} • {selectedTenant.tenantName}
                  </Text>
                </Row>
              )}
            </View>
          </Row>
        </Card>

        {/* Account Section */}
        <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
          Account
        </Text>
        <Card style={styles.menuCard}>
          {accountMenuItems.map((item, index) => (
            <View key={item.id}>
              {renderMenuItem(item)}
              {index < accountMenuItems.length - 1 && (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: theme.colors.divider },
                  ]}
                />
              )}
            </View>
          ))}
        </Card>

        {/* Community Section */}
        <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
          Community
        </Text>
        <Card style={styles.menuCard}>
          {communityMenuItems.map((item) => renderMenuItem(item))}
        </Card>

        {/* Settings Section */}
        <Text variant="bodyLarge" weight="semiBold" style={styles.sectionTitle}>
          Settings
        </Text>
        <Card style={styles.menuCard}>
          {settingsMenuItems.map((item, index) => (
            <View key={item.id}>
              {renderMenuItem(item)}
              {index < settingsMenuItems.length - 1 && (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: theme.colors.divider },
                  ]}
                />
              )}
            </View>
          ))}
        </Card>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={[
            styles.signOutButton,
            { backgroundColor: theme.colors.errorLight },
          ]}
        >
          <Row gap={8} align="center" justify="center">
            <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
            <Text variant="body" weight="semiBold" color={theme.colors.error}>
              Sign Out
            </Text>
          </Row>
        </TouchableOpacity>

        {/* App Version */}
        <Text
          variant="caption"
          color={theme.colors.textTertiary}
          align="center"
          style={styles.version}
        >
          SAVI App v1.0.0
        </Text>
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
    paddingVertical: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  profileCard: {
    padding: 20,
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  unitInfo: {
    marginTop: 4,
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 8,
  },
  menuCard: {
    padding: 0,
    marginBottom: 16,
    overflow: 'hidden',
  },
  menuItem: {
    padding: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginLeft: 68,
  },
  signOutButton: {
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  version: {
    marginTop: 24,
  },
});

export default ProfileScreen;
