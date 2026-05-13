import { useLocalSearchParams } from 'expo-router';

/**
 * Reads the `?from=event:<eventId>` query parameter on the gig application screen,
 * returning the formatted source string to pass into the gig application mutation.
 *
 * Used when a discovery rail or event detail page deeplinks an artist into the
 * gig application flow with `source` provenance baked in.
 *
 * Example: events/detail page surfaces a related-gig CTA →
 *   router.push(`/gigs/${gigId}/apply?from=event:${event._id}`)
 *
 * Then on the apply screen:
 *   const source = useEventFunnelSource();
 *   applyToGig.mutate({ gigId, source });
 *
 * Backend (Plan 6 Task 21) sets gigApplication.source = source.
 */
export function useEventFunnelSource(): string | undefined {
  const params = useLocalSearchParams<{ from?: string }>();
  if (!params.from) return undefined;
  if (params.from.startsWith('event:')) return params.from;
  return undefined;
}
