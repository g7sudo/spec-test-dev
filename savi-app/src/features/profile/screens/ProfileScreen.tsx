import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/core/theme';
import { Screen, Text, Card, Row } from '@/shared/components';
import { useAuthStore } from '@/state/authStore';
import { useTenantStore } from '@/state/tenantStore';
import { usePendingInvite } from '@/core/contexts/PendingInviteContext';
import { signOut as firebaseSignOut } from '@/services/firebase/auth';
import { useAppStore } from '@/state/appStore';
import { navigationRef } from '@/core/navigation/navigationRef';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { getUserProfile, type UserProfileResponse } from '@/services/api/profile';
import { uploadProfilePhoto } from '@/services/api/profilePhoto';
import { useIsApiLoading } from '@/state/apiLoadingStore';
import { useScrollDirection } from '@/core/contexts/ScrollDirectionContext';

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
  const { user } = useAuthStore();
  const { selectedTenant, currentTenant } = useTenantStore();
  const { clearPendingInvite } = usePendingInvite();
  const { setIsScrollingUp } = useScrollDirection();
  
  // Refs for scroll tracking
  const lastScrollOffset = useRef(0);
  const scrollDirectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBottomNavDirectionRef = useRef<'up' | 'down' | null>(null);
  
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isApiLoading = useIsApiLoading();

  useEffect(() => {
    loadProfile();
  }, [selectedTenant?.tenantId, currentTenant?.id]); // Reload when tenant changes

  // Reload profile when screen comes into focus (e.g., returning from EditProfile)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile();
    });
    return unsubscribe;
  }, [navigation]);

  const loadProfile = async () => {
    // Check for tenant - use tenantId from selectedTenant or id from currentTenant
    const tenantId = selectedTenant?.tenantId || currentTenant?.id;
    if (!tenantId) {
      setIsLoadingProfile(false);
      return;
    }

    try {
      setIsLoadingProfile(true);
      setImageError(false); // Reset image error when reloading
      // Authorization header is automatically added by apiClient from auth store
      const profileData = await getUserProfile();
      setProfile(profileData);
      console.log('[ProfileScreen] ✅ Profile loaded:', {
        displayName: profileData.displayName,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        primaryEmail: profileData.primaryEmail,
        partyName: profileData.partyName,
        hasProfilePhoto: !!profileData.profilePhotoUrl,
      });
    } catch (error: any) {
      console.error('[ProfileScreen] ❌ Failed to load profile:', {
        error: error.message,
      });
      // Continue without profile data - use auth store data as fallback
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleImageError = () => {
    console.log('[ProfileScreen] ⚠️ Profile image failed to load (may be expired)');
    setImageError(true);
  };

  const requestImagePickerPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photos to change your profile picture.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  const handleChangePhoto = async () => {
    const hasPermission = await requestImagePickerPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Photo',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                // No base64 needed - we'll use file URI directly for FormData upload
              });

              if (!result.canceled && result.assets[0]) {
                await uploadPhoto(result.assets[0]);
              }
            } catch (error: any) {
              console.error('[ProfileScreen] ❌ Camera error:', error);
              Alert.alert('Error', 'Failed to take photo. Please try again.');
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                // No base64 needed - we'll use file URI directly for FormData upload
              });

              if (!result.canceled && result.assets[0]) {
                await uploadPhoto(result.assets[0]);
              }
            } catch (error: any) {
              console.error('[ProfileScreen] ❌ Image picker error:', error);
              Alert.alert('Error', 'Failed to pick image. Please try again.');
            }
          },
        },
      ]
    );
  };

  const uploadPhoto = async (asset: ImagePicker.ImagePickerAsset) => {
    const tenantId = selectedTenant?.tenantId || currentTenant?.id;
    if (!tenantId) {
      Alert.alert('Error', 'No tenant selected. Please select a community first.');
      return;
    }

    // Validate that we have a file URI
    if (!asset.uri) {
      Alert.alert('Error', 'No image file available. Please try selecting the image again.');
      return;
    }

    setIsUploadingPhoto(true);

    try {
      // Determine content type from mimeType or URI extension
      let contentType = asset.mimeType || 'image/jpeg';
      if (!asset.mimeType && asset.uri) {
        const extension = asset.uri.split('.').pop()?.toLowerCase();
        if (extension === 'png') contentType = 'image/png';
        else if (extension === 'gif') contentType = 'image/gif';
        else if (extension === 'webp') contentType = 'image/webp';
        else if (extension === 'jpg' || extension === 'jpeg') contentType = 'image/jpeg';
      }

      // Generate file name if not provided
      const fileName = asset.fileName || `profile-photo-${Date.now()}.${contentType.split('/')[1] || 'jpg'}`;

      console.log('[ProfileScreen] 📸 Uploading profile photo:', {
        uri: asset.uri.substring(0, 50) + '...',
        fileName,
        contentType,
        fileSize: asset.fileSize ? `${(asset.fileSize / 1024).toFixed(2)} KB` : 'unknown',
      });

      // Upload to API using multipart/form-data (FormData)
      const response = await uploadProfilePhoto({
        uri: asset.uri,
        fileName,
        contentType,
      });

      console.log('[ProfileScreen] ✅ Profile photo uploaded:', {
        documentId: response.documentId,
        downloadUrl: response.downloadUrl.substring(0, 50) + '...',
        sizeBytes: response.sizeBytes,
      });

      // Reload profile to get updated photo URL
      await loadProfile();

      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (error: any) {
      console.error('[ProfileScreen] ❌ Failed to upload photo:', error);
      Alert.alert(
        'Upload Failed',
        error.message || 'Failed to upload profile photo. Please try again.'
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Sign out from Firebase
              try {
                await firebaseSignOut();
              } catch (error) {
                console.warn('Firebase sign out error:', error);
                // Continue with logout even if Firebase sign out fails
              }

              // 2. Clear pending invite context
              clearPendingInvite();

              // 3. Clear all stores
              useAuthStore.getState().logout();
              useTenantStore.getState().clearTenant();
              useAppStore.getState().setIsAppReady(false);

              // 4. Reset navigation to Splash screen using global navigation ref
              if (navigationRef.isReady()) {
                navigationRef.reset({
                  index: 0,
                  routes: [{ name: 'Splash' }],
                });
              }
            } catch (error) {
              console.error('Error during logout:', error);
              // Even on error, try to clear state and reset navigation
              useAuthStore.getState().logout();
              useTenantStore.getState().clearTenant();
              useAppStore.getState().setIsAppReady(false);
              if (navigationRef.isReady()) {
                navigationRef.reset({
                  index: 0,
                  routes: [{ name: 'Splash' }],
                });
              }
            }
          },
        },
      ]
    );
  };

  const handleSwitchCommunity = () => {
    navigation.navigate('SwitchCommunity');
  };

  /**
   * Handle scroll begin drag - reset scroll tracking
   */
  const handleScrollBeginDrag = useCallback((event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    lastScrollOffset.current = offset;
  }, []);

  /**
   * Handle scroll - detect scroll direction and update nav bar visibility
   * 
   * Behavior:
   * - Scrolling UP → Hide navbar for full-screen experience
   * - Scrolling DOWN (even slightly) → Show navbar so users can navigate
   */
  const handleScroll = useCallback((event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    const clampedOffset = Math.max(0, offset); // Clamp to prevent negative values from bounce
    
    // Detect scroll direction for bottom nav visibility
    // More sensitive threshold for scroll down detection (shows navbar sooner)
    const scrollDelta = clampedOffset - lastScrollOffset.current;
    const isScrollingUpward = scrollDelta > 1.5; // Threshold to prevent jitter (slightly lower for responsiveness)
    const isScrollingDownward = scrollDelta < -1; // More sensitive - even small scroll down shows navbar
    
    // Update bottom nav visibility based on scroll direction
    // Behavior:
    // - Scrolling UP → Hide navbar for full-screen experience
    // - Scrolling DOWN (even slightly) → Show navbar so users can navigate
    // Only hide when scrolling up past a small threshold (to avoid hiding at top)
    const shouldHide = isScrollingUpward && clampedOffset > 10;
    // Show navbar when scrolling down OR when near top (for easy navigation)
    const shouldShow = isScrollingDownward || clampedOffset <= 10;
    
    // Determine current direction
    const currentDirection: 'up' | 'down' | null = shouldHide ? 'up' : (shouldShow ? 'down' : null);
    
    // Only set timeout if direction changed or no timeout exists
    const directionChanged = currentDirection !== null && currentDirection !== lastBottomNavDirectionRef.current;
    
    if (shouldHide && (directionChanged || !scrollDirectionTimeoutRef.current)) {
      // Scrolling up - hide bottom nav for full-screen view
      if (scrollDirectionTimeoutRef.current) {
        clearTimeout(scrollDirectionTimeoutRef.current);
        scrollDirectionTimeoutRef.current = null;
      }

      lastBottomNavDirectionRef.current = 'up';
      scrollDirectionTimeoutRef.current = setTimeout(() => {
        setIsScrollingUp(true);
        scrollDirectionTimeoutRef.current = null;
        lastBottomNavDirectionRef.current = null;
      }, 30); // Reduced delay for faster response
    } else if (shouldShow && (directionChanged || !scrollDirectionTimeoutRef.current)) {
      // Scrolling down (even slightly) or near top - show bottom nav for navigation
      if (scrollDirectionTimeoutRef.current) {
        clearTimeout(scrollDirectionTimeoutRef.current);
        scrollDirectionTimeoutRef.current = null;
      }

      lastBottomNavDirectionRef.current = 'down';
      scrollDirectionTimeoutRef.current = setTimeout(() => {
        setIsScrollingUp(false);
        scrollDirectionTimeoutRef.current = null;
        lastBottomNavDirectionRef.current = null;
      }, 30); // Reduced delay for faster response - shows navbar quickly
    }
    
    // Update last scroll offset
    lastScrollOffset.current = clampedOffset;
  }, [setIsScrollingUp]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollDirectionTimeoutRef.current) {
        clearTimeout(scrollDirectionTimeoutRef.current);
      }
    };
  }, []);

  const accountMenuItems: MenuItem[] = [
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      icon: 'person-outline',
      onPress: () => navigation.navigate('EditProfile'),
      showChevron: true,
    },
    {
      id: 'change-password',
      title: 'Change Password',
      subtitle: 'Update your password',
      icon: 'lock-closed-outline',
      onPress: () => navigation.navigate('ChangePassword'),
      showChevron: true,
    },
    {
      id: 'household',
      title: 'Household Members',
      subtitle: 'Manage family members',
      icon: 'people-outline',
      onPress: () => navigation.navigate('HouseholdMembers'),
      showChevron: true,
    },
    {
      id: 'units',
      title: 'My Units',
      subtitle: 'View linked units',
      icon: 'home-outline',
      onPress: () => navigation.navigate('LinkedUnits'),
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
      subtitle: 'Theme, language, biometric',
      icon: 'settings-outline',
      onPress: () => navigation.navigate('Settings'),
      showChevron: true,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage notification preferences',
      icon: 'notifications-outline',
      onPress: () => navigation.navigate('Notifications'),
      showChevron: true,
    },
    {
      id: 'privacy',
      title: 'Privacy',
      subtitle: 'Directory visibility and privacy',
      icon: 'shield-outline',
      onPress: () => navigation.navigate('Privacy'),
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
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        scrollEventThrottle={16}
      >
        {/* User Profile Card */}
        <Card style={styles.profileCard}>
          {isLoadingProfile ? (
            <Row align="center" gap={16}>
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: theme.colors.primaryLight },
                ]}
              >
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
              <View style={styles.profileInfo}>
                <Text variant="h3" weight="bold">
                  Loading...
                </Text>
                <Text variant="body" color={theme.colors.textSecondary}>
                  {user?.email || 'email@example.com'}
                </Text>
              </View>
            </Row>
          ) : (
            <Row align="center" gap={16}>
              {/* Profile Photo */}
              <TouchableOpacity
                onPress={handleChangePhoto}
                disabled={isUploadingPhoto || isApiLoading}
                activeOpacity={0.7}
                style={styles.avatarContainer}
              >
                {profile?.profilePhotoUrl && !imageError ? (
                  <Image
                    source={{ uri: profile.profilePhotoUrl }}
                    style={styles.avatar}
                    contentFit="cover"
                    onError={handleImageError}
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      { backgroundColor: theme.colors.primaryLight },
                    ]}
                  >
                    {isUploadingPhoto ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                      <Text variant="h2" color={theme.colors.primary}>
                        {(() => {
                          // Use displayName, firstName, or fallback to 'U'
                          const name = profile?.displayName || 
                                      (profile?.firstName && profile?.lastName 
                                        ? `${profile.firstName} ${profile.lastName}`
                                        : profile?.firstName || 
                                          profile?.partyName || 
                                          user?.displayName || 
                                          'U');
                          return name.charAt(0).toUpperCase();
                        })()}
                      </Text>
                    )}
                  </View>
                )}
                {/* Edit Icon Overlay */}
                <View style={styles.editIconOverlay}>
                  <View style={[styles.editIconContainer, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name="camera" size={16} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
              
              <View style={styles.profileInfo}>
                {/* Display Name */}
                <Text variant="h3" weight="bold">
                  {profile?.displayName || 
                   (profile?.firstName && profile?.lastName 
                     ? `${profile.firstName} ${profile.lastName}`
                     : profile?.firstName || 
                       profile?.partyName || 
                       user?.displayName || 
                       'User')}
                </Text>
                
                {/* Email */}
                <Text variant="body" color={theme.colors.textSecondary}>
                  {profile?.primaryEmail || user?.email || 'email@example.com'}
                </Text>
                
                {/* Community Name */}
                {selectedTenant && (
                  <Row gap={4} align="center" style={styles.unitInfo}>
                    <Ionicons
                      name="home-outline"
                      size={14}
                      color={theme.colors.textTertiary}
                    />
                    <Text variant="caption" color={theme.colors.textTertiary}>
                      {selectedTenant.tenantName}
                    </Text>
                  </Row>
                )}
              </View>
            </Row>
          )}
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
  avatarContainer: {
    position: 'relative',
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
  editIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  editIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
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
