import { create } from 'zustand';
import type { EventLocation, EventMedia } from '@/services/eventService';

export type ComposerStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type RefundPolicy = 'flex_24h' | 'firm' | 'custom';

export interface ComposerPricing {
  amount: number;
  currency: 'INR';
  refundPolicy: RefundPolicy;
  refundCustomNote?: string;
}

export interface ComposerForm {
  title: string;
  tagline?: string;
  topicTags: string[];
  registrationMode: 'free_rsvp' | 'paid_ticket';
  about: string;
  whatToExpect?: string;
  skills: string[];
  startsAt: string | null;
  endsAt: string | null;
  durationKind: 'm30' | 'h1' | 'h2' | 'h3' | 'half' | 'full' | 'multi' | null;
  location: EventLocation;
  capacity: { total: number };
  pricing: ComposerPricing;
  media: EventMedia[];
}

const initialForm: ComposerForm = {
  title: '',
  tagline: '',
  topicTags: [],
  registrationMode: 'free_rsvp',
  about: '',
  whatToExpect: '',
  skills: [],
  startsAt: null,
  endsAt: null,
  durationKind: null,
  location: { kind: 'in_person' },
  capacity: { total: 50 },
  pricing: { amount: 0, currency: 'INR', refundPolicy: 'flex_24h' },
  media: [],
};

interface State {
  step: ComposerStep;
  completedSteps: Set<ComposerStep>;
  form: ComposerForm;
  isSubmitting: boolean;
  setStep: (s: ComposerStep) => void;
  markComplete: (s: ComposerStep) => void;
  update: <K extends keyof ComposerForm>(k: K, v: ComposerForm[K]) => void;
  reset: () => void;
  setSubmitting: (v: boolean) => void;
}

export const useCreateEventStore = create<State>((set) => ({
  step: 1,
  completedSteps: new Set(),
  form: initialForm,
  isSubmitting: false,
  setStep: (step) => set({ step }),
  markComplete: (s) => set((state) => ({ completedSteps: new Set([...state.completedSteps, s]) })),
  update: (key, value) => set((state) => ({ form: { ...state.form, [key]: value } })),
  reset: () => set({ step: 1, completedSteps: new Set(), form: initialForm, isSubmitting: false }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
}));
