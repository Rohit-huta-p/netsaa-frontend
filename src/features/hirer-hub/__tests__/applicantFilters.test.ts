// Unit tests for the pure applicant filter/sort core.
import {
    EMPTY_FILTERS,
    normalizeCityKey,
    cityDisplay,
    matchesFilters,
    filterAndSortApplicants,
    countActiveFilters,
    activeFilterChips,
    removeChip,
    toggleCity,
    deriveFilterOptions,
    type ApplicantFilters,
} from '../utils/applicantFilters';

// Minimal applicant factory mirroring the live GigApplication shape.
const mk = (over: {
    id?: string; name?: string; city?: string; styles?: string[];
    exp?: string; rating?: number; note?: string; links?: string[]; at?: string;
}) => ({
    _id: over.id ?? Math.random().toString(36).slice(2),
    coverNote: over.note ?? '',
    portfolioLinks: over.links ?? [],
    appliedAt: over.at ?? '2026-11-01T00:00:00.000Z',
    artistSnapshot: {
        displayName: over.name ?? 'Anon',
        primaryCity: over.city,
        specialities: over.styles ?? [],
        experienceLevel: over.exp,
        rating: over.rating ?? 0,
    },
});

const f = (over: Partial<ApplicantFilters>): ApplicantFilters => ({ ...EMPTY_FILTERS, ...over });

describe('normalizeCityKey / cityDisplay', () => {
    it('folds case so PUNE and Pune are one key', () => {
        expect(normalizeCityKey('PUNE')).toBe('pune');
        expect(normalizeCityKey('Pune')).toBe('pune');
        expect(normalizeCityKey('  pune ')).toBe('pune');
    });
    it('merges Bengaluru/Bangalore and Bombay/Mumbai aliases', () => {
        expect(normalizeCityKey('Bangalore')).toBe('bengaluru');
        expect(normalizeCityKey('Bengaluru')).toBe('bengaluru');
        expect(normalizeCityKey('Bombay')).toBe('mumbai');
    });
    it('blank → empty key', () => {
        expect(normalizeCityKey(undefined)).toBe('');
        expect(normalizeCityKey('   ')).toBe('');
    });
    it('display is canonical-cased', () => {
        expect(cityDisplay('PUNE')).toBe('Pune');
        expect(cityDisplay('bangalore')).toBe('Bengaluru');
        expect(cityDisplay('navi mumbai')).toBe('Navi Mumbai');
    });
});

describe('matchesFilters — predicates', () => {
    const pro = mk({ name: 'Rhea Kapoor', city: 'Pune', styles: ['Improv', 'Theatre'], exp: 'professional', note: 'hi' });

    it('empty filters pass everything', () => {
        expect(matchesFilters(pro, EMPTY_FILTERS)).toBe(true);
    });
    it('name contains (case-insensitive)', () => {
        expect(matchesFilters(pro, f({ name: 'rhea' }))).toBe(true);
        expect(matchesFilters(pro, f({ name: 'vikram' }))).toBe(false);
    });
    it('city matches on the canonical key (PUNE filter catches a Pune applicant)', () => {
        expect(matchesFilters(mk({ city: 'PUNE' }), f({ cities: ['pune'] }))).toBe(true);
        expect(matchesFilters(mk({ city: 'Mumbai' }), f({ cities: ['pune'] }))).toBe(false);
    });
    it('a city-less applicant drops under an active city filter', () => {
        expect(matchesFilters(mk({ city: undefined }), f({ cities: ['pune'] }))).toBe(false);
        // …but passes when no city filter is set
        expect(matchesFilters(mk({ city: undefined }), EMPTY_FILTERS)).toBe(true);
    });
    it('styles match as a case-insensitive substring (family + custom)', () => {
        expect(matchesFilters(mk({ styles: ['Musical theatre'] }), f({ styles: ['Theatre'] }))).toBe(true);
        expect(matchesFilters(mk({ styles: ['Improv'] }), f({ styles: ['Theatre'] }))).toBe(false);
        // a typed custom style nobody has → no match
        expect(matchesFilters(mk({ styles: ['Improv'] }), f({ styles: ['Sketch'] }))).toBe(false);
    });
    it('experience: unspecified passes when empty, drops once a level is picked', () => {
        const noLevel = mk({ exp: undefined });
        expect(matchesFilters(noLevel, EMPTY_FILTERS)).toBe(true);
        expect(matchesFilters(noLevel, f({ experience: ['professional'] }))).toBe(false);
        expect(matchesFilters(mk({ exp: 'professional' }), f({ experience: ['professional'] }))).toBe(true);
    });
    it('pitch toggle needs a non-empty coverNote', () => {
        expect(matchesFilters(mk({ note: 'my pitch' }), f({ pitch: true }))).toBe(true);
        expect(matchesFilters(mk({ note: '' }), f({ pitch: true }))).toBe(false);
    });
    it('portfolio toggle needs a non-empty portfolioLinks (0 on seeded data)', () => {
        expect(matchesFilters(mk({ links: ['http://x'] }), f({ portfolio: true }))).toBe(true);
        expect(matchesFilters(mk({ links: [] }), f({ portfolio: true }))).toBe(false);
    });
});

