// netsa-mobile/src/stores/asyncStorageAdapter.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

/**
 * Non-secret storage adapter for Zustand persist middleware.
 * Use this for UI state that doesn't need SecureStore (mode, tooltip seen state, etc.).
 * For tokens and secrets, use secureStorageAdapter.ts instead.
 */
const AsyncStorageAdapter: StateStorage = {
  getItem: async (name) => {
    try {
      return await AsyncStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch {
      // swallow write errors — persistence is best-effort for non-critical state
    }
  },
  removeItem: async (name) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      // swallow
    }
  },
};

export default AsyncStorageAdapter;
