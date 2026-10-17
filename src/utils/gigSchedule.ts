// src/utils/gigSchedule.ts
//
// Shared gig-date formatting for the owner hub (HubHero / HubEssentials).
// Mirrors the artist-side `whenFact` logic in
// src/components/gigs/detail/gigDetailVM.ts so both surfaces read the same —
// GigForm v2.2 shape: `schedule.dateMode` ('range' | 'dates') + `schedule.dates[]`,
// with startDate/endDate always carrying the envelope (min…max).
//
// Before this, the hub rendered only `schedule.startDate`, which for a
// specific-dates gig (dateMode='dates') looked like a single day and hid the
// real dates, and for a multi-day range hid the end date.

import dayjs from 'dayjs';

export type GigScheduleInput = {
    startDate?: string | Date;
    endDate?: string | Date;
    dateMode?: 'range' | 'dates';
    dates?: (string | Date)[];
} | undefined | null;

function validSortedDates(dates?: (string | Date)[]) {
    return (dates ?? [])
        .map((d) => dayjs(d))
        .filter((d) => d.isValid())
        .sort((a, b) => a.valueOf() - b.valueOf());
}

/**
 * Full "When" value for a labelled row (HubEssentials). Returns value + an
 * optional sub-line, matching gigDetailVM's whenFact:
 *   range, same day  → { value: 'Sat', sub: '22 Nov' }
 *   range, multi-day → { value: 'Sat–Mon', sub: '22 Nov–29 Nov' }
 *   dates            → { value: '3 dates', sub: '22 Nov, 27 Nov +1' }
 */
export function formatGigWhen(schedule: GigScheduleInput): { value: string; sub?: string } {
    if (!schedule) return { value: 'TBD' };

    if (schedule.dateMode === 'dates' && Array.isArray(schedule.dates) && schedule.dates.length) {
        const ds = validSortedDates(schedule.dates);
        const n = ds.length;
        if (!n) return { value: 'TBD' };
        const head = ds.slice(0, 2).map((x) => x.format('D MMM')).join(', ');
        return { value: `${n} ${n === 1 ? 'date' : 'dates'}`, sub: n > 2 ? `${head} +${n - 2}` : head };
    }

    const start = schedule.startDate ? dayjs(schedule.startDate) : null;
    const end = schedule.endDate ? dayjs(schedule.endDate) : null;
    if (!start || !start.isValid()) return { value: 'TBD' };

    const sameDay = !end || !end.isValid() || start.isSame(end, 'day');
    if (sameDay) return { value: start.format('ddd'), sub: start.format('D MMM') };
    return { value: `${start.format('ddd')}–${end!.format('ddd')}`, sub: `${start.format('D MMM')}–${end!.format('D MMM')}` };
}

/**
 * Compact single-line "when" for the hero submeta (no weekday, no sub).
 *   range, same day         → '22 Nov'
 *   range, same month       → '22–29 Nov'
 *   range, crosses a month  → '29 Nov – 2 Dec'
 *   dates                   → '22 Nov +2'  (first date + remaining count)
 * Returns '' when there's nothing usable, so callers can fall back.
 */
export function formatGigWhenCompact(schedule: GigScheduleInput): string {
    if (!schedule) return '';

    if (schedule.dateMode === 'dates' && Array.isArray(schedule.dates) && schedule.dates.length) {
        const ds = validSortedDates(schedule.dates);
        const n = ds.length;
        if (!n) return '';
        const first = ds[0].format('D MMM');
        return n === 1 ? first : `${first} +${n - 1}`;
    }

    const start = schedule.startDate ? dayjs(schedule.startDate) : null;
    const end = schedule.endDate ? dayjs(schedule.endDate) : null;
    if (!start || !start.isValid()) return '';

    const sameDay = !end || !end.isValid() || start.isSame(end, 'day');
    if (sameDay) return start.format('D MMM');
    if (start.isSame(end, 'month')) return `${start.format('D')}–${end!.format('D MMM')}`;
    return `${start.format('D MMM')} – ${end!.format('D MMM')}`;
}
