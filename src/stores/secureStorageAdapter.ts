// src/stores/secureStorageAdapter.ts
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SecureStoreAdapter = {
  async getItem(name: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(name) : null;
    }
    try {
      const v = await SecureStore.getItemAsync(name);
      return v ?? null;
    } catch (err) {
      console.warn('SecureStore getItem failed', err);
      return null;
    }
  },
  async setItem(name: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(name, value);
      }
      return;
    }
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (err) {
      console.warn('SecureStore setItem failed', err);
    }
  },
  async removeItem(name: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(name);
      }
      return;
    }
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (err) {
      console.warn('SecureStore removeItem failed', err);
    }
  },
};

export default SecureStoreAdapter;
