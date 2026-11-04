import { create } from 'zustand';

export interface PayoutDraft {
  businessType: 'individual' | 'sole_prop' | 'partnership' | 'llp' | 'pvt_ltd' | null;
  pan: string; accountHolderName: string; bankAccount: string; bankConfirm: string;
  ifsc: string; gstin: string; email: string;
  /** UPI VPA — the primary payout destination (UPI-first) and the Secure ID name check. */
  vpa: string;
  /** Which payout destination the organizer is setting up. UPI-first by default. */
  payoutMethod: 'upi' | 'bank';
}

const empty: PayoutDraft = { businessType: null, pan: '', accountHolderName: '', bankAccount: '', bankConfirm: '', ifsc: '', gstin: '', email: '', vpa: '', payoutMethod: 'upi' };

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
