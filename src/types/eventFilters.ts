// Event Filter State Types

export interface EventTypeFilters {
    format?: string[]; // e.g., 'workshop', 'performance', 'competition'
    audienceSize?: string;
}

export interface CategoryFilters {
    categories?: string[]; // e.g., 'music', 'dance', 'theatre'
    genres?: string[]; // e.g., 'jazz', 'classical'
}

export interface SkillLevelFilters {
    levels?: string[]; // e.g., 'beginner', 'advanced' (mostly for workshops)
}

export interface ArtistTypeFilters {
    types?: string[]; // e.g., 'singer', 'band', 'dj' (who is performing)
}

export interface LocationFilters {
    city?: string;
    distance?: number | 'any';
    isOnline?: boolean;
}

export interface TimingFilters {
    dateRange?: { start: string; end: string };
    weekendOnly?: boolean;
    timeFrame?: 'this-weekend' | 'next-7-days' | 'today';
    timeOfDay?: string[]; // 'morning', 'evening'
}

export interface PricingFilters {
    isFree?: boolean;
    minPrice?: number;
    maxPrice?: number;
}

export interface SortingFilters {
    sortBy: 'relevance' | 'soonest' | 'popular' | 'price_low' | 'price_high';
}

export interface EventFilterState {
    quick: null | string;
    advanced: {
        eventType: EventTypeFilters;
        category: CategoryFilters;
        skillLevel: SkillLevelFilters;
        artistType: ArtistTypeFilters;
        location: LocationFilters;
        timing: TimingFilters;
        pricing: PricingFilters;
        sorting: SortingFilters;
    };
}
