// Shared option data + helpers for the gig discovery filter surfaces
// (Facet Rail · Remote), mirroring the events discovery pattern. One source of
// truth so every surface reads/writes the same FilterState the gig search
// (searchService.searchGigs → GigSearchFilters DTO) already expects:
//   artist type → advanced.artistType.artistTypes  (MULTI, any-of)
//   pay         → advanced.compensation.minCompensation  (0 ⇒ Any)
//   city        → advanced.location.cities[] (MULTI, any-of) + .remoteOnly
//                 ('remote' ⇒ remoteOnly, exclusive with cities; 'any' clears)
//   experience  → advanced.experience.experienceLevel     (MULTI, any-of)
//   sort        → advanced.sorting.sortBy  ('relevance' is the no-op default)
//
// Values + writers are copied verbatim from the gig FilterModal so the emitted
// query is byte-for-byte identical — only the surface design changes.

import { FilterState } from '@/types/filters';

export type FilterOption = { value: string; label: string };

// Artist type + Experience are MULTI-select (arrays); the rest are single.
export const ARTIST_OPTIONS: FilterOption[] = [
    { value: 'singer', label: 'Singer' },
    { value: 'dancer', label: 'Dancer' },
    { value: 'musician', label: 'Musician' },
    { value: 'actor', label: 'Actor' },
    { value: 'model', label: 'Model' },
    { value: 'dj', label: 'DJ' },
    { value: 'comedian', label: 'Comedian' },
    { value: 'choreographer', label: 'Choreographer' },
];

// value = rupee floor as a string (parsed back to a number in setPay). '0' ⇒ Any.
export const PAY_OPTIONS: FilterOption[] = [
    { value: '0', label: 'Any' },
    { value: '2000', label: '₹2k+' },
    { value: '5000', label: '₹5k+' },
    { value: '15000', label: '₹15k+' },
    { value: '50000', label: '₹50k+' },
];

export const CITY_OPTIONS: FilterOption[] = [
    { value: 'any', label: 'Any' },
    { value: 'pune', label: 'Pune' },
    { value: 'mumbai', label: 'Mumbai' },
    { value: 'delhi', label: 'Delhi' },
    { value: 'bangalore', label: 'Bangalore' },
    { value: 'remote', label: 'Remote' },
];

// Year bands map onto the backend's experienceLevel enum (unchanged data).
export const EXPERIENCE_OPTIONS: FilterOption[] = [
    { value: 'beginner', label: '0–2 yrs' },
    { value: 'intermediate', label: '3–5 yrs' },
    { value: 'professional', label: '5+ yrs' },
];

// Mirrors the search service's sortMode values ('relevance' is the no-op default).
// NOTE: sort is a separate, still-inert concern (out of scope for the filter
// reconnection): 'compensation' here doesn't match the backend's 'highestPay',
// AND the search pipeline inserts its $sort after the $project that drops
// compensation.amount/publishedAt, so neither Newest nor Top-pay reorders yet.
// Reconnecting sort = a follow-up (align this value + retain the sort fields in
// buildGigsPipeline's $project).
export const SORT_OPTIONS: FilterOption[] = [
    { value: 'relevance', label: 'Relevant' },
    { value: 'newest', label: 'Newest' },
    { value: 'compensation', label: 'Top pay' },
];

// Active/selected pill state — neutral + dim (NOT bright white), shared with the
// events surfaces so "selected" reads as a quiet state, never stealing focus
// from the search input.
export const ACTIVE_BG = 'rgba(255,255,255,0.10)';
export const ACTIVE_BORDER = 'rgba(255,255,255,0.20)';
export const ACTIVE_FG = '#c4c4cc';

// Gigs' own accent (purple) in place of the events surfaces' orange — keeps the
// gig board cohesive (search spinner, badges, etc. are already #8B5CF6).
export const ACCENT = '#8B5CF6';

type Advanced = FilterState['advanced'];

/** Immutably patch one `advanced` section (mirrors the FilterModal's `patch`). */
export function patchSection(
    filters: FilterState,
    section: keyof Advanced,
    updates: Record<string, any>,
): FilterState {
    return {
        ...filters,
        advanced: {
            ...filters.advanced,
            [section]: { ...filters.advanced[section], ...updates },
        },
    };
}

