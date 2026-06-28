import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorageAdapter from './asyncStorageAdapter';

const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 12-month DPDP consent window

type Gate = 'none' | 'profile' | 'consent' | 'sheet';

interface State {
  gate: Gate;
  dpdpConsentAt: number | null;
  setGate: (g: Gate) => void;
  recordConsent: () => void;
  isConsentValid: () => boolean;
  reset: () => void;
}

export const useRegisterFlowStore = create<State>()(
  persist(
    (set, get) => ({
      gate: 'none',
      dpdpConsentAt: null,
      setGate: (gate) => set({ gate }),
      recordConsent: () => set({ dpdpConsentAt: Date.now() }),
      isConsentValid: () => {
        const at = get().dpdpConsentAt;
        return !!at && Date.now() - at < CONSENT_TTL_MS;
      },
      reset: () => set({ gate: 'none' }),
    }),
    {
      name: 'register-flow',
      storage: createJSONStorage(() => AsyncStorageAdapter),
      // Only persist the consent timestamp; gate state must stay ephemeral
      // (persisting it would resume the user mid-flow on next launch).
      partialize: (state) => ({ dpdpConsentAt: state.dpdpConsentAt }),
    }
  )
);
