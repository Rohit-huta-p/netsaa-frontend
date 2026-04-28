// netsa-mobile/src/components/create/__tests__/buildBackendPayload.test.ts
//
// Covers the client→backend payload transform. If this diverges from
// Plan 4's Zod schema, createGig 400s with a cryptic error. These tests
// lock the contract.
//
// `buildBackendPayload` is a pure function, but it lives in GigFormV2.tsx
// which transitively imports `useGigs` → `gigService` → `authStore` →
// `expo-secure-store` (ESM). Mock the hooks layer at module boundary so
// the import chain stays Jest-friendly.

jest.mock('@/hooks/useGigs', () => ({
  useCreateGig: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useUpdateGig: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useGig: () => ({ data: null }),
}));
// authStore transitively pulls in expo-secure-store (ESM-only). Mock with
// Zustand-selector-compatible shape so any caller using
// `useAuthStore((s) => s.user)` gets a real value back.
jest.mock('@/stores/authStore', () => ({
  __esModule: true,
  default: (selector?: (s: any) => any) => {
    const store = { user: null, accessToken: null };
    return selector ? selector(store) : store;
  },
}));

// DatePickerInput + MultiSlider + GigDetails transitively loaded by the
// page imports — string-mock them to avoid PNG/native-binding parse errors
// even though this test never renders them.
jest.mock('@/components/ui/DatePickerInput', () => ({ DatePickerInput: 'DatePickerInput' }));
jest.mock('@ptomasroos/react-native-multi-slider', () => 'MultiSlider');
jest.mock('@/components/gigs/GigDetails', () => ({ GigDetails: 'GigDetails' }));
jest.mock('@/services/gigService', () => ({
  __esModule: true,
  default: { rephraseText: jest.fn() },
}));
// Phase 4D — Page5 now imports useContractPdf which loads expo-print/sharing
// (ESM-only). Mock at module boundary so this transform-only test can import
// GigFormV2 without dragging the native bindings.
jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn().mockResolvedValue({ uri: 'file:///tmp/preview.pdf' }),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

import { buildBackendPayload } from '../GigFormV2';

function makeBaseState() {
  return {
    p1: { title: 'Test gig', artistTypes: ['Dancer'], eventFunction: 'Sangeet' },
    p2: {
      startDate: '2027-01-01',
      city: 'Pune',
      compensationModel: 'fixed' as const,
      compensationStructure: 'fixed' as const,
      amount: '5000',
      negotiable: false,
      languagePreferences: [],
    },
    p3: { music: {}, model: {}, visual: {}, crew: {} },
    p4: {
      mediaRequirements: {
        headshots: false,
        fullBody: false,
        videoReel: false,
        audioSample: false,
        notes: '',
      },
      description: 'desc',
      perks: [] as string[],
      termsAndConditions: '',
    },
    isUrgent: false,
    isFeatured: false,
  };
}

describe('buildBackendPayload', () => {
  it('produces the minimum valid payload for a Dancer gig', () => {
    const payload = buildBackendPayload(makeBaseState() as any);
    expect(payload.title).toBe('Test gig');
    expect(payload.artistTypes).toEqual(['Dancer']);
    expect(payload.eventFunction).toBe('Sangeet');
    expect(payload.location.city).toBe('Pune');
    expect(payload.compensation.model).toBe('fixed');
    expect(payload.compensation.amount).toBe(5000);
    expect(payload.compensation.minAmount).toBeUndefined();
    expect(payload.compensation.maxAmount).toBeUndefined();
    expect(payload.type).toBe('one-time');
    expect(payload.isUrgent).toBe(false);
  });

  it('uses min/max for range compensation (not amount)', () => {
    const state = makeBaseState();
    state.p2 = {
      ...state.p2,
      compensationStructure: 'range' as const,
      amount: undefined as any,
      minAmount: '3000',
      maxAmount: '8000',
    } as any;
    const payload = buildBackendPayload(state as any);
    expect(payload.compensation.amount).toBeUndefined();
    expect(payload.compensation.minAmount).toBe(3000);
    expect(payload.compensation.maxAmount).toBe(8000);
  });

  it('omits optional fields when empty (no endDate, no maxApplicants)', () => {
    const payload = buildBackendPayload(makeBaseState() as any);
    // endDate falls back to startDate when not set
    expect(payload.schedule.endDate).toEqual(new Date('2027-01-01'));
    expect(payload.maxApplications).toBeUndefined();
    expect(payload.applicationDeadline).toBeUndefined();
  });

  it('transforms Music Producer state into musicDetails payload', () => {
    const state = makeBaseState();
    state.p1.artistTypes = ['Music Producer'];
    state.p3.music = { turnaroundDays: 14, bpm: 128, genres: ['Bollywood'] } as any;
    const payload = buildBackendPayload(state as any);
    expect((payload.musicDetails as any)?.turnaroundDays).toBe(14);
    expect((payload.musicDetails as any)?.bpm).toBe(128);
    expect((payload.musicDetails as any)?.genres).toEqual(['Bollywood']);
  });

  it('transforms Model state into modelDetails payload', () => {
    const state = makeBaseState();
    state.p1.artistTypes = ['Model'];
    state.p3.model = {
      shootType: 'Fashion',
      nudityLevel: 'None',
      releaseRequired: true,
    } as any;
    const payload = buildBackendPayload(state as any);
    expect((payload.modelDetails as any)?.shootType).toBe('Fashion');
    expect((payload.modelDetails as any)?.nudityLevel).toBe('None');
    expect((payload.modelDetails as any)?.releaseRequired).toBe(true);
  });
});
