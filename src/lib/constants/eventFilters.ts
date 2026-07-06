
import { EventFilterState } from '@/types/eventFilters';

export const EVENT_CATEGORIES = ["Music", "Dance", "Theatre", "Modeling", "Workshops", "Comedy", "Art"];

export const INITIAL_EVENT_FILTERS: EventFilterState = {
    quick: null,
    advanced: {
        category: {},
        location: { format: 'any' },
        timing: {},
        pricing: { mode: 'any' },
        sorting: { sortBy: 'relevance' },
    },
};

// Quick presets — only reference surviving sections (category / location /
// timing / pricing / sorting). Presets that leaned on removed sections were
// remapped onto these.
export const EVENT_FILTER_PRESETS: Record<string, { name: string; description: string; icon: string; filters: Partial<EventFilterState> }> = {
    'happening-soon': {
        name: 'Happening Soon',
        description: 'Events in next 7 days',
        icon: 'calendar',
        filters: {
            advanced: {
                category: {},
                location: { format: 'any' },
                timing: { timeFrame: 'next_7' },
                pricing: { mode: 'any' },
                sorting: { sortBy: 'soonest' },
            },
        },
    },
    'this-weekend': {
        name: 'This Weekend',
        description: 'Events happening Sat-Sun',
        icon: 'calendar',
        filters: {
            advanced: {
                category: {},
                location: { format: 'any' },
                timing: { timeFrame: 'this_weekend' },
                pricing: { mode: 'any' },
                sorting: { sortBy: 'soonest' },
            },
        },
    },
    'free': {
        name: 'Free Events',
        description: 'No ticket required',
        icon: 'tag',
        filters: {
            advanced: {
                category: {},
                location: { format: 'any' },
                timing: {},
                pricing: { mode: 'free' },
                sorting: { sortBy: 'relevance' },
            },
        },
    },
    'online': {
        name: 'Online Events',
        description: 'Attend from anywhere',
        icon: 'book-open',
        filters: {
            advanced: {
                category: {},
                location: { format: 'online' },
                timing: {},
                pricing: { mode: 'any' },
                sorting: { sortBy: 'relevance' },
            },
        },
    },
};

// Counts the 6 discovery groups that carry an active selection:
//   category selected · city set · format !== 'any' · timeFrame set · mode !== 'any'.
// Sort is intentionally NOT counted (a sort is always applied, it isn't a filter).
export const countActiveEventFilters = (filters: EventFilterState): number => {
    let count = 0;

    if (filters.quick && filters.quick !== 'All Events') {
        count++;
    }

    const adv = filters.advanced;
    if (!adv) return count;

    if ((adv.category?.categories?.length ?? 0) > 0) count++;
    if (adv.location?.city && adv.location.city !== 'any') count++;
    if (adv.location?.format && adv.location.format !== 'any') count++;
    if (adv.timing?.timeFrame) count++;
    if (adv.pricing?.mode && adv.pricing.mode !== 'any') count++;

    return count;
};
