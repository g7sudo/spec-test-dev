import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedTabBar } from './AnimatedTabBar';
import {
  MainTabParamList,
  HomeStackParamList,
  FacilityStackParamList,
  ServicesStackParamList,
  CommunityStackParamList,
  ProfileStackParamList,
} from './types';
import { useTheme } from '@/core/theme';

// Home Stack Screens
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { NotificationsScreen } from '@/features/notifications/screens/NotificationsScreen';
import { MaintenanceDetailScreen } from '@/features/maintenance/screens/MaintenanceDetailScreen';
import { CreateMaintenanceScreen } from '@/features/maintenance/screens/CreateMaintenanceScreen';

// Facility Stack Screens
import { FacilityScreen } from '@/features/facility/screens/FacilityScreen';
import { AmenityDetailScreen } from '@/features/facility/screens/AmenityDetailScreen';
import { MyBookingsScreen } from '@/features/facility/screens/MyBookingsScreen';

// Services Stack Screens
import { ServicesScreen } from '@/features/services/screens/ServicesScreen';
import { MaintenanceListScreen } from '@/features/maintenance/screens/MaintenanceListScreen';
import { VisitorListScreen, CreateVisitorScreen } from '@/features/visitors/screens';

// Community Stack Screens
import { CommunityScreen } from '@/features/community/screens/CommunityScreen';

// Profile Stack Screens
import {
  ProfileScreen,
  SettingsScreen,
  EditProfileScreen,
  ChangePasswordScreen,
  MyUnitsScreen,
  HouseholdMembersScreen,
  SwitchCommunityScreen,
  NotificationsSettingsScreen,
  PrivacyScreen,
} from '@/features/profile/screens';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const FacilityStack = createNativeStackNavigator<FacilityStackParamList>();
const ServicesStack = createNativeStackNavigator<ServicesStackParamList>();
const CommunityStack = createNativeStackNavigator<CommunityStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// Home Stack Navigator
const HomeStackNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: true, title: 'Notifications' }}
      />
      <HomeStack.Screen
        name="MaintenanceDetail"
        component={MaintenanceDetailScreen}
        options={{ headerShown: true, title: 'Request Details' }}
      />
      <HomeStack.Screen
        name="CreateMaintenance"
        component={CreateMaintenanceScreen}
        options={{ headerShown: false }}
      />
    </HomeStack.Navigator>
  );
};

// Facility Stack Navigator
const FacilityStackNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <FacilityStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <FacilityStack.Screen name="FacilityMain" component={FacilityScreen} />
      <FacilityStack.Screen
        name="AmenityDetail"
        component={AmenityDetailScreen}
        options={{ headerShown: false }}
      />
      <FacilityStack.Screen
        name="MyBookings"
        component={MyBookingsScreen}
        options={{ headerShown: false }}
      />
    </FacilityStack.Navigator>
  );
};

// Services Stack Navigator
const ServicesStackNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <ServicesStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <ServicesStack.Screen name="ServicesMain" component={ServicesScreen} />
      <ServicesStack.Screen
        name="MaintenanceList"
        component={MaintenanceListScreen}
        options={{ headerShown: true, title: 'My Requests' }}
      />
      <ServicesStack.Screen
        name="MaintenanceDetail"
        component={MaintenanceDetailScreen}
        options={{ headerShown: true, title: 'Request Details' }}
      />
      <ServicesStack.Screen
        name="CreateMaintenance"
        component={CreateMaintenanceScreen}
        options={{ headerShown: false }}
      />
      <ServicesStack.Screen
        name="VisitorList"
        component={VisitorListScreen}
        options={{ headerShown: false }}
      />
      <ServicesStack.Screen
        name="CreateVisitor"
        component={CreateVisitorScreen}
        options={{ headerShown: false }}
      />
    </ServicesStack.Navigator>
  );
};

