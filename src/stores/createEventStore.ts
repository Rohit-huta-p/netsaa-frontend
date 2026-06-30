import { create } from 'zustand';
import type { EventLocation, EventMedia, AgendaItem, EventCancellationPolicy, EventDoc } from '@/services/eventService';

export type ComposerStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type RefundPolicy = 'flex_24h' | 'firm' | 'custom';

export interface ComposerPricing {
  amount: number;
  currency: 'INR';
  refundPolicy: RefundPolicy;
  refundCustomNote?: string;
}

export type RequiredAttendeeField = 'phone' | 'email' | 'guestNames';

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
  registrationDeadline: string | null;
  agenda: AgendaItem[];

  // Schema migration 2026-06-25 — Step 4 surfaces these
  allowWaitlist: boolean;
  waitlistAutoPromote: boolean;             // Q1 · per-event flag · only meaningful when allowWaitlist=true
  walkupsAllowed: boolean;                  // Q11 · at-the-door registrations
  maxGuestsPerRegistration: number;         // 1-10 · default 5
  requiredAttendeeFields: RequiredAttendeeField[];  // phone always on; email & guestNames toggleable

  // Schema migration — held as defaults, surfaced in later steps / settings
  visibility: 'public' | 'unlisted' | 'private';
  discussionVisibility: 'public' | 'attendees_only';   // Q8
  ageRestriction: number | null;
  language: string;                         // ISO 639-1 · default 'en'
  cancellationPolicy: EventCancellationPolicy | null;  // computed at submit from refundPolicy enum
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
  registrationDeadline: null,
  agenda: [],

  allowWaitlist: false,
  waitlistAutoPromote: false,
  walkupsAllowed: false,
  maxGuestsPerRegistration: 5,
  requiredAttendeeFields: ['phone'],

  visibility: 'public',
  discussionVisibility: 'public',
  ageRestriction: null,
  language: 'en',
  cancellationPolicy: null,
};

const ALL_STEPS: ComposerStep[] = [1, 2, 3, 4, 5, 6, 7];

interface State {
  step: ComposerStep;
  completedSteps: Set<ComposerStep>;
  form: ComposerForm;
  isSubmitting: boolean;
  // Edit-mode fields
  editMode: boolean;
  editEventId: string | null;
  setStep: (s: ComposerStep) => void;
  markComplete: (s: ComposerStep) => void;
  update: <K extends keyof ComposerForm>(k: K, v: ComposerForm[K]) => void;
  reset: () => void;
  setSubmitting: (v: boolean) => void;
  hydrateFromEvent: (event: EventDoc) => void;
}

export const useCreateEventStore = create<State>((set) => ({
  step: 1,
  completedSteps: new Set(),
  form: initialForm,
  isSubmitting: false,
  editMode: false,
  editEventId: null,
  setStep: (step) => set({ step }),
  markComplete: (s) => set((state) => ({ completedSteps: new Set([...state.completedSteps, s]) })),
  update: (key, value) => set((state) => ({ form: { ...state.form, [key]: value } })),
  reset: () => set({
    step: 1,
    completedSteps: new Set(),
    form: initialForm,
    isSubmitting: false,
    editMode: false,
    editEventId: null,
  }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  hydrateFromEvent: (event: EventDoc) => {
    const form: ComposerForm = {
      title: event.title ?? initialForm.title,
      tagline: event.tagline ?? initialForm.tagline,
      topicTags: event.topicTags ?? initialForm.topicTags,
      registrationMode: event.registrationMode ?? initialForm.registrationMode,
      about: event.about ?? initialForm.about,
      whatToExpect: event.whatToExpect ?? initialForm.whatToExpect,
      skills: event.skills ?? initialForm.skills,
      startsAt: event.startsAt ?? initialForm.startsAt,
      endsAt: event.endsAt ?? initialForm.endsAt,
      durationKind: event.durationKind ?? initialForm.durationKind,
      location: event.location ?? initialForm.location,
      capacity: { total: event.capacity?.total ?? initialForm.capacity.total },
      pricing: event.registrationMode === 'paid_ticket' && (event as any).pricing
        ? {
            amount: (event as any).pricing.amount ?? 0,
            currency: 'INR' as const,
            refundPolicy: (event as any).pricing.refundPolicy ?? 'flex_24h',
            refundCustomNote: (event as any).pricing.refundCustomNote,
          }
        : initialForm.pricing,
      media: event.media ?? initialForm.media,
      registrationDeadline: event.registrationDeadline ?? initialForm.registrationDeadline,
      agenda: event.agenda ?? initialForm.agenda,
      allowWaitlist: event.allowWaitlist ?? initialForm.allowWaitlist,
      waitlistAutoPromote: event.waitlistAutoPromote ?? initialForm.waitlistAutoPromote,
      walkupsAllowed: event.walkupsAllowed ?? initialForm.walkupsAllowed,
      maxGuestsPerRegistration: event.maxGuestsPerRegistration ?? initialForm.maxGuestsPerRegistration,
      requiredAttendeeFields: event.requiredAttendeeFields ?? initialForm.requiredAttendeeFields,
      visibility: event.visibility ?? initialForm.visibility,
      discussionVisibility: event.discussionVisibility ?? initialForm.discussionVisibility,
      ageRestriction: event.ageRestriction ?? initialForm.ageRestriction,
      language: event.language ?? initialForm.language,
      cancellationPolicy: event.cancellationPolicy ?? initialForm.cancellationPolicy,
    };
    set({
      form,
      editMode: true,
      editEventId: event._id,
      step: 1,
      completedSteps: new Set(ALL_STEPS),
      isSubmitting: false,
    });
  },
}));
