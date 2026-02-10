// src/stores/registerUiStore.ts
import { create } from 'zustand';

type PersonalizationData = {
  intent?: string;
  artistType?: string;
  organizationType?: string;
  experienceLevel?: string;
  instagramHandle?: string;
};

type RegisterUiState = {
  currentStep: number; // 0 = account, 1 = personalization
  personalizationData: PersonalizationData;

  setStep: (n: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setPersonalizationData: (data: Partial<PersonalizationData>) => void;
  resetRegistration: () => void;
};

export const useRegisterUiStore = create<RegisterUiState>((set, get) => ({
  currentStep: 0,
  personalizationData: {},

  setStep: (n) => set({ currentStep: Math.max(0, Math.min(1, n)) }),
  nextStep: () => set({ currentStep: Math.min(1, get().currentStep + 1) }),
  prevStep: () => set({ currentStep: Math.max(0, get().currentStep - 1) }),
  setPersonalizationData: (data) =>
    set({ personalizationData: { ...get().personalizationData, ...data } }),
  resetRegistration: () =>
    set({ currentStep: 0, personalizationData: {} }),
}));

export default useRegisterUiStore;