// Community Stack Navigator
const CommunityStackNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <CommunityStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <CommunityStack.Screen name="CommunityMain" component={CommunityScreen} />
    </CommunityStack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileStackNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="HouseholdMembers"
        component={HouseholdMembersScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="LinkedUnits"
        component={MyUnitsScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="SwitchCommunity"
        component={SwitchCommunityScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="Notifications"
        component={NotificationsSettingsScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{ headerShown: false }}
      />
    </ProfileStack.Navigator>
  );
};

// Main Tab Navigator
export const MainNavigator: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('home');
  const insets = useSafeAreaInsets();
  
  // Calculate tab bar height consistently
  // Base height: 60 (8 padding top + 44 content + 8 padding bottom)
  // Plus safe area bottom inset on iOS
  const baseHeight = 60;
  const tabBarHeight = useMemo(() => {
    return Platform.select({
      ios: baseHeight + insets.bottom,
      android: baseHeight,
    });
  }, [insets.bottom]);

  // Base tab bar style
  // Note: AnimatedTabBar uses absolute positioning, so this style is applied to the inner BottomTabBar
  // Height already includes safe area bottom inset, so paddingBottom should only account for content padding
  const tabBarStyle = useMemo(() => {
    return {
      backgroundColor: '#F0F0F0', // Light gray background to match UI design
      borderTopWidth: 0, // Remove top border for cleaner look
      height: tabBarHeight, // Total height including safe area
      paddingBottom: Platform.select({
        ios: Math.max(insets.bottom, 8), // Safe area bottom + minimum content padding
        android: 8, // Content padding on Android
      }),
      paddingTop: 8,
      paddingHorizontal: 4,
      // Rounded corners at top for modern look
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      // Shadow/elevation for depth
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
        },
        android: {
          elevation: 6,
        },
      }),
      // Remove default positioning since AnimatedTabBar handles it
      position: 'relative' as const,
    };
  }, [tabBarHeight, insets.bottom]);

  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: tabBarStyle as any,
        tabBarActiveTintColor: theme.colors.primary, // Dark color for active tab
        tabBarInactiveTintColor: theme.colors.textSecondary, // Gray for inactive tabs
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4, // Space between icon and label
        },
        tabBarIconStyle: {
          marginTop: 4, // Space above icon
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'HomeMain';
          // Hide tab bar on CreateMaintenance screen
          const hideTabBar = routeName === 'CreateMaintenance';
          
          return {
            tabBarLabel: t('tabs.home'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
            tabBarStyle: hideTabBar ? { display: 'none' } : undefined,
          };
        }}
      />
      <Tab.Screen
        name="FacilityTab"
        component={FacilityStackNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'FacilityMain';
          // Hide tab bar on detail screens
          const hideTabBar = routeName === 'AmenityDetail' || routeName === 'MyBookings' || routeName === 'AmenityBooking';
          
          return {
            tabBarLabel: t('tabs.facility'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="business-outline" size={size} color={color} />
            ),
            tabBarStyle: hideTabBar ? { display: 'none' } : undefined,
          };
        }}
      />
      <Tab.Screen
        name="ServicesTab"
        component={ServicesStackNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'ServicesMain';
          // Hide tab bar on nested screens (CreateMaintenance, VisitorList, CreateVisitor)
          const hideTabBar = routeName === 'CreateMaintenance' || routeName === 'VisitorList' || routeName === 'CreateVisitor';
          
          return {
            tabBarLabel: t('tabs.services'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="construct-outline" size={size} color={color} />
            ),
            tabBarStyle: hideTabBar ? { display: 'none' } : undefined,
          };
        }}
      />
      <Tab.Screen
        name="CommunityTab"
        component={CommunityStackNavigator}
        options={{
          tabBarLabel: t('tabs.community'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="megaphone-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'ProfileMain';
          // Hide tab bar on nested screens (all screens except ProfileMain)
          // This includes: EditProfile, ChangePassword, Settings, HouseholdMembers,
          // LinkedUnits, SwitchCommunity, Notifications, Privacy
          const hideTabBar = routeName !== 'ProfileMain';
          
          return {
            tabBarLabel: t('tabs.profile'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
            tabBarStyle: hideTabBar ? { display: 'none' } : undefined,
          };
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
