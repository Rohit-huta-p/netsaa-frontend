// Shared option data + helpers for the event discovery filter surfaces
// (Ask bar · Remote · Facet Rail). One source of truth so every surface emits
// the same values the /v1/events list params expect:
//   craft  → category (csv, lowercase slugs)
//   city   → city  ('any' ⇒ undefined)
//   format → location.kind      ('any' | 'in_person' | 'online')
//   when   → startsAfter/startsBefore window (via timeFrameWindow in the screen)
//   price  → registrationMode   ('free' ⇒ free_rsvp, 'paid' ⇒ paid_ticket)
//   sort   → sort (soonest server-side; price_low/popular client-side)

import { EventFilterState } from '@/types/eventFilters';

export type FilterOption = { value: string; label: string };

// value = backend slug (lowercase). Mirrors the retired EventFilterModal set.
export const CRAFT_OPTIONS: FilterOption[] = [
    { value: 'any', label: 'Any' },
    { value: 'dance', label: 'Dance' },
    { value: 'music', label: 'Music' },
    { value: 'theatre', label: 'Theatre' },
    { value: 'comedy', label: 'Comedy' },
    { value: 'film', label: 'Film' },
];

export const CITY_OPTIONS: FilterOption[] = [
    { value: 'any', label: 'All' },
    { value: 'pune', label: 'Pune' },
    { value: 'mumbai', label: 'Mumbai' },
    { value: 'delhi', label: 'Delhi' },
    { value: 'bangalore', label: 'Bengaluru' },
];

export const FORMAT_OPTIONS: FilterOption[] = [
    { value: 'any', label: 'Any' },
    { value: 'in_person', label: 'In person' },
    { value: 'online', label: 'Online' },
];

// Locked "When" taxonomy: any · today · this weekend · this month.
export const WHEN_OPTIONS: FilterOption[] = [
    { value: 'any', label: 'Any' },
    { value: 'today', label: 'Today' },
    { value: 'this_weekend', label: 'This weekend' },
    { value: 'this_month', label: 'This month' },
];

export const PRICE_OPTIONS: FilterOption[] = [
    { value: 'any', label: 'Any' },
    { value: 'free', label: 'Free' },
    { value: 'paid', label: 'Paid' },
];

export const SORT_OPTIONS: FilterOption[] = [
    { value: 'relevance', label: 'Relevant' },
    { value: 'soonest', label: 'Soonest' },
    { value: 'price_low', label: 'Price ↑' },
    { value: 'popular', label: 'Popular' },
];

// Active/selected state — neutral + dim (NOT bright white). Shared so "active"
// reads as a quiet selected state and never steals focus from the search input.
export const ACTIVE_BG = 'rgba(255,255,255,0.10)';
export const ACTIVE_BORDER = 'rgba(255,255,255,0.20)';
export const ACTIVE_FG = '#c4c4cc';

type Advanced = EventFilterState['advanced'];

/** Immutably patch one `advanced` section (mirrors the modal's `patch`). */
export function patchSection(
    filters: EventFilterState,
    section: keyof Advanced,
    updates: Record<string, any>,
): EventFilterState {
    return {
        ...filters,
        advanced: {
            ...filters.advanced,
            [section]: { ...filters.advanced[section], ...updates },
        },
    };
}

/* ---- current-value readers (so surfaces don't re-derive the fallbacks) ---- */

export const craftValue = (f: EventFilterState): string =>
    f.advanced.category.categories?.[0] ?? 'any';
export const cityValue = (f: EventFilterState): string => f.advanced.location.city || 'any';
export const formatValue = (f: EventFilterState): string => f.advanced.location.format || 'any';
export const whenValue = (f: EventFilterState): string => f.advanced.timing.timeFrame || 'any';
export const priceValue = (f: EventFilterState): string => f.advanced.pricing.mode || 'any';
export const sortValue = (f: EventFilterState): string => f.advanced.sorting.sortBy || 'relevance';

/* ---- writers: map an option value back onto EventFilterState ---- */

export function setCraft(f: EventFilterState, v: string): EventFilterState {
    return patchSection(f, 'category', { categories: v === 'any' ? [] : [v] });
}
export function setCity(f: EventFilterState, v: string): EventFilterState {
    return patchSection(f, 'location', { city: v === 'any' ? undefined : v });
}
export function setFormat(f: EventFilterState, v: string): EventFilterState {
    return patchSection(f, 'location', { format: v as Advanced['location']['format'] });
}
export function setWhen(f: EventFilterState, v: string): EventFilterState {
    return patchSection(f, 'timing', {
        timeFrame: v === 'any' ? undefined : (v as Advanced['timing']['timeFrame']),
    });
}
export function setPrice(f: EventFilterState, v: string): EventFilterState {
    return patchSection(f, 'pricing', { mode: v as Advanced['pricing']['mode'] });
}
export function setSort(f: EventFilterState, v: string): EventFilterState {
    return patchSection(f, 'sorting', { sortBy: v as Advanced['sorting']['sortBy'] });
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Human-readable summary parts for the readout line / collapsed Remote pill. */
export function describeFilters(f: EventFilterState): string[] {
    const adv = f.advanced;
    const parts: string[] = [];
    const craft = adv.category.categories?.[0];
    if (craft) parts.push(cap(craft));
    if (adv.location.city && adv.location.city !== 'any') parts.push(cap(adv.location.city));
    if (adv.location.format && adv.location.format !== 'any') {
        parts.push(adv.location.format === 'in_person' ? 'In person' : 'Online');
    }
    if (adv.timing.timeFrame) {
        parts.push(WHEN_OPTIONS.find((w) => w.value === adv.timing.timeFrame)?.label ?? '');
    }
    if (adv.pricing.mode && adv.pricing.mode !== 'any') parts.push(cap(adv.pricing.mode));
    return parts.filter(Boolean);
}
