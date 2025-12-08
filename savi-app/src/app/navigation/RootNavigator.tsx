import React, { useCallback } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useTheme } from '@/core/theme';
import { navLogger, logError } from '@/core/logger';

// Screens
import { SplashScreen } from '@/features/startup/screens/SplashScreen';
import { ForceUpdateScreen } from '@/features/startup/screens/ForceUpdateScreen';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { theme } = useTheme();

  navLogger.debug('RootNavigator rendering', { themeMode: theme.mode });

  const onStateChange = useCallback((state: any) => {
    navLogger.debug('Navigation state changed:', state?.routes?.[state?.index]?.name);
  }, []);

  const onError = useCallback((error: Error) => {
    logError('NavigationContainer', error);
  }, []);

  return (
    <NavigationContainer
      theme={theme.mode === 'dark' ? DarkTheme : DefaultTheme}
      onStateChange={onStateChange}
      onUnhandledAction={(action) => navLogger.warn('Unhandled action:', action)}
    >
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen
          name="ForceUpdate"
          component={ForceUpdateScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Main"
          component={MainNavigator}
          options={{ animation: 'fade' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
