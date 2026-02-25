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
  profileCompletion: number;
  profileMissing: string[];

  setAuth: (payload: { user: User; accessToken: string }) => void;
  clearAuth: () => void;
  setIsAuthLoading: (loading: boolean) => void;
  setProfileCompletion: (score: number, missing: string[]) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthLoading: false,
      isHydrated: true,
      profileCompletion: 0,
      profileMissing: [],

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
          profileCompletion: 0,
          profileMissing: [],
        }),

      setIsAuthLoading: (loading) => set({ isAuthLoading: loading }),

      setProfileCompletion: (score, missing) =>
        set({ profileCompletion: score, profileMissing: missing }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => SecureStoreAdapter),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        profileCompletion: state.profileCompletion,
        profileMissing: state.profileMissing,
      }),
      onRehydrateStorage: () => (state) => {
        console.log('onRehydrateStorage', state);
        useAuthStore.setState({ isHydrated: true });

        if (state && state.accessToken) {
          useAuthStore.setState({ isAuthLoading: true });
          authService.getMe()
            .then((user) => {
              console.log('Rehydration verified user', user);
              if (user.role && !user.roles) user.roles = [user.role];
              useAuthStore.setState({ user, isAuthLoading: false });
            })
            .catch((err) => {
              console.log('Rehydration failed', err);
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
