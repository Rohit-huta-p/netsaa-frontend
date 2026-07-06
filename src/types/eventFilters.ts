// Event Filter State Types
//
// Trimmed 2026-07-06 to the 6 discovery groups that map to real backend params
// on GET /v1/events: category, city, format, when (startsAfter/startsBefore),
// price (mode), sort. Removed: eventType, skillLevel, artistType, and the
// audienceSize/genres/distance/isOnline/weekendOnly/dateRange/timeOfDay/
// minPrice/maxPrice fields.

export interface CategoryFilters {
    categories?: string[]; // e.g. 'dance', 'music', 'theatre'
}

export interface LocationFilters {
    city?: string;                              // undefined ⇒ any city
    format?: 'any' | 'in_person' | 'online';    // maps to location.kind server-side
}

export interface TimingFilters {
    timeFrame?: 'today' | 'this_weekend' | 'next_7' | 'this_month';
}

export interface PricingFilters {
    mode?: 'any' | 'free' | 'paid'; // free ⇒ free_rsvp, paid ⇒ paid_ticket
}

export interface SortingFilters {
    sortBy: 'relevance' | 'soonest' | 'price_low' | 'popular';
}

export interface EventFilterState {
    quick: null | string;
    advanced: {
        category: CategoryFilters;
        location: LocationFilters;
        timing: TimingFilters;
        pricing: PricingFilters;
        sorting: SortingFilters;
    };
}
