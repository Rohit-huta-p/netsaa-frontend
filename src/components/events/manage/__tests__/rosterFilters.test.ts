import {
  groupOf, buildGroups, groupCounts, visibleGroups, matchesFilters,
  filterAndSortAttendees, GROUP_ORDER, EMPTY_FILTERS, setName,
} from '../rosterFilters';
import type { EventRosterRow } from '@/services/eventService';

const row = (over: Partial<EventRosterRow> = {}): EventRosterRow =>
  ({ _id: Math.random().toString(36).slice(2), name: 'A', seats: 1, status: 'registered', ...over } as unknown as EventRosterRow);

// A minimal event shape for visibleGroups.
const ev = (o: Partial<{ door: string; paid: boolean; total: number; allowWaitlist: boolean; requiresApproval: boolean }>) =>
  ({
    registrationMode: o.paid ? 'paid_ticket' : 'free_rsvp',
    registration: { door: o.door ?? 'open' },
    requiresApproval: o.requiresApproval,
    capacity: { total: o.total ?? 0, registeredCount: 0 },
    allowWaitlist: o.allowWaitlist,
  } as any);

describe('groupOf', () => {
  it('maps every known status to its group', () => {
    expect(groupOf('pending')).toBe('requests');
    expect(groupOf('approved')).toBe('awaitingpay');
    expect(groupOf('registered')).toBe('confirmed');
    expect(groupOf('attended')).toBe('checkedin');
    expect(groupOf('cancelled')).toBe('cancelled');
    expect(groupOf('declined')).toBe('cancelled');
    expect(groupOf('no-show')).toBe('cancelled');
  });
  it('keeps an unknown / missing status visible (→ confirmed), never dropped', () => {
    expect(groupOf('weird')).toBe('confirmed');
    expect(groupOf(undefined)).toBe('confirmed');
  });
});

describe('buildGroups', () => {
  it('splits the confirmed bucket into Confirmed (registered) vs Checked-in (attended)', () => {
    const g = buildGroups({
      confirmed: [row({ status: 'registered' }), row({ status: 'attended' }), row({ status: 'registered' })],
      requests: [row({ status: 'pending' })],
      approved: [row({ status: 'approved' })],
      cancelled: [row({ status: 'cancelled' })],
      declined: [row({ status: 'declined' })],
      waitlist: [row({ status: 'registered', position: 2 }), row({ status: 'registered', position: 1 })],
    });
    expect(groupCounts(g)).toEqual({ requests: 1, awaitingpay: 1, confirmed: 2, waitlist: 2, checkedin: 1, cancelled: 2 });
    expect(g.waitlist.map((r) => r.position)).toEqual([1, 2]); // sorted by queue position
  });

  it('routes a no-show into Cancelled wherever the backend files it', () => {
    const g = buildGroups({ confirmed: [row({ status: 'no-show' })] });
    expect(g.cancelled).toHaveLength(1);
    expect(g.checkedin).toHaveLength(0);
    expect(g.confirmed).toHaveLength(0);
  });

  it('tolerates an empty / missing roster', () => {
    expect(groupCounts(buildGroups(null))).toEqual({ requests: 0, awaitingpay: 0, confirmed: 0, waitlist: 0, checkedin: 0, cancelled: 0 });
    expect(groupCounts(buildGroups(undefined))).toEqual({ requests: 0, awaitingpay: 0, confirmed: 0, waitlist: 0, checkedin: 0, cancelled: 0 });
  });
});

