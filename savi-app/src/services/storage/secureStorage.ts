import * as SecureStore from 'expo-secure-store';

/**
 * Wrapper around SecureStore for sensitive data
 * Use this for tokens, passwords, and other sensitive information
 */
export const secureStorage = {
  /**
   * Get a value from secure storage
   */
  get: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error getting ${key} from secure storage:`, error);
      return null;
    }
  },

  /**
   * Set a value in secure storage
   */
  set: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Error setting ${key} in secure storage:`, error);
    }
  },

  /**
   * Remove a value from secure storage
   */
  remove: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Error removing ${key} from secure storage:`, error);
    }
  },
};

export default secureStorage;
