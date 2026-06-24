import { POSTED_GIGS_FILTERS, getPostedGigStatusLabel } from '../postedGigsStatus';

describe('postedGigsStatus', () => {
  it('has 3 chips in the order [Draft, Live, Closed]', () => {
    expect(POSTED_GIGS_FILTERS.map((f) => f.label)).toEqual(['Draft', 'Live', 'Closed']);
  });

  it('maps backend status to UI label', () => {
    expect(getPostedGigStatusLabel('draft')).toBe('Draft');
    expect(getPostedGigStatusLabel('published')).toBe('Live');
    expect(getPostedGigStatusLabel('closed')).toBe('Closed');
    expect(getPostedGigStatusLabel('expired')).toBe('Closed');
  });

  it('returns a sensible fallback for unknown status', () => {
    expect(getPostedGigStatusLabel('nonsense')).toBe('Unknown');
  });
});
