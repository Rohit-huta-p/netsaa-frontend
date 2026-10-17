import { formatGigWhen, formatGigWhenCompact } from '../gigSchedule';

describe('formatGigWhen', () => {
    it('range, multi-day → weekday span + date span sub', () => {
        const r = formatGigWhen({ startDate: '2026-05-12', endDate: '2026-05-13', dateMode: 'range' });
        expect(r.value).toContain('–');
        expect(r.sub).toBe('12 May–13 May');
    });

    it('range, same day → single date sub', () => {
        const r = formatGigWhen({ startDate: '2026-05-12', endDate: '2026-05-12', dateMode: 'range' });
        expect(r.sub).toBe('12 May');
    });

    it('dates → count value + first-two sub with overflow', () => {
        const r = formatGigWhen({ dateMode: 'dates', dates: ['2026-04-11', '2026-04-05', '2026-04-10'] });
        expect(r.value).toBe('3 dates');
        expect(r.sub).toBe('5 Apr, 10 Apr +1'); // sorted ascending, first two + remainder
    });

    it('dates, single → "1 date"', () => {
        const r = formatGigWhen({ dateMode: 'dates', dates: ['2026-04-05'] });
        expect(r.value).toBe('1 date');
        expect(r.sub).toBe('5 Apr');
    });

    it('missing / invalid → TBD', () => {
        expect(formatGigWhen(undefined).value).toBe('TBD');
        expect(formatGigWhen({}).value).toBe('TBD');
    });
});

describe('formatGigWhenCompact', () => {
    it('range same month → collapsed span', () => {
        expect(formatGigWhenCompact({ startDate: '2026-05-12', endDate: '2026-05-13', dateMode: 'range' })).toBe('12–13 May');
    });

    it('range crossing a month → full both ends', () => {
        expect(formatGigWhenCompact({ startDate: '2026-11-29', endDate: '2026-12-02', dateMode: 'range' })).toBe('29 Nov – 2 Dec');
    });

    it('range same day → single date', () => {
        expect(formatGigWhenCompact({ startDate: '2026-05-12', endDate: '2026-05-12', dateMode: 'range' })).toBe('12 May');
    });

    it('dates → first date + remaining count', () => {
        expect(formatGigWhenCompact({ dateMode: 'dates', dates: ['2026-04-11', '2026-04-05', '2026-04-10'] })).toBe('5 Apr +2');
    });

    it('empty → empty string (caller falls back)', () => {
        expect(formatGigWhenCompact(undefined)).toBe('');
        expect(formatGigWhenCompact({ dateMode: 'dates', dates: [] })).toBe('');
    });
});
