import { create } from 'zustand';

export interface PayoutDraft {
  businessType: 'individual' | 'sole_prop' | 'partnership' | 'llp' | 'pvt_ltd' | null;
  pan: string; accountHolderName: string; bankAccount: string; bankConfirm: string;
  ifsc: string; gstin: string; email: string;
}

const empty: PayoutDraft = { businessType: null, pan: '', accountHolderName: '', bankAccount: '', bankConfirm: '', ifsc: '', gstin: '', email: '' };

interface State {
  step: number; // 1-6
  draft: PayoutDraft;
  setStep: (n: number) => void;
  patch: (p: Partial<PayoutDraft>) => void;
  reset: () => void;
}

export const usePayoutWizardStore = create<State>((set) => ({
  step: 1, draft: empty,
  setStep: (step) => set({ step }),
  patch: (p) => set((s) => ({ draft: { ...s.draft, ...p } })),
  reset: () => set({ step: 1, draft: empty }),
}));
