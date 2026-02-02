
import { EventFilterState, EventTypeFilters } from '@/types/eventFilters';

export const EVENT_CATEGORIES = ["Music", "Dance", "Theatre", "Modeling", "Workshops", "Comedy", "Art"];

export const EVENT_FILTER_PRESETS: Record<string, { name: string; description: string; icon: string; filters: Partial<EventFilterState> }> = {
    'happening-soon': {
        name: 'Happening Soon',
        description: 'Events in next 7 days',
        icon: 'clock',
        filters: {
            advanced: {
                eventType: {},
                category: {},
                skillLevel: {},
                artistType: {},
                location: {},
                timing: { timeFrame: 'next-7-days' },
                pricing: {},
                sorting: { sortBy: 'soonest' },
            },
        },
    },
    'free-workshops': {
        name: 'Free Workshops',
        description: 'Learn for free',
        icon: 'gift',
        filters: {
            advanced: {
                eventType: { format: ['Workshop'] },
                category: {},
                skillLevel: {},
                artistType: {},
                location: {},
                timing: {},
                pricing: { isFree: true },
                sorting: { sortBy: 'relevance' },
            },
        },
    },
    'online': {
        name: 'Online Events',
        description: 'Attend from anywhere',
        icon: 'wifi',
        filters: {
            advanced: {
                eventType: {},
                category: {},
                skillLevel: {},
                artistType: {},
                location: { isOnline: true },
                timing: {},
                pricing: {},
                sorting: { sortBy: 'relevance' },
            },
        },
    },
    // Retaining 'free' for backward compatibility or simple Quick Filter usage if desired,
    // though 'free-workshops' covers specific case.
    'free': {
        name: 'Free Events',
        description: 'No ticket required',
        icon: 'tag',
        filters: {
            advanced: {
                eventType: {},
                category: {},
                skillLevel: {},
                artistType: {},
                location: {},
                timing: {},
                pricing: { isFree: true },
                sorting: { sortBy: 'price_low' },
            },
        },
    },
    'this-weekend': {
        name: 'This Weekend',
        description: 'Events happening Sat-Sun',
        icon: 'calendar',
        filters: {
            advanced: {
                eventType: {},
                category: {},
                skillLevel: {},
                artistType: {},
                location: {},
                timing: { weekendOnly: true },
                pricing: {},
                sorting: { sortBy: 'soonest' },
            },
        },
    },
};

export const countActiveEventFilters = (filters: EventFilterState): number => {
    let count = 0;

    if (filters.quick && filters.quick !== 'All Events') {
        count++;
    }

    Object.values(filters.advanced || {}).forEach((sectionFilters) => {
        Object.entries(sectionFilters as Record<string, any>).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '' && value !== 'any' && value !== false) {
                if (typeof value === 'boolean' && value) count++;
                else if (Array.isArray(value) && value.length > 0) count++;
                else if (typeof value === 'object' && Object.keys(value).length > 0) count++; // e.g dateRange
                else if (typeof value === 'number' && value > 0) count++;
                else if (typeof value === 'string' && value !== 'relevance' && value !== 'any') count++;
            }
        });
    });

    return count;
};

export const INITIAL_EVENT_FILTERS: EventFilterState = {
    quick: null,
    advanced: {
        eventType: {},
        category: {},
        skillLevel: {},
        artistType: {},
        location: {},
        timing: {},
        pricing: {},
        sorting: { sortBy: 'relevance' },
    },
};
