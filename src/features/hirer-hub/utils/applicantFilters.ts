// src/features/hirer-hub/utils/applicantFilters.ts
//
// Pure, UI-free filter + sort logic for the owner-hub "See all" applicant list
// (GigApplicantsAllScreen). Every predicate reads a field already on the loaded
// GigApplication — artistSnapshot (primaryCity / specialities / experienceLevel
// / rating / displayName) plus coverNote / portfolioLinks — so filtering is
// entirely client-side over the React Query cache (no backend, no re-fetch).
//
// Design ref: DOCS/04-design/mockups/applicant-filters-SPEC.md (+ -MOCK.html).
// Combine rule: AND across categories, OR within one →
//   (Pune OR Mumbai) AND Professional AND (Theatre OR Improv) AND wrote-a-pitch
//
// Kept as a standalone pure module so the combine logic, the city-alias merge
// and every sort are unit-testable without rendering anything.

export type ApplicantSort = 'recency' | 'rating' | 'experience' | 'local';

export type ApplicantFilters = {
    /** displayName contains (case-insensitive). */
    name: string;
    /** Normalized city KEYS (any-of). Use toggleCity / normalizeCityKey. */
    cities: string[];
    /** Style values — matched case-insensitively as a substring of a speciality (any-of). */
    styles: string[];
    /** experienceLevel values: 'professional' | 'intermediate' | 'beginner' (any-of). */
    experience: string[];
    /** coverNote non-empty. */
    pitch: boolean;
    /** portfolioLinks non-empty. */
    portfolio: boolean;
};

export const EMPTY_FILTERS: ApplicantFilters = {
    name: '', cities: [], styles: [], experience: [], pitch: false, portfolio: false,
};

/* ------------------------------------------------------------------ *
 * City normalization — the applicant pool stores raw, human-typed
 * cities ("PUNE", "Pune", "Bengaluru", "Bangalore"), so a naive match
 * would split one city into several. Fold case + merge the common
 * Indian-city aliases into a single canonical key/display.
 * ------------------------------------------------------------------ */
const CITY_ALIASES: Record<string, string> = {
    bangalore: 'bengaluru',
    bengaluru: 'bengaluru',
    bombay: 'mumbai',
    mumbai: 'mumbai',
    gurgaon: 'gurugram',
    gurugram: 'gurugram',
    calcutta: 'kolkata',
    kolkata: 'kolkata',
    madras: 'chennai',
    chennai: 'chennai',
};
// Canonical display spellings for aliased keys; others are title-cased.
const CITY_DISPLAY: Record<string, string> = {
    bengaluru: 'Bengaluru', mumbai: 'Mumbai', gurugram: 'Gurugram',
    kolkata: 'Kolkata', chennai: 'Chennai',
};

const titleCase = (s: string): string =>
    s.replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

/** Fold a raw city string to its canonical lowercase key ('' when blank). */
export function normalizeCityKey(raw?: string): string {
    const k = (raw ?? '').trim().toLowerCase();
    if (!k) return '';
    return CITY_ALIASES[k] ?? k;
}

/** Human display spelling for a raw city string (canonical for aliases). */
export function cityDisplay(raw?: string): string {
    const key = normalizeCityKey(raw);
    if (!key) return '';
    return CITY_DISPLAY[key] ?? titleCase(key);
}

/* ------------------------------------------------------------------ *
 * Field readers — defensive, mirroring HubApplicantRow's bindings so
 * the filter agrees with what the card shows (e.g. primaryCity ?? location).
 * ------------------------------------------------------------------ */
const cityOf = (a: any): string => a?.artistSnapshot?.primaryCity ?? a?.artistSnapshot?.location ?? '';
const stylesOf = (a: any): string[] =>
    Array.isArray(a?.artistSnapshot?.specialities) ? a.artistSnapshot.specialities.filter(Boolean) : [];
const expOf = (a: any): string => String(a?.artistSnapshot?.experienceLevel ?? '').trim().toLowerCase();
const nameOf = (a: any): string => String(a?.artistSnapshot?.displayName ?? '').trim();
const hasPitch = (a: any): boolean => String(a?.coverNote ?? '').trim().length > 0;
const hasPortfolio = (a: any): boolean =>
    Array.isArray(a?.portfolioLinks) && a.portfolioLinks.filter(Boolean).length > 0;
const ratingOf = (a: any): number =>
    typeof a?.artistSnapshot?.rating === 'number' && a.artistSnapshot.rating > 0 ? a.artistSnapshot.rating : -1;
const timeOf = (a: any): number => {
    const t = new Date(a?.appliedAt ?? 0).getTime();
    return Number.isFinite(t) ? t : 0;
};

