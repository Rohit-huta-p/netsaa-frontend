import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorageAdapter from './asyncStorageAdapter';
import { UserMode, isValidMode } from '../lib/modeInference';

export interface ModeState {
  mode: UserMode;
  hasBootstrappedMode: boolean; // true after first resolution from AsyncStorage or server
  seenScreensWithTooltip: string[]; // serialized set (array) of screen IDs

  setMode: (m: UserMode) => void;
  setBootstrapped: (v: boolean) => void;
  markScreenSeen: (screenId: string) => void;
  hasSeenScreen: (screenId: string) => boolean;
}

export const useModeStore = create<ModeState>()(
  persist(
    (set, get) => ({
      mode: 'artist',
      hasBootstrappedMode: false,
      seenScreensWithTooltip: [],

      setMode: (m) => {
        if (!isValidMode(m)) return;
        set({ mode: m });
      },

      setBootstrapped: (v) => set({ hasBootstrappedMode: v }),

      markScreenSeen: (screenId) => {
        const current = get().seenScreensWithTooltip;
        if (current.includes(screenId)) return;
        set({ seenScreensWithTooltip: [...current, screenId] });
      },

      hasSeenScreen: (screenId) => get().seenScreensWithTooltip.includes(screenId),
    }),
    {
      name: 'netsa-mode-storage',
      storage: createJSONStorage(() => AsyncStorageAdapter),
      partialize: (state) => ({
        mode: state.mode,
        seenScreensWithTooltip: state.seenScreensWithTooltip,
      }),
      onRehydrateStorage: () => (state) => {
        // Defensive: if storage contains a bad mode value, fall back to 'artist'
        if (state && !isValidMode(state.mode)) {
          useModeStore.setState({ mode: 'artist' });
        }
      },
    }
  )
);
