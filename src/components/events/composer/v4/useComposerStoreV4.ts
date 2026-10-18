/**
 * v4 composer store (Zustand). Holds ComposerFormV4, step navigation, and the
 * list mutations the screens need (spots / offers / questions). Pure state —
 * no network. `payload()` is the submit contract (buildEventPayload). Behind
 * the EXPO_PUBLIC_FEATURE_EVENT_V4 flag.
 *
 * setEventType only sets the type: a type carries no rules, and its
 * suggestions (role, pills, question hints, default door) are read live from
 * the preset in the UI, so switching type mid-edit never clobbers the host's
 * entered spots/questions. reset(type) is the one place a preset seeds state.
 */
import { create } from 'zustand';
import {
  type ComposerFormV4, type SpotV4, type OfferV4, type QuestionV4,
  initialFormV4, buildEventPayload,
} from './composerForm';

export type V4Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;
const MAX_SPOTS = 8, MAX_OFFERS = 6, MAX_QUESTIONS = 3; // offers = 1 early-bird + up to 5 group tiers

let seq = 0;
const uid = (p: string) => `${p}-${++seq}-${Math.random().toString(36).slice(2, 7)}`;
const clampStep = (n: number): V4Step => (Math.max(1, Math.min(7, n)) as V4Step);

export interface V4State {
  step: V4Step;
  form: ComposerFormV4;
  isSubmitting: boolean;
  editMode: boolean;
  editEventId: string | null;

  setStep: (s: V4Step) => void;
  next: () => void;
  back: () => void;
  update: <K extends keyof ComposerFormV4>(k: K, v: ComposerFormV4[K]) => void;
  setEventType: (type: string) => void;

  addSpot: (spot?: Partial<SpotV4>) => void;
  updateSpot: (id: string, patch: Partial<SpotV4>) => void;
  removeSpot: (id: string) => void;

  addOffer: (offer?: Partial<OfferV4>) => void;
  updateOffer: (id: string, patch: Partial<OfferV4>) => void;
  removeOffer: (id: string) => void;

  addQuestion: (q?: Partial<QuestionV4>) => void;
  updateQuestion: (id: string, patch: Partial<QuestionV4>) => void;
  removeQuestion: (id: string) => void;

  setSubmitting: (v: boolean) => void;
  reset: (type?: string) => void;
  hydrate: (form: Partial<ComposerFormV4>, editEventId?: string) => void;
  payload: () => Record<string, any>;
}

export const useComposerStoreV4 = create<V4State>((set, get) => ({
  step: 1,
  form: initialFormV4('workshop'),
  isSubmitting: false,
  editMode: false,
  editEventId: null,

  setStep: (step) => set({ step: clampStep(step) }),
  next: () => set((s) => ({ step: clampStep(s.step + 1) })),
  back: () => set((s) => ({ step: clampStep(s.step - 1) })),
  update: (key, value) => set((s) => ({ form: { ...s.form, [key]: value } })),
  setEventType: (type) =>
    set((s) => ({ form: { ...s.form, eventType: type, eventTypeLabel: s.form.eventType === type ? s.form.eventTypeLabel : undefined } })),

  addSpot: (spot) => set((s) => s.form.spots.length >= MAX_SPOTS ? s : ({
    form: { ...s.form, spots: [...s.form.spots, { id: uid('spot'), name: '', capacity: 20, price: 0, ...spot }] },
  })),
  updateSpot: (id, patch) => set((s) => ({ form: { ...s.form, spots: s.form.spots.map((x) => x.id === id ? { ...x, ...patch } : x) } })),
  removeSpot: (id) => set((s) => ({ form: { ...s.form, spots: s.form.spots.filter((x) => x.id !== id), offers: s.form.offers.map((o) => (o.spotId === id ? { ...o, spotId: undefined } : o)) } })),

  addOffer: (offer) => set((s) => s.form.offers.length >= MAX_OFFERS ? s : ({
    form: { ...s.form, offers: [...s.form.offers, { id: uid('offer'), name: '', price: 0, audience: 'everyone', ...offer }] },
  })),
  updateOffer: (id, patch) => set((s) => ({ form: { ...s.form, offers: s.form.offers.map((x) => x.id === id ? { ...x, ...patch } : x) } })),
  removeOffer: (id) => set((s) => ({ form: { ...s.form, offers: s.form.offers.filter((x) => x.id !== id) } })),

  addQuestion: (q) => set((s) => s.form.questions.length >= MAX_QUESTIONS ? s : ({
    form: { ...s.form, questions: [...s.form.questions, { id: uid('q'), label: '', type: 'text', required: false, ...q }] },
  })),
  updateQuestion: (id, patch) => set((s) => ({ form: { ...s.form, questions: s.form.questions.map((x) => x.id === id ? { ...x, ...patch } : x) } })),
  removeQuestion: (id) => set((s) => ({ form: { ...s.form, questions: s.form.questions.filter((x) => x.id !== id) } })),

  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  reset: (type = 'workshop') => set({ step: 1, form: initialFormV4(type), isSubmitting: false, editMode: false, editEventId: null }),
  hydrate: (form, editEventId) => set((s) => ({ form: { ...s.form, ...form }, editMode: !!editEventId, editEventId: editEventId ?? null, step: 1 })),
  payload: () => buildEventPayload(get().form),
}));
