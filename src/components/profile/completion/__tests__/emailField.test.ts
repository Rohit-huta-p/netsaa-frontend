// netsa-frontend/src/components/profile/completion/__tests__/emailField.test.ts
//
// Task 9 — email verification as a profile-completion *strengthener*:
// missing until `user.emailVerifiedAt` is set, weighted into the overall
// score, and enriches to the edit-modal's 'verify' section (never the
// Interview, and never the apply gate — see meetsMinimumApplyGate below).

import { computeMissing, computeOverallScore, meetsMinimumApplyGate } from '@/components/profile/ProfileStrengthWidget';
import { enrichMissing } from '../interviewFieldMeta';

// Complete on every OTHER completion field (the exact shape
// computeMissing's SECTIONS checks require — see ProfileStrengthWidget.tsx)
// so email verification is isolated as the only variable below.
const COMPLETE_USER = {
  displayName: 'Kiran Shah',
  location: 'Pune',
  artistType: 'Dancer',
  skills: ['Kathak'],
  bio: 'x'.repeat(100),
  galleryUrls: ['https://img.example/1.jpg', 'https://img.example/2.jpg'],
  videoReels: [{ status: 'ready', muxPlaybackId: 'mux_1' }],
  experience: [{ role: 'Lead', date: '2024' }],
};

describe('email verification — completion strengthener (Task 9)', () => {
  it('is missing until emailVerifiedAt is set, and enriches to the verify section', () => {
    const without = computeMissing({ ...COMPLETE_USER, emailVerifiedAt: null } as any);
    expect(without.some((l) => /verified email/i.test(l))).toBe(true);

    const field = enrichMissing(['verified email'])[0];
    expect(field.inputType).toBe('verify');
    expect(field.section).toBe('verify');

    const done = computeMissing({ ...COMPLETE_USER, emailVerifiedAt: '2026-07-21' } as any);
    expect(done.some((l) => /verified email/i.test(l))).toBe(false);
  });

  it('carries a small weight in the overall score (unverified email costs a few points, not zero)', () => {
    const unverified = computeOverallScore({ ...COMPLETE_USER, emailVerifiedAt: null } as any);
    const verified = computeOverallScore({ ...COMPLETE_USER, emailVerifiedAt: '2026-07-21' } as any);
    expect(verified).toBe(100);
    expect(unverified).toBeLessThan(verified);
  });

  it('never gates apply — meetsMinimumApplyGate passes regardless of email verification', () => {
    expect(meetsMinimumApplyGate({ ...COMPLETE_USER, emailVerifiedAt: null } as any).passes).toBe(true);
    expect(meetsMinimumApplyGate({ ...COMPLETE_USER, emailVerifiedAt: '2026-07-21' } as any).passes).toBe(true);
  });
});
