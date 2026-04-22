/**
 * Centralized React Query keys for the artist-home dashboard (Plan 2).
 *
 * INVALIDATION CONTRACT
 * ---------------------
 * Any hook or component that mutates data must invalidate the matching key
 * prefix so all dependent sections re-fetch. Examples:
 *
 *   // After withdrawing an application — invalidate ALL filters so chip
 *   // counts and lists update across every AppliedSection variant:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.artist.applications() });
 *
 *   // After saving/unsaving a gig:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.artist.savedGigs() });
 *
 *   // After writing/removing a draft via draftService:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.artist.drafts() });
 *
 * Keys are declared as `as const` readonly tuples so TypeScript can enforce
 * exact shapes at both produce and consume sites (type-safe invalidation).
 *
 * Plan 3 will add `queryKeys.hirer.*` with parallel structure.
 */
export const queryKeys = {
  artist: {
    hero: () => ['artist', 'hero'] as const,
    applications: (filter?: string) =>
      ['artist', 'applications', filter ?? 'all'] as const,
    upcoming: () => ['artist', 'upcoming'] as const,
    savedGigs: () => ['artist', 'savedGigs'] as const,
    savedEvents: () => ['artist', 'savedEvents'] as const,
    drafts: () => ['artist', 'drafts'] as const,
    contracts: () => ['artist', 'contracts'] as const,
    conversations: () => ['artist', 'conversations'] as const,
  },
} as const;
