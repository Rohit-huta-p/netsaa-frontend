// Core mapping logic for the A·Minimal gig detail — locks the audit fixes:
// slots from headcount, schedule range + specific dates, real verified, and
// pay framed as a plain fact (no take-home / fee math).

import { buildGigDetailVM } from '../gigDetailVM';

const base = {
  _id: 'g1',
  title: 'Contemporary fusion duo',
  organizerSnapshot: { displayName: 'Aditi Rao', organizationName: 'Rhythm House Events', rating: 4.9, gigsHosted: 41, avgReplyMinutes: 120, isVerified: true },
  location: { city: 'Pune', state: 'MH', venueName: 'The Westin' },
  artistTypes: ['Dancer'],
  headcount: 2,
  schedule: { startDate: '2026-05-12', endDate: '2026-05-13', dateMode: 'range' },
  compensation: { amount: 18000, currency: 'INR', negotiable: true, model: 'fixed', perks: ['Travel', 'Meals'] },
  stats: { applications: 14 },
  applicationDeadline: null,
  viewerContext: { saved: true },
};

describe('buildGigDetailVM', () => {
  it('maps a fixed-pay range-date duo gig', () => {
    const vm = buildGigDetailVM(base);
    expect(vm.title).toBe('Contemporary fusion duo');
    expect(vm.producerLine).toBe('Rhythm House Events · Pune, MH');
    expect(vm.saved).toBe(true);
    expect(vm.appliedCount).toBe(14);

    // pay = a fact, no take-home
    expect(vm.pay).toEqual({ amount: '₹18,000', unit: 'per performer', negotiable: true, tbd: false });
    expect(vm.facts[0]).toEqual({ k: 'Pay', v: '₹18,000', sub: 'per performer' });

    // slots from headcount
    expect(vm.facts[3]).toEqual({ k: 'Slots', v: '2', sub: 'a duo' });

    // date range (not start-only)
    expect(vm.facts[1].k).toBe('When');
    expect(vm.facts[1].sub).toBe('12 May–13 May');

    // real producer stats
    expect(vm.producer).toMatchObject({ ratingLabel: '4.9', gigsHosted: 41, replyLabel: '~2h', isVerified: true });

    // nothing in the VM exposes fee / take-home math
    expect(JSON.stringify(vm)).not.toMatch(/88%|take-?home|15,840/i);
  });

  it('formats a pay range', () => {
    const vm = buildGigDetailVM({ ...base, compensation: { minAmount: 15000, maxAmount: 20000, currency: 'INR', model: 'fixed' } });
    expect(vm.pay.amount).toBe('₹15,000–20,000');
    expect(vm.pay.tbd).toBe(false);
  });

  it('falls back to "To be discussed" with no amount', () => {
    const vm = buildGigDetailVM({ ...base, compensation: { currency: 'INR', model: 'fixed' } });
    expect(vm.pay.tbd).toBe(true);
    expect(vm.facts[0]).toEqual({ k: 'Pay', v: 'TBD' });
  });

  it('renders specific dates (dateMode = dates)', () => {
    const vm = buildGigDetailVM({ ...base, schedule: { dateMode: 'dates', dates: ['2026-04-11', '2026-04-05', '2026-04-10'] } });
    expect(vm.facts[1].v).toBe('3 dates');
    expect(vm.facts[1].sub).toContain('+1'); // first two shown, +1 more
    expect(vm.facts[1].sub).toContain('05 Apr'.replace('05', '5')); // "5 Apr"
  });

  it('slots fall back to maxApplications, then Open', () => {
    expect(buildGigDetailVM({ ...base, headcount: undefined, maxApplications: 5 }).facts[3]).toEqual({ k: 'Slots', v: '5', sub: '5 performers' });
    expect(buildGigDetailVM({ ...base, headcount: undefined, maxApplications: undefined }).facts[3]).toEqual({ k: 'Slots', v: 'Open' });
  });

  it('gates verified + rating on real data', () => {
    const vm = buildGigDetailVM({ ...base, organizerSnapshot: { displayName: 'X', rating: 0, isVerified: false } });
    expect(vm.producer.isVerified).toBe(false);
    expect(vm.producer.ratingLabel).toBeNull();
    expect(vm.producer.gigsHosted).toBeNull();
  });

  it('computes a deadline label', () => {
    const soon = new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString();
    expect(buildGigDetailVM({ ...base, applicationDeadline: soon }).deadlineLabel).toBe('Closes in 6 days');
    const past = new Date(Date.now() - 3600 * 1000).toISOString();
    expect(buildGigDetailVM({ ...base, applicationDeadline: past }).deadlineLabel).toBe('Closed');
  });
});
