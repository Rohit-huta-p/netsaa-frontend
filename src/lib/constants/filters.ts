import { FilterPreset, QUICK_FILTERS } from '@/types/filters';

export const FILTER_PRESETS: Record<string, FilterPreset> = {
    'safe-bets': {
        name: 'Safe Bets',
        description: 'Verified organizers with payment protection',
        icon: 'shield',
        filters: {
            advanced: {
                trust: {
                    verifiedOrganizer: true,
                    paymentGuaranteed: true,
                    minRating: 4.5,
                    contractRequired: true,
                },
                compensation: {},
                artistType: {},
                experience: {},
                location: {},
                timing: {},
                eventType: {},
                requirements: {},
                sorting: {},
            },
        },
    },

    'high-pay': {
        name: 'High Pay',
        description: 'Professional gigs ₹15,000+',
        icon: 'currency-rupee',
        filters: {
            advanced: {
                trust: {},
                compensation: {
                    minCompensation: 15000,
                },
                artistType: {},
                experience: {
                    experienceLevel: ['professional'],
                },
                location: {},
                timing: {},
                eventType: {},
                requirements: {},
                sorting: {},
            },
        },
    },

    'beginner-friendly': {
        name: 'Beginner Friendly',
        description: 'Entry-level opportunities',
        icon: 'heart',
        filters: {
            advanced: {
                trust: {
                    verifiedOrganizer: true,
                },
                compensation: {
                    excludeUnpaid: true,
                },
                artistType: {},
                experience: {
                    experienceLevel: ['beginner'],
                },
                location: {},
                timing: {},
                eventType: {},
                requirements: {},
                sorting: {},
            },
        },
    },

    'local': {
        name: 'Near Me',
        description: 'Gigs within 50 km',
        icon: 'map-pin',
        filters: {
            advanced: {
                trust: {},
                compensation: {},
                artistType: {},
                experience: {},
                location: {
                    distance: 50,
                    travelExpensesPaid: false,
                },
                timing: {},
                eventType: {},
                requirements: {},
                sorting: {},
            },
        },
    },

    'remote': {
        name: 'Remote Only',
        description: 'Virtual performances',
        icon: 'wifi',
        filters: {
            advanced: {
                trust: {},
                compensation: {},
                artistType: {},
                experience: {},
                location: {
                    remoteOnly: true,
                },
                timing: {},
                eventType: {},
                requirements: {},
                sorting: {},
            },
        },
    },
};

/**
 * API Parameter Mapping for Backend GigSearchFilters DTO
 *
 * Maps frontend filter keys to backend API parameter names.
 * Backend expects: hardFilters, boostSignals, sortMode
 */
export const FILTER_API_MAPPING = {
    // Hard Filters (strict matching)
    artistTypes: 'artistTypes',
    experienceLevel: 'experienceLevel',
    gigType: 'gigType',
    category: 'category',
    city: 'city',
    remoteOnly: 'remoteOnly',
    minCompensation: 'minCompensation',
    compensationModel: 'compensationModel',
    applicationDeadline: 'applicationDeadline',
    perks: 'perks',
    excludeUnpaid: 'excludeUnpaid',

    // Boost Signals (ranking boosters)
    urgent: 'urgent',
    featured: 'featured',
    higherPay: 'higherPay',
    deadlineSoon: 'deadlineSoon',

    // Sorting
    sortBy: 'sortMode',
};

/**
 * Builds API query params from FilterState.
 * Maps to backend GigSearchFilters DTO structure.
 */
export const buildQueryParamsFromFilters = (filters: any): Record<string, any> => {
    const params: Record<string, any> = {};

    // Handle quick filters (presets)
    if (filters.quick && QUICK_FILTERS[filters.quick as keyof typeof QUICK_FILTERS]) {
        const presetParams = QUICK_FILTERS[filters.quick as keyof typeof QUICK_FILTERS].params;
        Object.assign(params, presetParams);
    }

    const advanced = filters.advanced || {};

    // --- Hard Filters ---

    // Artist Type
    if (advanced.artistType?.artistTypes?.length > 0) {
        params.artistTypes = advanced.artistType.artistTypes;
    }

    // Experience Level
    if (advanced.experience?.experienceLevel?.length > 0) {
        params.experienceLevel = advanced.experience.experienceLevel;
    }

    // Gig Type (from timing section)
    if (advanced.timing?.gigType?.length > 0) {
        params.gigType = advanced.timing.gigType;
    }

    // Category (from eventType section)
    if (advanced.eventType?.category?.length > 0) {
        params.category = advanced.eventType.category;
    }

    // City
    if (advanced.location?.city && advanced.location.city !== 'any') {
        params.city = advanced.location.city;
    }

    // Remote Only
    if (advanced.location?.remoteOnly === true) {
        params.remoteOnly = true;
    }

    // Compensation
    if (advanced.compensation?.excludeUnpaid === true) {
        params.excludeUnpaid = true;
    } else if (advanced.compensation?.minCompensation > 0) {
        params.minCompensation = advanced.compensation.minCompensation;
    }

    // Compensation Model
    if (advanced.compensation?.compensationModel?.length > 0) {
        params.compensationModel = advanced.compensation.compensationModel;
    }

    // Application Deadline
    if (advanced.timing?.applicationDeadline) {
        params.applicationDeadline = advanced.timing.applicationDeadline;
    }

    // Perks
    if (advanced.requirements?.perks?.length > 0) {
        params.perks = advanced.requirements.perks;
    }

    // --- Boost Signals ---

    if (advanced.trust?.urgent === true) {
        params.urgent = true;
    }

    if (advanced.trust?.featured === true) {
        params.featured = true;
    }

    if (advanced.compensation?.higherPay === true) {
        params.higherPay = true;
    }

    if (advanced.timing?.deadlineSoon === true) {
        params.deadlineSoon = true;
    }

    // --- Sort Mode ---
    if (advanced.sorting?.sortBy && advanced.sorting.sortBy !== 'relevance') {
        params.sortMode = advanced.sorting.sortBy;
    }

    return params;
};

// Count active filters
export const countActiveFilters = (filters: any): number => {
    let count = 0;

    if (filters.quick && filters.quick !== 'all') {
        count++;
    }

    Object.values(filters.advanced || {}).forEach((sectionFilters) => {
        Object.entries(sectionFilters as Record<string, any>).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '' && value !== 'any') {
                if (typeof value === 'boolean' && value) count++;
                else if (Array.isArray(value) && value.length > 0) count++;
                else if (typeof value === 'number' && value > 0) count++;
                else if (typeof value === 'string' && value !== 'any') count++;
            }
        });
    });

    return count;
};
