import {
  APPLICANTS_INBOX_FILTERS,
  getApplicantStatusLabel,
} from '../applicantsInboxStatus';

describe('applicantsInboxStatus', () => {
  it('has 3 chips in order [New, Shortlisted, Hired]', () => {
    expect(APPLICANTS_INBOX_FILTERS.map((f) => f.label)).toEqual(['New', 'Shortlisted', 'Hired']);
  });

  it('maps backend status to UI label', () => {
    expect(getApplicantStatusLabel('applied')).toBe('New');
    expect(getApplicantStatusLabel('shortlisted')).toBe('Shortlisted');
    expect(getApplicantStatusLabel('hired')).toBe('Hired');
  });

  it('falls back on unknown status', () => {
    expect(getApplicantStatusLabel('gibberish')).toBe('Unknown');
  });
});
