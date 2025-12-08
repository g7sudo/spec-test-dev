import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '@/core/theme';
import { Screen, Text, Button } from '@/shared/components';
import { RootStackParamList } from '@/app/navigation/types';

type ForceUpdateRouteProp = RouteProp<RootStackParamList, 'ForceUpdate'>;

export const ForceUpdateScreen: React.FC = () => {
  const { theme } = useTheme();
  const route = useRoute<ForceUpdateRouteProp>();
  const { message, storeUrl } = route.params;

  const handleUpdate = async () => {
    try {
      await Linking.openURL(storeUrl);
    } catch (error) {
      console.error('Failed to open store URL:', error);
    }
  };

  return (
    <Screen safeArea style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="cloud-download-outline"
            size={80}
            color={theme.colors.primary}
          />
        </View>

        <Text variant="h2" align="center" style={styles.title}>
          Update Required
        </Text>

        <Text
          variant="body"
          color={theme.colors.textSecondary}
          align="center"
          style={styles.message}
        >
          {message}
        </Text>

        <Button
          title="Update App"
          variant="primary"
          size="large"
          fullWidth
          onPress={handleUpdate}
          style={styles.button}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    marginBottom: 16,
  },
  message: {
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  button: {
    minWidth: 200,
  },
});

export default ForceUpdateScreen;
