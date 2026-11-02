import {
  relativeTime,
  seatLabel,
  initialsOf,
  tintFor,
  spotNameFor,
  requestMetaLine,
  formatAnswer,
  visibleAnswers,
  pendingSummary,
} from '../requestFormat';
import type { EventRosterRow } from '@/services/eventService';

const agoIso = (ms: number) => new Date(Date.now() - ms).toISOString();
const MIN = 60_000, HR = 3_600_000, DAY = 86_400_000;

describe('relativeTime', () => {
  it('returns empty for missing/invalid', () => {
    expect(relativeTime(undefined)).toBe('');
    expect(relativeTime('not-a-date')).toBe('');
  });
  it('formats recent → weeks', () => {
    expect(relativeTime(agoIso(10_000))).toBe('just now');
    expect(relativeTime(agoIso(5 * MIN))).toBe('5m ago');
    expect(relativeTime(agoIso(3 * HR))).toBe('3h ago');
    expect(relativeTime(agoIso(2 * DAY))).toBe('2d ago');
    expect(relativeTime(agoIso(21 * DAY))).toBe('3w ago');
  });
});

describe('seatLabel', () => {
  it('singular / plural / defaults', () => {
    expect(seatLabel(1)).toBe('1 seat');
    expect(seatLabel(3)).toBe('3 seats');
    expect(seatLabel(undefined)).toBe('1 seat');
    expect(seatLabel(0)).toBe('1 seat');
  });
});

describe('initialsOf', () => {
  it('handles full, single, and empty names', () => {
    expect(initialsOf('Saswati Sen')).toBe('SS');
    expect(initialsOf('Aarav')).toBe('AA');
    expect(initialsOf('  priya   kumar ')).toBe('PK');
    expect(initialsOf('')).toBe('?');
    expect(initialsOf(undefined)).toBe('?');
  });
});

describe('tintFor', () => {
  it('is deterministic and returns a hex from the palette', () => {
    expect(tintFor('Saswati')).toBe(tintFor('Saswati'));
    expect(tintFor('Saswati')).toMatch(/^#[0-9A-F]{6}$/i);
  });
});

describe('spotNameFor', () => {
  const spots = [{ _id: 's1', name: 'VIP' }, { _id: 's2', name: 'General' }];
  it('resolves a matching spot name', () => {
    expect(spotNameFor('s1', spots)).toBe('VIP');
  });
  it('returns undefined when missing or unmatched', () => {
    expect(spotNameFor(undefined, spots)).toBeUndefined();
    expect(spotNameFor('s1', [])).toBeUndefined();
    expect(spotNameFor('nope', spots)).toBeUndefined();
  });
});

describe('requestMetaLine', () => {
  it('joins seats · spot · time, skipping absent parts', () => {
    const row = { _id: 'r', userId: 'u', name: 'A', seats: 2, status: 'pending', spotId: 's1', registeredAt: agoIso(5 * MIN) } as EventRosterRow;
    expect(requestMetaLine(row, [{ _id: 's1', name: 'VIP' }])).toBe('2 seats  ·  VIP  ·  5m ago');
  });
  it('drops spot and time when unavailable', () => {
    const row = { _id: 'r', userId: 'u', name: 'A', seats: 1, status: 'pending' } as EventRosterRow;
    expect(requestMetaLine(row)).toBe('1 seat');
  });
});

describe('formatAnswer / visibleAnswers', () => {
  it('formats label — value and skips blanks', () => {
    expect(formatAnswer({ label: 'Years dancing', type: 'text', value: '6' })).toBe('Years dancing — 6');
    expect(formatAnswer({ label: '', type: 'text', value: 'yes' })).toBe('yes');
    expect(formatAnswer({ label: 'Empty', type: 'text', value: '   ' })).toBeUndefined();
  });
  it('filters a row to only answered questions', () => {
    const row = { _id: 'r', userId: 'u', name: 'A', seats: 1, status: 'pending', answers: [
      { label: 'Level', type: 'choice', value: 'Intermediate' },
      { label: 'Note', type: 'text', value: '' },
    ] } as EventRosterRow;
    expect(visibleAnswers(row)).toEqual(['Level — Intermediate']);
  });
  it('is empty when no answers', () => {
    const row = { _id: 'r', userId: 'u', name: 'A', seats: 1, status: 'pending' } as EventRosterRow;
    expect(visibleAnswers(row)).toEqual([]);
  });
});

describe('pendingSummary', () => {
  it('reads naturally at 0 / 1 / N', () => {
    expect(pendingSummary(0)).toBe('No requests yet');
    expect(pendingSummary(1)).toBe('1 awaiting your call');
    expect(pendingSummary(7)).toBe('7 awaiting your call');
  });
});
