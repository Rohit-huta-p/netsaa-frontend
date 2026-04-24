/**
 * Centralized React Query keys for the artist-home dashboard (Plan 2).
 *
 * INVALIDATION CONTRACT
 * ---------------------
 * React Query's `invalidateQueries({ queryKey })` is PREFIX-MATCH. So a key
 * used to read one filtered variant must be a PROPER SUFFIX of the namespace
 * key used to invalidate the whole set. Don't bake filter values into the
 * "namespace" key — that makes each variant its own prefix and the bulk
 * invalidation silently misses every other cached filter.
 *
 * Examples:
 *
 *   // Read a specific filter:
 *   useQuery({ queryKey: queryKeys.artist.applications('applied'), ... })
 *
 *   // Invalidate EVERY filter (no arg = parent prefix):
 *   queryClient.invalidateQueries({ queryKey: queryKeys.artist.applications() });
 *   // → invalidates ['artist','applications'], ['artist','applications','applied'],
 *   //   ['artist','applications','hired'], etc. — prefix match.
 *
 *   // Save/unsave gig → invalidates savedGigs + upcoming (hired gigs live there):
 *   queryClient.invalidateQueries({ queryKey: queryKeys.artist.savedGigs() });
 *
 *   // Write/remove a draft (drafts are AsyncStorage-backed, so this is a
 *   // no-op for React Query but kept for symmetry):
 *   queryClient.invalidateQueries({ queryKey: queryKeys.artist.drafts() });
 *
 * Keys are declared `as const` readonly tuples so TypeScript can enforce
 * exact shapes at both produce and consume sites.
 *
 * Plan 3 adds `queryKeys.hirer.*` with parallel structure: hero,
 * postedGigs(filter?), applicants(filter?), hiredArtists, contracts.
 * Same prefix-match invalidation contract applies.
 */
export const queryKeys = {
  artist: {
    hero: () => ['artist', 'hero'] as const,

    // applications() with no arg = namespace key (prefix-invalidates every filter).
    // applications(filter) = filtered cache key. Always a proper suffix of the namespace.
    applications: (filter?: string) =>
      (filter && filter.length > 0
        ? (['artist', 'applications', 'byFilter', filter] as const)
        : (['artist', 'applications'] as const)),

    upcoming: () => ['artist', 'upcoming'] as const,
    savedGigs: () => ['artist', 'savedGigs'] as const,
    savedEvents: () => ['artist', 'savedEvents'] as const,
    drafts: () => ['artist', 'drafts'] as const,
    contracts: () => ['artist', 'contracts'] as const,
    conversations: () => ['artist', 'conversations'] as const,
  },
  hirer: {
    hero: () => ['hirer', 'hero'] as const,

    // postedGigs() with no arg = namespace prefix (prefix-invalidates every filter).
    // postedGigs(filter) = filtered cache key (proper suffix of the namespace).
    postedGigs: (filter?: string) =>
      (filter && filter.length > 0
        ? (['hirer', 'postedGigs', 'byFilter', filter] as const)
        : (['hirer', 'postedGigs'] as const)),

    // Same prefix-match pattern as artist.applications.
    applicants: (filter?: string) =>
      (filter && filter.length > 0
        ? (['hirer', 'applicants', 'byFilter', filter] as const)
        : (['hirer', 'applicants'] as const)),

    hiredArtists: () => ['hirer', 'hiredArtists'] as const,
    contracts: () => ['hirer', 'contracts'] as const,
  },
} as const;
