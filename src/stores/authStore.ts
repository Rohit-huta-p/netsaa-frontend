// src/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import SecureStoreAdapter from './secureStorageAdapter';
import type { User } from '../types';
import authService from '../services/authService';

/**
 * PRD v4 Two-Context Auth Store
 *
 * No fixed role. Every user has both artist and hirer contexts.
 * Context is determined by the page/action, not a role field.
 */

type UserContexts = {
  artist: { enabled: boolean; profileComplete: boolean };
  hirer: { enabled: boolean; profileComplete: boolean };
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  isAuthLoading: boolean;
  isHydrated: boolean;
  profileCompletion: number;
  profileMissing: string[];

  // Two-context model (replaces old role field)
  contexts: UserContexts;
  trustTier: 'new' | 'rising' | 'trusted' | 'verified';
  trustScore: number;

  // Actions
  setAuth: (payload: { user: User; accessToken: string }) => void;
  clearAuth: () => void;
  setIsAuthLoading: (loading: boolean) => void;
  setProfileCompletion: (score: number, missing: string[]) => void;

  // Context helpers
  hasArtistContext: () => boolean;
  hasHirerContext: () => boolean;
};

const DEFAULT_CONTEXTS: UserContexts = {
  artist: { enabled: true, profileComplete: false },
  hirer: { enabled: true, profileComplete: false },
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
      contexts: DEFAULT_CONTEXTS,
      trustTier: 'new',
      trustScore: 0,

      setAuth: (payload) => {
        const user = payload.user as any;

        // Extract contexts from user (backend sends this in JWT and getMe response)
        const contexts: UserContexts = user?.contexts || DEFAULT_CONTEXTS;
        const trustTier = user?.trustTier || 'new';
        const trustScore = user?.trustScore || 0;

        // Backward compatibility: if old role field exists, map it
        if (user?.role && !user?.contexts) {
          contexts.artist.enabled = true;
          contexts.hirer.enabled = true;
          contexts.artist.profileComplete = user.role === 'artist';
          contexts.hirer.profileComplete = user.role === 'organizer';
        }

        set({
          user,
          accessToken: payload.accessToken,
          contexts,
          trustTier,
          trustScore,
        });
      },

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          profileCompletion: 0,
          profileMissing: [],
          contexts: DEFAULT_CONTEXTS,
          trustTier: 'new',
          trustScore: 0,
        }),

      setIsAuthLoading: (loading) => set({ isAuthLoading: loading }),

      setProfileCompletion: (score, missing) =>
        set({ profileCompletion: score, profileMissing: missing }),

      // Context helpers
      hasArtistContext: () => get().contexts.artist.enabled,
      hasHirerContext: () => get().contexts.hirer.enabled,
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => SecureStoreAdapter),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        profileCompletion: state.profileCompletion,
        profileMissing: state.profileMissing,
        contexts: state.contexts,
        trustTier: state.trustTier,
      }),
      onRehydrateStorage: () => (state) => {
        useAuthStore.setState({ isHydrated: true });

        if (state && state.accessToken) {
          useAuthStore.setState({ isAuthLoading: true });
          authService.getMe()
            .then((user: any) => {
              const contexts = user?.contexts || DEFAULT_CONTEXTS;
              const trustTier = user?.trustTier || 'new';
              const trustScore = user?.trustScore || 0;

              useAuthStore.setState({
                user,
                contexts,
                trustTier,
                trustScore,
                isAuthLoading: false,
              });
            })
            .catch((err: any) => {
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
