import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { useTheme } from '@/core/theme';

// Screens
import { OnboardingScreen } from '@/features/onboarding/screens/OnboardingScreen';
import { ConsentScreen } from '@/features/onboarding/screens/ConsentScreen';
import { JoinCommunityScreen } from '@/features/invite/screens/JoinCommunityScreen';
import { ConfirmInviteScreen } from '@/features/invite/screens/ConfirmInviteScreen';
import { SetupAccountScreen } from '@/features/invite/screens/SetupAccountScreen';
import { SetupProfileScreen } from '@/features/invite/screens/SetupProfileScreen';
import { WelcomeScreen } from '@/features/invite/screens/WelcomeScreen';
import { TenantSelectionScreen } from '@/features/invite/screens/TenantSelectionScreen';
import { SignInScreen } from '@/features/auth/screens/SignInScreen';
import { SignUpScreen } from '@/features/auth/screens/SignUpScreen';
import { TenantSelectScreen } from '@/features/tenant/screens/TenantSelectScreen';
import { NoTenantScreen } from '@/features/tenant/screens/NoTenantScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Consent" component={ConsentScreen} />
      <Stack.Screen name="JoinCommunity" component={JoinCommunityScreen} />
      <Stack.Screen name="ConfirmInvite" component={ConfirmInviteScreen} />
      <Stack.Screen name="SetupAccount" component={SetupAccountScreen} />
      <Stack.Screen name="SetupProfile" component={SetupProfileScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="TenantSelection" component={TenantSelectionScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="TenantSelect" component={TenantSelectScreen} />
      <Stack.Screen name="NoTenant" component={NoTenantScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