describe('visibleGroups (derived from the event shape)', () => {
  it('open + free = 3', () => {
    expect(visibleGroups(ev({ door: 'open', paid: false }))).toEqual(['confirmed', 'checkedin', 'cancelled']);
  });
  it('pay-now open, uncapped = 3', () => {
    expect(visibleGroups(ev({ door: 'open', paid: true, total: 0 }))).toEqual(['confirmed', 'checkedin', 'cancelled']);
  });
  // The shape→group derivation below is exercised with waitlist ENABLED (3rd arg true);
  // the global kill-switch default (OFF) is covered by its own test at the end.
  it('pay-now open, capped + waitlist = +Waitlist (4)', () => {
    expect(visibleGroups(ev({ door: 'open', paid: true, total: 50, allowWaitlist: true }), undefined, true))
      .toEqual(['confirmed', 'waitlist', 'checkedin', 'cancelled']);
  });
  it('free approval (guest_list), uncapped = +Requests (4)', () => {
    expect(visibleGroups(ev({ door: 'guest_list', paid: false })))
      .toEqual(['requests', 'confirmed', 'checkedin', 'cancelled']);
  });
  it('free approval, capped + waitlist = 5', () => {
    expect(visibleGroups(ev({ door: 'guest_list', paid: false, total: 20, allowWaitlist: true }), undefined, true))
      .toEqual(['requests', 'confirmed', 'waitlist', 'checkedin', 'cancelled']);
  });
  it('paid audition (guest_list + paid + capped + waitlist) = all 6', () => {
    expect(visibleGroups(ev({ door: 'guest_list', paid: true, total: 20, allowWaitlist: true }), undefined, true)).toEqual(GROUP_ORDER);
  });
  it('apply door is also approval-gated', () => {
    expect(visibleGroups(ev({ door: 'apply', paid: true })))
      .toEqual(['requests', 'awaitingpay', 'confirmed', 'checkedin', 'cancelled']);
  });
  it('shows an eligible stage even at count 0 (fresh paid audition still returns all 6)', () => {
    expect(visibleGroups(ev({ door: 'guest_list', paid: true, total: 20, allowWaitlist: true }),
      { requests: 0, awaitingpay: 0, confirmed: 0, waitlist: 0, checkedin: 0, cancelled: 0 }, true)).toEqual(GROUP_ORDER);
  });
  it('never hides a non-empty group the shape calls impossible (stranded data after a door change)', () => {
    expect(visibleGroups(ev({ door: 'open', paid: false }), { requests: 2 })).toContain('requests');
  });
  it('a capped event with waitlist explicitly disabled hides Waitlist', () => {
    expect(visibleGroups(ev({ door: 'open', paid: false, total: 20, allowWaitlist: false }), undefined, true))
      .toEqual(['confirmed', 'checkedin', 'cancelled']);
  });
  it('the global waitlist kill-switch (default OFF) hides Waitlist even when the shape allows it', () => {
    // No 3rd arg → defaults to EVENT_WAITLIST_ENABLED (shipped OFF).
    expect(visibleGroups(ev({ door: 'open', paid: true, total: 50, allowWaitlist: true })))
      .toEqual(['confirmed', 'checkedin', 'cancelled']);
    // Off hides the stage even when stranded waitlist rows remain.
    expect(visibleGroups(ev({ door: 'open', paid: true, total: 50, allowWaitlist: true }), { waitlist: 3 } as any, false))
      .not.toContain('waitlist');
  });
  it('tolerates a missing event', () => {
    expect(visibleGroups(undefined)).toEqual(['confirmed', 'checkedin', 'cancelled']);
  });
});

describe('matchesFilters (name + phone)', () => {
  const r = row({ name: 'Isha Kulkarni', phone: '+919876500011' });
  it('an empty query passes', () => expect(matchesFilters(r, { name: '' })).toBe(true));
  it('matches the name case-insensitively', () => expect(matchesFilters(r, { name: 'isha' })).toBe(true));
  it('matches a phone substring', () => expect(matchesFilters(r, { name: '8765' })).toBe(true));
  it('rejects a non-match', () => expect(matchesFilters(r, { name: 'zzz' })).toBe(false));
});

describe('filterAndSortAttendees', () => {
  const a = row({ name: 'Bca', registeredAt: '2026-01-03T00:00:00Z' });
  const b = row({ name: 'Abc', registeredAt: '2026-01-01T00:00:00Z' });
  const c = row({ name: 'Cab', registeredAt: '2026-01-02T00:00:00Z' });

  it('default (registered) is newest-first for non-request groups', () => {
    const out = filterAndSortAttendees([b, c, a], EMPTY_FILTERS, 'registered', 'confirmed');
    expect(out.map((r) => r.registeredAt)).toEqual(['2026-01-03T00:00:00Z', '2026-01-02T00:00:00Z', '2026-01-01T00:00:00Z']);
  });
  it('Requests default is oldest-first (FIFO approval queue)', () => {
    const out = filterAndSortAttendees([a, b, c], EMPTY_FILTERS, 'registered', 'requests');
    expect(out.map((r) => r.registeredAt)).toEqual(['2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z', '2026-01-03T00:00:00Z']);
  });
  it('name sort is A–Z', () => {
    expect(filterAndSortAttendees([a, b, c], EMPTY_FILTERS, 'name', 'confirmed').map((r) => r.name)).toEqual(['Abc', 'Bca', 'Cab']);
  });
  it('the Waitlist group rides its queue position', () => {
    const w = [row({ position: 3 }), row({ position: 1 }), row({ position: 2 })];
    expect(filterAndSortAttendees(w, EMPTY_FILTERS, 'registered', 'waitlist').map((r) => r.position)).toEqual([1, 2, 3]);
  });
  it('filters before sorting and never mutates the input array', () => {
    const input = [a, b, c];
    expect(filterAndSortAttendees(input, { name: 'abc' }, 'name', 'confirmed').map((r) => r.name)).toEqual(['Abc']);
    expect(input).toEqual([a, b, c]);
  });
});

describe('setName', () => {
  it('returns a new filters object', () => {
    const f2 = setName(EMPTY_FILTERS, 'x');
    expect(f2).toEqual({ name: 'x' });
    expect(EMPTY_FILTERS).toEqual({ name: '' });
  });
});
