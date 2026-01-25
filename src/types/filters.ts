// Filter State Types
export interface TrustFilters {
    verifiedOrganizer?: boolean;
    minRating?: number;
    paymentGuaranteed?: boolean;
    contractRequired?: boolean;
    minHires?: number;
}

export interface CompensationFilters {
    minCompensation?: number;
    maxCompensation?: number;
    excludeUnpaid?: boolean;
    compensationModel?: string[];
    negotiable?: boolean | 'any';
    rehearsalPaid?: boolean;
}

export interface ArtistTypeFilters {
    artistTypes?: string[];
    danceStyle?: string[];
    musicGenre?: string[];
    instrument?: string[];
    actingType?: string[];
}

export interface ExperienceFilters {
    experienceLevel?: string[];
    minAge?: number;
    maxAge?: number;
}

export interface LocationFilters {
    cities?: string[];
    city?: string;
    distance?: number | 'any' | 'state';
    remoteOnly?: boolean;
    travelExpensesPaid?: boolean;
    accommodationProvided?: boolean;
}

export interface TimingFilters {
    startDateAfter?: string;
    startDateBefore?: string;
    applicationDeadline?: string;
    gigType?: string[];
    duration?: string;
}

export interface EventTypeFilters {
    category?: string[];
    audienceSize?: string;
}

export interface RequirementsFilters {
    mediaRequired?: string[];
    perks?: string[];
    genderPreference?: string;
}

export interface SortingFilters {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    showOnly?: string[];
}

export interface FilterState {
    quick: string | null;
    advanced: {
        trust: TrustFilters;
        compensation: CompensationFilters;
        artistType: ArtistTypeFilters;
        experience: ExperienceFilters;
        location: LocationFilters;
        timing: TimingFilters;
        eventType: EventTypeFilters;
        requirements: RequirementsFilters;
        sorting: SortingFilters;
    };
}

export interface FilterPreset {
    name: string;
    description: string;
    icon: string;
    filters: Partial<FilterState>;
}

// Quick Filter Configuration
export const QUICK_FILTERS = {
    'all': {
        label: 'All Gigs',
        icon: null,
        params: {}
    },
    'new-today': {
        label: 'New Today',
        icon: 'sparkles',
        params: { createdAfter: 'today' }
    },
    'closing-soon': {
        label: 'Closing Soon',
        icon: 'clock',
        params: { sortBy: 'applicationDeadline', sortOrder: 'asc' }
    },
    'verified': {
        label: 'Verified Only',
        icon: 'shield-check',
        params: { verifiedOrganizer: true }
    },
    'high-pay': {
        label: '₹15,000+',
        icon: 'currency-rupee',
        params: { minCompensation: 15000 }
    },
    'remote': {
        label: 'Remote',
        icon: 'wifi',
        params: { isRemote: true }
    },
    'urgent': {
        label: 'Urgent',
        icon: 'zap',
        params: { isUrgent: true }
    },
    'featured': {
        label: 'Featured',
        icon: 'star',
        params: { isFeatured: true }
    }
};