describe('matchesFilters — combine (AND across, OR within)', () => {
    const a = mk({ city: 'Pune', styles: ['Theatre'], exp: 'professional', note: 'x' });
    it('(Pune OR Mumbai) AND Professional AND (Theatre OR Improv) AND pitch', () => {
        const filt = f({ cities: ['pune', 'mumbai'], experience: ['professional'], styles: ['Theatre', 'Improv'], pitch: true });
        expect(matchesFilters(a, filt)).toBe(true);
        // flip one AND-category to fail
        expect(matchesFilters(mk({ city: 'Delhi', styles: ['Theatre'], exp: 'professional', note: 'x' }), filt)).toBe(false);
    });
    it('OR within a category — any one city value is enough', () => {
        expect(matchesFilters(mk({ city: 'Mumbai' }), f({ cities: ['pune', 'mumbai'] }))).toBe(true);
    });
});

describe('filterAndSortApplicants — sorting', () => {
    const old = mk({ id: 'old', name: 'Old', city: 'Delhi', exp: 'beginner', rating: 5, at: '2026-11-01T00:00:00Z' });
    const mid = mk({ id: 'mid', name: 'Mid', city: 'Pune', exp: 'professional', rating: 3, at: '2026-11-10T00:00:00Z' });
    const neu = mk({ id: 'new', name: 'New', city: 'Pune', exp: 'intermediate', rating: 0, at: '2026-11-20T00:00:00Z' });
    const list = [old, mid, neu];

    const ids = (arr: any[]) => arr.map((a) => a._id);

    it('recency (default) — newest first', () => {
        expect(ids(filterAndSortApplicants(list, EMPTY_FILTERS, 'recency'))).toEqual(['new', 'mid', 'old']);
    });
    it('rating — highest first, recency tiebreak', () => {
        expect(ids(filterAndSortApplicants(list, EMPTY_FILTERS, 'rating'))).toEqual(['old', 'mid', 'new']);
    });
    it('experience — pro > intermediate > beginner', () => {
        expect(ids(filterAndSortApplicants(list, EMPTY_FILTERS, 'experience'))).toEqual(['mid', 'new', 'old']);
    });
    it('local-first — venue city floats up, recency within each group', () => {
        // venue = Pune → mid & new (Pune) ahead of old (Delhi), newest-first within Pune
        expect(ids(filterAndSortApplicants(list, EMPTY_FILTERS, 'local', 'PUNE'))).toEqual(['new', 'mid', 'old']);
    });
    it('does not mutate the input list', () => {
        const copy = [...list];
        filterAndSortApplicants(list, EMPTY_FILTERS, 'rating');
        expect(list).toEqual(copy);
    });
    it('filter then sort — a filtered-out applicant never appears', () => {
        const out = filterAndSortApplicants(list, f({ cities: ['pune'] }), 'recency', 'PUNE');
        expect(ids(out)).toEqual(['new', 'mid']); // Delhi 'old' excluded
    });
});

describe('counts + chips', () => {
    it('countActiveFilters counts active VALUES (mock badge = 3)', () => {
        expect(countActiveFilters(f({ cities: ['pune', 'mumbai'], experience: ['professional'] }))).toBe(3);
        expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
        expect(countActiveFilters(f({ name: 'rhea', pitch: true }))).toBe(2);
    });
    it('activeFilterChips lists every applied value, removable', () => {
        const filt = f({ cities: ['pune'], styles: ['Theatre'], experience: ['professional'], pitch: true });
        const chips = activeFilterChips(filt);
        expect(chips.map((c) => c.label)).toEqual(['Pune', 'Theatre', 'Professional', 'Wrote a pitch']);
        // removing the city chip clears that one value
        const cityChip = chips.find((c) => c.kind === 'city')!;
        expect(removeChip(filt, cityChip).cities).toEqual([]);
        // other categories untouched
        expect(removeChip(filt, cityChip).experience).toEqual(['professional']);
    });
    it('toggleCity adds then removes', () => {
        expect(toggleCity(EMPTY_FILTERS, 'pune').cities).toEqual(['pune']);
        expect(toggleCity(f({ cities: ['pune'] }), 'pune').cities).toEqual([]);
    });
});

describe('deriveFilterOptions', () => {
    // Mirrors the seeded pool's shape: PUNE + Pune must merge into one option.
    const pool = [
        mk({ city: 'PUNE', styles: ['Theatre', 'Improv'], exp: 'professional' }),
        mk({ city: 'Pune', styles: ['Theatre'], exp: 'intermediate' }),
        mk({ city: 'Mumbai', styles: ['Film'], exp: 'professional' }),
        mk({ city: undefined, styles: [], exp: undefined }), // the real, sparse applicant
    ];

    it('cities merge aliases + carry counts, sorted by count', () => {
        const { cities } = deriveFilterOptions(pool);
        expect(cities).toEqual([
            { value: 'pune', label: 'Pune', count: 2 },
            { value: 'mumbai', label: 'Mumbai', count: 1 },
        ]);
    });
    it('styles carry counts; the gig’s own styles float to the front', () => {
        const { styles } = deriveFilterOptions(pool, { gigStyles: ['Film'] });
        expect(styles[0]).toEqual({ value: 'Film', label: 'Film', count: 1 }); // gig style first despite lower count
        expect(styles.map((s) => s.label)).toEqual(['Film', 'Theatre', 'Improv']);
    });
    it('experience lists only present levels with counts, pro→beginner', () => {
        const { experience } = deriveFilterOptions(pool);
        expect(experience).toEqual([
            { value: 'professional', label: 'Professional', count: 2 },
            { value: 'intermediate', label: 'Intermediate', count: 1 },
        ]);
    });
});