/* ------------------------------------------------------------------ *
 * Predicate — AND across categories, OR within each.
 *   • unspecified passes when a category is empty; once a value is
 *     picked, an applicant missing that field drops out (e.g. a
 *     city-less applicant fails any active city filter).
 *   • styles match case-insensitively as a SUBSTRING so a typed
 *     custom value ("Sketch") or a family ("Theatre" ⊃ "Musical
 *     theatre") still bites. Cities match on the exact canonical key.
 * ------------------------------------------------------------------ */
export function matchesFilters(a: any, f: ApplicantFilters): boolean {
    const q = f.name.trim().toLowerCase();
    if (q && !nameOf(a).toLowerCase().includes(q)) return false;

    if (f.cities.length && !f.cities.includes(normalizeCityKey(cityOf(a)))) return false;

    if (f.styles.length) {
        const specs = stylesOf(a).map((s) => s.toLowerCase());
        const hit = f.styles.some((s) => {
            const sl = s.trim().toLowerCase();
            return !!sl && specs.some((sp) => sp.includes(sl));
        });
        if (!hit) return false;
    }

    if (f.experience.length) {
        const lv = expOf(a);
        if (!lv || !f.experience.map((e) => e.toLowerCase()).includes(lv)) return false;
    }

    if (f.pitch && !hasPitch(a)) return false;
    if (f.portfolio && !hasPortfolio(a)) return false;
    return true;
}

/* ------------------------------------------------------------------ *
 * Sort — recency default. Rating / experience fall back to recency on
 * ties so unrated / unspecified applicants keep a stable most-recent
 * order. Local-first ranks the venue city ahead of everyone else.
 * ------------------------------------------------------------------ */
const EXP_RANK: Record<string, number> = { professional: 3, intermediate: 2, beginner: 1 };

function compareApplicants(a: any, b: any, sort: ApplicantSort, venueCityKey: string): number {
    switch (sort) {
        case 'rating':
            return (ratingOf(b) - ratingOf(a)) || (timeOf(b) - timeOf(a));
        case 'experience':
            return ((EXP_RANK[expOf(b)] ?? 0) - (EXP_RANK[expOf(a)] ?? 0)) || (timeOf(b) - timeOf(a));
        case 'local': {
            const la = normalizeCityKey(cityOf(a)) === venueCityKey && venueCityKey ? 1 : 0;
            const lb = normalizeCityKey(cityOf(b)) === venueCityKey && venueCityKey ? 1 : 0;
            return (lb - la) || (timeOf(b) - timeOf(a));
        }
        case 'recency':
        default:
            return timeOf(b) - timeOf(a);
    }
}

/**
 * Filter then sort a flat applicant list. Pure — never mutates `list`.
 * `venueCity` is only consulted by the 'local' sort.
 */
export function filterAndSortApplicants(
    list: any[], f: ApplicantFilters, sort: ApplicantSort, venueCity?: string,
): any[] {
    const vk = normalizeCityKey(venueCity);
    return list.filter((a) => matchesFilters(a, f)).sort((a, b) => compareApplicants(a, b, sort, vk));
}

/* ------------------------------------------------------------------ *
 * Active-filter accounting — the `Filters · N` badge counts active
 * VALUES (Pune, Mumbai, Professional = 3), matching the mock.
 * ------------------------------------------------------------------ */
export function countActiveFilters(f: ApplicantFilters): number {
    return f.cities.length + f.styles.length + f.experience.length
        + (f.pitch ? 1 : 0) + (f.portfolio ? 1 : 0) + (f.name.trim() ? 1 : 0);
}

export function hasAnyFilter(f: ApplicantFilters): boolean {
    return countActiveFilters(f) > 0;
}

/* ------------------------------------------------------------------ *
 * Removable chips above the list (the applied filters).
 * ------------------------------------------------------------------ */
export type FilterChipKind = 'name' | 'city' | 'style' | 'experience' | 'pitch' | 'portfolio';
export type FilterChip = { kind: FilterChipKind; value: string; label: string };

export function activeFilterChips(f: ApplicantFilters): FilterChip[] {
    const chips: FilterChip[] = [];
    if (f.name.trim()) chips.push({ kind: 'name', value: f.name, label: `"${f.name.trim()}"` });
    f.cities.forEach((c) => chips.push({ kind: 'city', value: c, label: CITY_DISPLAY[c] ?? titleCase(c) }));
    f.styles.forEach((s) => chips.push({ kind: 'style', value: s, label: s }));
    f.experience.forEach((e) => chips.push({ kind: 'experience', value: e, label: titleCase(e) }));
    if (f.pitch) chips.push({ kind: 'pitch', value: 'pitch', label: 'Wrote a pitch' });
    if (f.portfolio) chips.push({ kind: 'portfolio', value: 'portfolio', label: 'Has portfolio' });
    return chips;
}

