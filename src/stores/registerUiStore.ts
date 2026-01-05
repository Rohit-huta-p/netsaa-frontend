// src/stores/registerUiStore.ts
import { create } from 'zustand';

type RegisterUiState = {
  onboardingStep: number;
  showRoleModal: boolean;

  setStep: (n: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setRoleModal: (v: boolean) => void;
};

export const useRegisterUiStore = create<RegisterUiState>((set, get) => ({
  onboardingStep: 0,
  showRoleModal: false,
  setStep: (n) => set({ onboardingStep: n }),
  nextStep: () => set({ onboardingStep: get().onboardingStep + 1 }),
  prevStep: () => set({ onboardingStep: Math.max(0, get().onboardingStep - 1) }),
  setRoleModal: (v) => set({ showRoleModal: v }),
}));

export default useRegisterUiStore;
