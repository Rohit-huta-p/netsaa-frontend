import {
  toCalendarInstant,
  isDeadlineOpen,
  isDeadlinePassed,
  deadlineDaysLeft,
} from '../deadline';

// The pinned instants below are chosen to fall on the same calendar day (and
// away from midnight) in UTC, IST (+5:30) and US Pacific (-8) alike, so the
// per-viewer-local day math is deterministic regardless of the CI runner's tz.

describe('toCalendarInstant', () => {
  it('anchors a YYYY-MM-DD day to NOON UTC', () => {
    expect(toCalendarInstant('2026-11-22')).toEqual(new Date('2026-11-22T12:00:00.000Z'));
  });

  it('passes an instant/Date through unchanged, undefined for empty', () => {
    expect(toCalendarInstant('2026-11-22T08:30:00.000Z')).toEqual(
      new Date('2026-11-22T08:30:00.000Z'),
    );
    expect(toCalendarInstant(undefined)).toBeUndefined();
    expect(toCalendarInstant(null)).toBeUndefined();
    expect(toCalendarInstant('')).toBeUndefined();
  });
});

describe('isDeadlineOpen / isDeadlinePassed', () => {
  afterEach(() => jest.useRealTimers());

  it('no deadline is always open', () => {
    expect(isDeadlineOpen(null)).toBe(true);
    expect(isDeadlineOpen(undefined)).toBe(true);
    expect(isDeadlinePassed(null)).toBe(false);
  });

  it('future deadline is open, comfortably past deadline is closed', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-19T13:00:00.000Z'));
    expect(isDeadlineOpen('2026-11-25T12:00:00.000Z')).toBe(true);
    expect(isDeadlinePassed('2026-11-10T12:00:00.000Z')).toBe(true);
  });

  it('stays open through the deadline day (the old midnight-UTC bug)', () => {
    // 00:30 UTC on the 22nd — the old `new Date(deadline) < now` closed here.
    jest.useFakeTimers().setSystemTime(new Date('2026-11-22T00:30:00.000Z'));
    expect(isDeadlinePassed('2026-11-22T12:00:00.000Z')).toBe(false);
  });

  it('closes once the deadline day is fully behind the viewer', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-24T12:00:00.000Z'));
    expect(isDeadlinePassed('2026-11-22T12:00:00.000Z')).toBe(true);
  });
});

describe('deadlineDaysLeft', () => {
  afterEach(() => jest.useRealTimers());

  it('counts whole calendar days (0 = today)', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-19T13:00:00.000Z'));
    expect(deadlineDaysLeft('2026-11-19T12:00:00.000Z')).toBe(0);
    expect(deadlineDaysLeft('2026-11-20T12:00:00.000Z')).toBe(1);
    expect(deadlineDaysLeft('2026-11-25T12:00:00.000Z')).toBe(6);
    expect(deadlineDaysLeft(null)).toBeNull();
  });
});
