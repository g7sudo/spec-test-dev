import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Root Stack
export type RootStackParamList = {
  Splash: undefined;
  ForceUpdate: { message: string; storeUrl: string };
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Auth Stack
export type AuthStackParamList = {
  Onboarding: undefined;
  Consent: undefined;
  JoinCommunity: undefined;
  ConfirmInvite: undefined; // Uses PendingInviteContext instead of params
  SetupAccount: undefined; // Password setup screen (email from context)
  SetupProfile: { firebaseToken: string; tenantId: string; email: string }; // Profile setup for new users
  Welcome: { firebaseToken: string }; // Welcome screen after profile setup
  TenantSelection: { firebaseToken: string }; // Tenant selection screen (legacy, may not be needed)
  SignIn: { email?: string }; // Removed inviteToken, using context instead
  SignUp: { email?: string }; // Removed inviteToken, using context instead
  TenantSelect: undefined;
  NoTenant: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  FacilityTab: NavigatorScreenParams<FacilityStackParamList>;
  ServicesTab: NavigatorScreenParams<ServicesStackParamList>;
  CommunityTab: NavigatorScreenParams<CommunityStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// Home Stack (within Home Tab)
export type HomeStackParamList = {
  HomeMain: undefined;
  Notifications: undefined;
  MaintenanceDetail: { requestId: string };
  CreateMaintenance: undefined;
};

// Facility Stack (Amenities)
export type FacilityStackParamList = {
  FacilityMain: undefined;
  AmenityDetail: { amenityId: string };
  AmenityBooking: { amenityId: string };
};

// Services Stack (Maintenance, Visitors)
export type ServicesStackParamList = {
  ServicesMain: undefined;
  MaintenanceList: undefined;
  MaintenanceDetail: { requestId: string };
  CreateMaintenance: undefined;
  VisitorList: undefined;
  VisitorDetail: { visitorId: string };
  CreateVisitor: undefined;
};

// Community Stack (Announcements)
export type CommunityStackParamList = {
  CommunityMain: undefined;
  AnnouncementDetail: { announcementId: string };
  PostDetail: { postId: string };
};

// Profile Stack
export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  HouseholdMembers: undefined;
  LinkedUnits: undefined;
};

// Screen props helpers
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> =
  NativeStackScreenProps<HomeStackParamList, T>;

export type FacilityStackScreenProps<T extends keyof FacilityStackParamList> =
  NativeStackScreenProps<FacilityStackParamList, T>;

export type ServicesStackScreenProps<T extends keyof ServicesStackParamList> =
  NativeStackScreenProps<ServicesStackParamList, T>;

export type CommunityStackScreenProps<T extends keyof CommunityStackParamList> =
  NativeStackScreenProps<CommunityStackParamList, T>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  NativeStackScreenProps<ProfileStackParamList, T>;

// Declare global navigation types for useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
