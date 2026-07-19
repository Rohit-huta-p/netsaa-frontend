import { selectCompletion } from '../useProfileCompletion';

const COMPLETE_USER = {
  displayName: 'Kiran Shah',
  location: 'Pune',
  artistType: 'Dancer',
  skills: ['Kathak'],
  bio: 'x'.repeat(100),
  galleryUrls: ['a', 'b'],
  videoUrls: ['https://v/1.mp4'], // origin/main portfolio + apply gate read videoUrls, not videoReels
  experience: [{ role: 'Lead', date: '2024' }],
  profileImageUrl: 'https://img/x.jpg',
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