/** A fresh, all-clear FilterState (sort reset to the default). */
export const emptyGigFilters = (): FilterState => ({
    quick: null,
    advanced: {
        trust: {},
        compensation: {},
        artistType: {},
        experience: {},
        location: {},
        timing: {},
        eventType: {},
        requirements: {},
        sorting: { sortBy: 'relevance' },
    },
});

const toggle = (arr: string[] = [], v: string): string[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

/* ---- current-value readers (so surfaces don't re-derive the fallbacks) ---- */

export const artistValues = (f: FilterState): string[] => f.advanced.artistType.artistTypes ?? [];
export const payValue = (f: FilterState): string => String(f.advanced.compensation.minCompensation ?? 0);
// City is MULTI-select (any-of) via location.cities[]; Remote is a separate,
// mutually-exclusive toggle (remoteOnly). A gig can't be both in a city and
// remote, so selecting one clears the other (see setCity).
export const cityValues = (f: FilterState): string[] => f.advanced.location.cities ?? [];
export const isRemote = (f: FilterState): boolean => f.advanced.location.remoteOnly === true;
export const expValues = (f: FilterState): string[] => f.advanced.experience.experienceLevel ?? [];
export const sortValue = (f: FilterState): string => f.advanced.sorting.sortBy || 'relevance';

/* ---- writers: map an option value back onto FilterState (verbatim rules) ---- */

export const setArtist = (f: FilterState, v: string): FilterState =>
    patchSection(f, 'artistType', { artistTypes: toggle(artistValues(f), v) });

export const setPay = (f: FilterState, v: string): FilterState =>
    patchSection(f, 'compensation', { minCompensation: Number(v) });

/**
 * Toggle city selection. Cities are multi-select (any-of); 'remote' is an
 * exclusive toggle; 'any' clears everything. Picking a city clears remote and
 * vice-versa (a gig can't be both in a city and remote). The legacy single
 * `city` is always cleared so it can't linger as a stale active filter.
 */
export const setCity = (f: FilterState, v: string): FilterState => {
    if (v === 'any') return patchSection(f, 'location', { cities: [], city: undefined, remoteOnly: false });
    if (v === 'remote')
        return patchSection(f, 'location', { cities: [], city: undefined, remoteOnly: !isRemote(f) });
    return patchSection(f, 'location', { cities: toggle(cityValues(f), v), city: undefined, remoteOnly: false });
};

export const setExperience = (f: FilterState, v: string): FilterState =>
    patchSection(f, 'experience', { experienceLevel: toggle(expValues(f), v) });

export const setSort = (f: FilterState, v: string): FilterState =>
    patchSection(f, 'sorting', { sortBy: v });

const labelOf = (opts: FilterOption[], v: string) => opts.find((o) => o.value === v)?.label ?? v;

/** Human-readable summary parts for the readout line / collapsed Remote pill. */
export function describeGigFilters(f: FilterState): string[] {
    const parts: string[] = [];
    artistValues(f).forEach((v) => parts.push(labelOf(ARTIST_OPTIONS, v)));
    if (payValue(f) !== '0') parts.push(labelOf(PAY_OPTIONS, payValue(f)));
    cityValues(f).forEach((v) => parts.push(labelOf(CITY_OPTIONS, v)));
    if (isRemote(f)) parts.push('Remote');
    expValues(f).forEach((v) => parts.push(labelOf(EXPERIENCE_OPTIONS, v)));
    return parts.filter(Boolean);
}

/**
 * Count of active *facet* groups (artist · pay · city · experience) — sort is
 * excluded because it's surfaced separately (rail header lenses / Remote panel),
 * mirroring the gig page's original filter-badge convention.
 */
export function countGigFacets(f: FilterState): number {
    let n = 0;
    if (artistValues(f).length) n++;
    if (payValue(f) !== '0') n++;
    if (cityValues(f).length || isRemote(f)) n++;
    if (expValues(f).length) n++;
    return n;
}
