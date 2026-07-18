import {
  safeArr,
  computeApplications,
  countDeliveredContracts,
  aggregateEarnings,
} from '../artistNumbers.helpers';

describe('safeArr', () => {
  it('handles bare array, {data}, {items}, and junk', () => {
    expect(safeArr([1, 2])).toEqual([1, 2]);
    expect(safeArr({ data: [3] })).toEqual([3]);
    expect(safeArr({ items: [4] })).toEqual([4]);
    expect(safeArr(null)).toEqual([]);
    expect(safeArr({ nope: 1 })).toEqual([]);
  });
});

describe('computeApplications', () => {
  it('unwraps the wrapped {meta,data:[...]} shape (the real backend shape)', () => {
    const wrapped = { meta: {}, data: [{ status: 'applied' }, { status: 'rejected' }], errors: [] };
    expect(computeApplications(wrapped)).toEqual({ applicationsTotal: 2, applicationsActive: 1 });
  });
  it('counts active = applied|shortlisted|hired only', () => {
    const apps = [
      { status: 'applied' }, { status: 'shortlisted' }, { status: 'hired' },
      { status: 'rejected' }, { status: 'reviewed' /* not a real status */ },
    ];
    const r = computeApplications(apps);
    expect(r.applicationsTotal).toBe(5);
    expect(r.applicationsActive).toBe(3);
  });
});

describe('countDeliveredContracts', () => {
  const me = '507f1f77bcf86cd799439011';
  it('counts only completed contracts where I am the artist', () => {
    const data = { meta: {}, data: { contracts: [
      { artistId: me, status: 'completed' },
      { artistId: me, status: 'active' },
      { artistId: 'someoneelse', status: 'completed' },
      { hirerId: me, artistId: 'x', status: 'completed' }, // I'm the hirer here — must NOT count
    ], total: 4 } };
    expect(countDeliveredContracts(data, me)).toBe(1);
  });
  it('also handles the flat {contracts:[...]} shape', () => {
    const flat = { contracts: [{ artistId: me, status: 'completed' }] };
    expect(countDeliveredContracts(flat, me)).toBe(1);
  });
});

describe('aggregateEarnings', () => {
  const me = '507f1f77bcf86cd799439011';
  const now = new Date(2026, 6, 17, 12, 0, 0); // 2026-07-17 local
  const iso = (y: number, m: number, d: number) => new Date(y, m, d, 12, 0, 0).toISOString();
  const tx = { meta: {}, data: { transactions: [
    { toUserId: me, status: 'completed', artistReceived: 1000, createdAt: iso(2026, 6, 15) }, // this month, in-week
    { toUserId: me, status: 'paid',      artistReceived: 500,  createdAt: iso(2026, 6, 2) },  // this month, older than 7d
    { toUserId: me, status: 'created',   artistReceived: 999,  createdAt: iso(2026, 6, 16) }, // pending, not earned
    { toUserId: me, status: 'refunded',  artistReceived: 200,  createdAt: iso(2026, 6, 10) }, // excluded
    { toUserId: 'other', status: 'completed', artistReceived: 777, createdAt: iso(2026, 6, 15) }, // not mine
    { toUserId: me, status: 'confirmed', artistReceived: 300,  createdAt: iso(2026, 5, 20) }, // last month, not this month
  ], total: 6 } };

  it('sums this-month received to earnedThisMonth', () => {
    const r = aggregateEarnings(tx, me, now);
    expect(r.earnedThisMonth).toBe(1500); // 1000 + 500 (not the 300 from June, not pending/refunded/other)
  });
  it('counts pending (created|recorded) that are mine', () => {
    expect(aggregateEarnings(tx, me, now).pendingPayouts).toBe(1);
    const withRecorded = { data: { transactions: [
      ...tx.data.transactions,
      { toUserId: me, status: 'recorded', artistReceived: 150, createdAt: iso(2026, 6, 16) },
    ] } };
    expect(aggregateEarnings(withRecorded, me, now).pendingPayouts).toBe(2);
  });
  it('also handles the flat {transactions:[...]} shape', () => {
    const flat = { transactions: [
      { toUserId: me, status: 'paid', artistReceived: 250, createdAt: iso(2026, 6, 15) }, // this month, in-week
    ] };
    expect(aggregateEarnings(flat, me, now).earnedThisMonth).toBe(250);
  });
  it('produces a 7-number sparkline, oldest→newest, with the in-week receipt bucketed', () => {
    const r = aggregateEarnings(tx, me, now);
    expect(r.sparkline).toHaveLength(7);
    // 2026-07-15 is 2 days before 07-17 → index 4 of 7 (indices 0..6 map to days -6..0)
    expect(r.sparkline[4]).toBe(1000);
    expect(r.sparkline.reduce((a, b) => a + b, 0)).toBe(1000); // only the 07-15 receipt falls in the last 7 days
  });
});
