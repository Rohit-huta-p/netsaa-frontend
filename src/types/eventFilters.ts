// Event Filter State Types
//
// Trimmed 2026-07-06 to the 6 discovery groups that map to real backend params
// on GET /v1/events: category, city, format, when (startsAfter/startsBefore),
// price (mode), sort. Removed: skillLevel, artistType, and the
// audienceSize/genres/distance/isOnline/weekendOnly/dateRange/timeOfDay/
// minPrice/maxPrice fields.
//
// 2026-10-22 — eventType re-added for the A·Minimal board's searchable
// multi-select (DOCS/04-design/mockups/event-board-aminimal.html). It is a
// MULTI (any-of) facet applied CLIENT-SIDE over the loaded page: the backend
// getEvents honours `eventType` only as a single exact match (events.ts:41 —
// no CSV→$in split like `category`), so sending a multi-value CSV would match
// nothing. Filtering the loaded list mirrors the screen's existing client-side
// price_low/popular sorts. (Server-facet upgrade path: add `$in` to the
// backend, mirroring `category`, then send it like `category`.)

export interface CategoryFilters {
    categories?: string[]; // e.g. 'dance', 'music', 'theatre'
}

export interface EventTypeFilters {
    eventTypes?: string[]; // enum slugs: 'workshop' | 'audition' | 'open_mic' | …
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
        eventType: EventTypeFilters;
        location: LocationFilters;
        timing: TimingFilters;
        pricing: PricingFilters;
        sorting: SortingFilters;
    };
}
