import { selectCompletion } from '../useProfileCompletion';

const COMPLETE_USER = {
  displayName: 'Kiran Shah',
  location: 'Pune',
  artistType: 'Dancer',
  skills: ['Kathak'],
  bio: 'x'.repeat(100),
  galleryUrls: ['a', 'b'],
  // Scoring reads Mux `videoReels` (only `status: 'ready'` counts), not the
  // retired `videoUrls` — see ProfileStrengthWidget. Both are kept so the
  // fixture is genuinely "complete" against either reader.
  videoUrls: ['https://v/1.mp4'],
  videoReels: [{ status: 'ready', playbackId: 'p1' }],
  experience: [{ role: 'Lead', date: '2024' }],
  profileImageUrl: 'https://img/x.jpg',
  // Task 9 added a small-weight "verify" section (email verification) to
  // computeOverallScore/computeMissing — required for this fixture to be
  // "fully complete" (score 100, no missing fields) below.
  emailVerifiedAt: '2026-01-01',
};

describe('selectCompletion', () => {
  it('a fully complete user scores 100 with no missing fields', () => {
    const c = selectCompletion(COMPLETE_USER, 'trusted');
    expect(c.score).toBe(100);
    expect(c.missing).toEqual([]);
    expect(c.applyReady).toBe(true);
    expect(c.tier).toBe('trusted');
  });

  it('an empty user surfaces enriched missing fields and is not apply-ready', () => {
    const c = selectCompletion({}, 'new');
    expect(c.score).toBeLessThan(100);
    expect(c.missing.length).toBeGreaterThan(0);
    expect(c.missing[0]).toHaveProperty('question');
    expect(c.applyReady).toBe(false);
  });

  it('blanks are the subset of missing fields that map to a playbill slot', () => {
    const c = selectCompletion({}, 'new');
    expect(c.blanks.every((f) => f.playbillSlot !== 'none')).toBe(true);
    expect(c.nextBest).toBe(c.missing[0]);
  });
});
