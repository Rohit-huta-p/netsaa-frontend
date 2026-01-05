// src/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import SecureStoreAdapter from './secureStorageAdapter';
import type { User } from '../types';
import authService from '../services/authService';

type AuthState = {
  user: User | null;
  accessToken: string | null;
  isAuthLoading: boolean;
  isHydrated: boolean;

  setAuth: (payload: { user: User; accessToken: string }) => void;
  clearAuth: () => void;
  setIsAuthLoading: (loading: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthLoading: false,
      isHydrated: true,

      setAuth: (payload) => {
        const user = payload.user;
        if (user && user.role && !user.roles) {
          user.roles = [user.role];
        }
        set({
          user: user,
          accessToken: payload.accessToken,
        })
      },

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
        }),

      setIsAuthLoading: (loading) => set({ isAuthLoading: loading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => SecureStoreAdapter),
      onRehydrateStorage: () => (state) => {
        console.log('onRehydrateStorage', state);
        if (state && state.accessToken) {
          state.isAuthLoading = true; // Set loading while we verify
          authService.getMe()
            .then((user) => {
              console.log('Rehydration verified user', user);
              if (user.role && !user.roles) user.roles = [user.role];
              useAuthStore.setState({ user, isAuthLoading: false });
            })
            .catch((err) => {
              console.log('Rehydration failed', err);
              // Only clear auth if explicitly unauthorized (401)
              // If it's a network error, we keep the token so user can retry later
              if (err.response?.status === 401) {
                useAuthStore.getState().clearAuth();
              }
              useAuthStore.setState({ isAuthLoading: false });
            });
        }
      },
    }
  )
);

export default useAuthStore;
