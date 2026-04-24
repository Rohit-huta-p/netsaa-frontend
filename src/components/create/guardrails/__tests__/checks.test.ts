// netsa-mobile/src/components/create/guardrails/__tests__/checks.test.ts
import {
  runHardChecks,
  runSoftChecks,
  runTrustSignals,
} from '../checks';

describe('runHardChecks', () => {
  it('flags MODEL_NUDITY_REQUIRED when performer includes Model without nudityLevel', () => {
    const issues = runHardChecks({
      artistTypes: ['Model'],
      modelDetails: { shootType: 'Fashion' },
    });
    expect(issues.some((i) => i.id === 'MODEL_NUDITY_REQUIRED')).toBe(true);
  });

  it('does NOT flag MODEL_NUDITY_REQUIRED for non-Model gigs', () => {
    const issues = runHardChecks({ artistTypes: ['Dancer'] });
    expect(issues.some((i) => i.id === 'MODEL_NUDITY_REQUIRED')).toBe(false);
  });

  it('flags UNPAID_NUDITY when nudityLevel ≠ None and compensation.structure === tbd', () => {
    const issues = runHardChecks({
      artistTypes: ['Model'],
      modelDetails: { nudityLevel: 'Partial', shootType: 'Fashion' },
      compensation: { structure: 'tbd' },
    });
    expect(issues.some((i) => i.id === 'UNPAID_NUDITY')).toBe(true);
  });

  it('flags UNDERAGE_ADULT when ageRange.min < 18 and nudityLevel ≠ None', () => {
    const issues = runHardChecks({
      artistTypes: ['Model'],
      ageRange: { min: 16, max: 22 },
      modelDetails: { nudityLevel: 'Partial', shootType: 'Fashion' },
    });
    expect(issues.some((i) => i.id === 'UNDERAGE_ADULT')).toBe(true);
  });

  it('flags PAST_DATE when startDate < today', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const issues = runHardChecks({
      schedule: { startDate: yesterday },
    });
    expect(issues.some((i) => i.id === 'PAST_DATE')).toBe(true);
  });

  it('empty state returns the 4 MISSING_* required-field HARD issues', () => {
    // After Post-code-review P1-3: empty state surfaces required-field nags
    // (title, performer type, event function, description) as HARD blocks.
    const issues = runHardChecks({});
    const ids = issues.map((i) => i.id).sort();
    expect(ids).toEqual(['MISSING_DESCRIPTION', 'MISSING_EVENT_FUNCTION', 'MISSING_PERFORMER_TYPE', 'MISSING_TITLE']);
  });

  it('fully-populated required fields clear the MISSING_* checks', () => {
    const issues = runHardChecks({
      title: 'Test gig',
      artistTypes: ['Dancer'],
      eventFunction: 'Sangeet',
      description: 'A test gig.',
    });
    expect(issues.some((i) => i.id.startsWith('MISSING_'))).toBe(false);
  });
});

describe('runSoftChecks', () => {
  it('flags TBD_PAY when compensation.structure === tbd', () => {
    const issues = runSoftChecks({ compensation: { structure: 'tbd' } });
    expect(issues.some((i) => i.id === 'TBD_PAY')).toBe(true);
  });

  it('flags NARROW_AGE when ageRange window < 5 years', () => {
    const issues = runSoftChecks({ ageRange: { min: 25, max: 28 } });
    expect(issues.some((i) => i.id === 'NARROW_AGE')).toBe(true);
  });

  it('flags MULTI_TYPE_OVERLOAD at exactly 3 performer types', () => {
    const issues = runSoftChecks({
      artistTypes: ['Dancer', 'Singer', 'DJ'],
    });
    expect(issues.some((i) => i.id === 'MULTI_TYPE_OVERLOAD')).toBe(true);
  });

  it('flags PRIVATE_VENUE when address contains residence keyword', () => {
    const issues = runSoftChecks({
      location: { address: '42 Park Street, private apartment 3B' },
    });
    expect(issues.some((i) => i.id === 'PRIVATE_VENUE')).toBe(true);
  });

  it('flags SHORT_APPLICATION_WINDOW when deadline < 48h and not urgent', () => {
    const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const issues = runSoftChecks({
      applicationDeadline: in24h,
      isUrgent: false,
    });
    expect(issues.some((i) => i.id === 'SHORT_APPLICATION_WINDOW')).toBe(true);
  });

  it('does NOT flag SHORT_APPLICATION_WINDOW when isUrgent=true', () => {
    const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const issues = runSoftChecks({
      applicationDeadline: in24h,
      isUrgent: true,
    });
    expect(issues.some((i) => i.id === 'SHORT_APPLICATION_WINDOW')).toBe(false);
  });
});

describe('runTrustSignals', () => {
  it('flags LOW_PAY_TRANSPARENCY when compensation.structure === tbd', () => {
    const signals = runTrustSignals({ compensation: { structure: 'tbd' } });
    expect(signals.some((s) => s.id === 'LOW_PAY_TRANSPARENCY')).toBe(true);
  });

  it('flags FEATURED_UNVERIFIED when isFeatured=true (soft flag until Trust Engine ships)', () => {
    const signals = runTrustSignals({ isFeatured: true });
    expect(signals.some((s) => s.id === 'FEATURED_UNVERIFIED')).toBe(true);
  });
});
