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

  // Three-role marketplace model: decides which gigs you see and who sees yours.
  role: 'client' | 'creative_lead' | 'artist';

  // Actions
  setAuth: (payload: { user: User; accessToken: string }) => void;
  setRole: (role: 'client' | 'creative_lead' | 'artist') => void;
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

/** Legacy backend values ('organizer') map forward; unknown -> artist. */
const normalizeMobileRole = (raw?: string): 'client' | 'creative_lead' | 'artist' => {
  if (raw === 'organizer') return 'creative_lead';
  if (raw === 'client' || raw === 'creative_lead' || raw === 'artist') return raw;
  return 'artist';
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthLoading: false,
      // MUST start false: the store inits synchronously but SecureStore
      // rehydrates async. onRehydrateStorage flips this true once the token is
      // actually restored. Starting true makes every `isHydrated && !accessToken`
      // gate mis-read a logged-in user as logged-out during the async gap.
      isHydrated: false,
      profileCompletion: 0,
      profileMissing: [],
      contexts: DEFAULT_CONTEXTS,
      trustTier: 'new',
      trustScore: 0,
      role: 'artist',

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
          role: normalizeMobileRole(user?.role),
        });
      },

      setRole: (role) => set({ role }),

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          profileCompletion: 0,
          profileMissing: [],
          contexts: DEFAULT_CONTEXTS,
          trustTier: 'new',
          trustScore: 0,
          role: 'artist',
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
        role: state.role,
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
                role: normalizeMobileRole(user?.role),
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
