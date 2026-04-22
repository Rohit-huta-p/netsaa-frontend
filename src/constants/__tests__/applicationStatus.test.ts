import {
  getApplicationStatusLabel,
  APPLICATION_STATUS_FILTERS,
} from '../applicationStatus';

describe('getApplicationStatusLabel', () => {
  it('maps applied → Pending', () => {
    expect(getApplicationStatusLabel('applied')).toBe('Pending');
  });

  it('maps hired → Accepted', () => {
    expect(getApplicationStatusLabel('hired')).toBe('Accepted');
  });

  it('maps shortlisted → Shortlisted', () => {
    expect(getApplicationStatusLabel('shortlisted')).toBe('Shortlisted');
  });

  it('maps rejected → Rejected', () => {
    expect(getApplicationStatusLabel('rejected')).toBe('Rejected');
  });

  it('maps withdrawn → Withdrawn', () => {
    expect(getApplicationStatusLabel('withdrawn')).toBe('Withdrawn');
  });

  it('returns "Unknown" for unrecognized status', () => {
    expect(getApplicationStatusLabel('bogus' as unknown as 'applied')).toBe(
      'Unknown'
    );
    expect(getApplicationStatusLabel('' as unknown as 'applied')).toBe(
      'Unknown'
    );
  });
});

describe('APPLICATION_STATUS_FILTERS', () => {
  it('contains exactly 5 entries in spec §4.1 order', () => {
    expect(APPLICATION_STATUS_FILTERS).toHaveLength(5);
    const labels = APPLICATION_STATUS_FILTERS.map((f) => f.label);
    expect(labels).toEqual([
      'Pending',
      'Shortlisted',
      'Rejected',
      'Accepted',
      'Withdrawn',
    ]);
  });

  it('maps each filter to the correct backendStatus', () => {
    const byLabel = Object.fromEntries(
      APPLICATION_STATUS_FILTERS.map((f) => [f.label, f.backendStatus])
    );
    expect(byLabel['Pending']).toBe('applied');
    expect(byLabel['Shortlisted']).toBe('shortlisted');
    expect(byLabel['Rejected']).toBe('rejected');
    expect(byLabel['Accepted']).toBe('hired');
    expect(byLabel['Withdrawn']).toBe('withdrawn');
  });
});