/* ------------------------------------------------------------------ *
 * Immutable filter updaters (used by the bar + sheet).
 * ------------------------------------------------------------------ */
const toggleIn = (arr: string[], v: string): string[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

export const toggleCity = (f: ApplicantFilters, v: string): ApplicantFilters => ({ ...f, cities: toggleIn(f.cities, v) });
export const toggleStyle = (f: ApplicantFilters, v: string): ApplicantFilters => ({ ...f, styles: toggleIn(f.styles, v) });
export const toggleExperience = (f: ApplicantFilters, v: string): ApplicantFilters => ({ ...f, experience: toggleIn(f.experience, v) });
export const setName = (f: ApplicantFilters, v: string): ApplicantFilters => ({ ...f, name: v });
export const togglePitch = (f: ApplicantFilters): ApplicantFilters => ({ ...f, pitch: !f.pitch });
export const togglePortfolio = (f: ApplicantFilters): ApplicantFilters => ({ ...f, portfolio: !f.portfolio });

export function removeChip(f: ApplicantFilters, chip: FilterChip): ApplicantFilters {
    switch (chip.kind) {
        case 'name': return setName(f, '');
        case 'city': return toggleCity(f, chip.value);
        case 'style': return toggleStyle(f, chip.value);
        case 'experience': return toggleExperience(f, chip.value);
        case 'pitch': return { ...f, pitch: false };
        case 'portfolio': return { ...f, portfolio: false };
        default: return f;
    }
}

/* ------------------------------------------------------------------ *
 * Option derivation — build the Cities / Styles / Experience option
 * lists (value + display label + count) from the loaded pool itself,
 * alias-normalized. Cities & Styles sort by count desc; the gig's own
 * styles (when it carries any) float to the front of Styles.
 * ------------------------------------------------------------------ */
export type FilterOptionCount = { value: string; label: string; count: number };
export type DerivedFilterOptions = {
    cities: FilterOptionCount[];
    styles: FilterOptionCount[];
    experience: FilterOptionCount[];
};

const EXP_LABEL: Record<string, string> = {
    professional: 'Professional', intermediate: 'Intermediate', beginner: 'Beginner',
};

export function deriveFilterOptions(list: any[], opts?: { gigStyles?: string[] }): DerivedFilterOptions {
    // Cities: canonical key → { display, count }.
    const cityMap = new Map<string, { label: string; count: number }>();
    for (const a of list) {
        const key = normalizeCityKey(cityOf(a));
        if (!key) continue;
        const cur = cityMap.get(key) ?? { label: cityDisplay(cityOf(a)), count: 0 };
        cur.count += 1;
        cityMap.set(key, cur);
    }
    const cities = [...cityMap.entries()]
        .map(([value, v]) => ({ value, label: v.label, count: v.count }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

    // Styles: case-folded key → { first-seen display, count }. Value = display
    // string (the filter matches it case-insensitively as a substring).
    const styleMap = new Map<string, { label: string; count: number }>();
    for (const a of list) {
        for (const s of stylesOf(a)) {
            const key = s.trim().toLowerCase();
            if (!key) continue;
            const cur = styleMap.get(key) ?? { label: s.trim(), count: 0 };
            cur.count += 1;
            styleMap.set(key, cur);
        }
    }
    const gigStyleKeys = new Set((opts?.gigStyles ?? []).map((s) => s.trim().toLowerCase()));
    const styles = [...styleMap.entries()]
        .map(([key, v]) => ({ key, value: v.label, label: v.label, count: v.count }))
        .sort((a, b) => {
            const ga = gigStyleKeys.has(a.key) ? 1 : 0;
            const gb = gigStyleKeys.has(b.key) ? 1 : 0;
            return (gb - ga) || (b.count - a.count) || a.label.localeCompare(b.label);
        })
        .map(({ value, label, count }) => ({ value, label, count }));

    // Experience: fixed pro → beginner order, only levels present in the pool.
    const expCount: Record<string, number> = { professional: 0, intermediate: 0, beginner: 0 };
    for (const a of list) {
        const lv = expOf(a);
        if (lv in expCount) expCount[lv] += 1;
    }
    const experience = (['professional', 'intermediate', 'beginner'] as const)
        .map((v) => ({ value: v, label: EXP_LABEL[v], count: expCount[v] }))
        .filter((o) => o.count > 0);

    return { cities, styles, experience };
}
