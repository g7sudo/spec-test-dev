import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

// Services Stack Screens
import { ServicesScreen } from '@/features/services/screens/ServicesScreen';
import { MaintenanceListScreen } from '@/features/maintenance/screens/MaintenanceListScreen';
import { VisitorListScreen, VisitorDetailScreen, CreateVisitorScreen } from '@/features/visitors/screens';

// Community Stack Screens
import { CommunityScreen } from '@/features/community/screens/CommunityScreen';

// Profile Stack Screens
import { ProfileScreen, SettingsScreen } from '@/features/profile/screens';

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
        options={{ headerShown: true, title: 'New Request' }}
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
        options={{ headerShown: true, title: 'New Request' }}
      />
      <ServicesStack.Screen
        name="VisitorList"
        component={VisitorListScreen}
        options={{ headerShown: false }}
      />
      <ServicesStack.Screen
        name="VisitorDetail"
        component={VisitorDetailScreen}
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
        name="Settings"
        component={SettingsScreen}
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
  
  // Calculate tab bar height
  const tabBarHeight = useMemo(() => {
    return Platform.select({
      ios: 60 + insets.bottom,
      android: 60,
    });
  }, [insets.bottom]);

  // Base tab bar style
  // Note: AnimatedTabBar uses absolute positioning, so this style is applied to the inner BottomTabBar
  const tabBarStyle = useMemo(() => {
    return {
      backgroundColor: '#F0F0F0', // Light gray background to match UI design
      borderTopWidth: 0, // Remove top border for cleaner look
      height: tabBarHeight,
      paddingBottom: Platform.select({
        ios: Math.max(insets.bottom, 8),
        android: 8,
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
        options={{
          tabBarLabel: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FacilityTab"
        component={FacilityStackNavigator}
        options={{
          tabBarLabel: t('tabs.facility'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ServicesTab"
        component={ServicesStackNavigator}
        options={{
          tabBarLabel: t('tabs.services'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" size={size} color={color} />
          ),
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
        options={{
          tabBarLabel: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
