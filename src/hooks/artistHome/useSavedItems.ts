/**
 * useSavedItems (artist-home) — React Query hook for the artist-home
 * Saved section. Dual query: saved gigs + saved events.
 *
 * NAMESPACE NOTE
 * --------------
 * The existing hook at `src/hooks/useSavedItems.ts` is used by the
 * shipped /saved app screen and has a different, broader return shape
 * (saved / applied / upcoming / history all in one). The Plan 2
 * dashboard section needs a narrower, simpler shape — separated here
 * under artistHome/ to avoid breaking the existing consumer.
 *
 * RETURN SHAPE
 * ------------
 *   {
 *     gigs:   any[],        // whatever the backend returns for saved gigs
 *     events: any[],        // whatever the backend returns for saved events
 *     isLoading: boolean,   // true while EITHER query is fetching
 *     error: unknown | null
 *   }
 *
 * KEY + STALE
 * -----------
 * queryKey (gigs):   queryKeys.artist.savedGigs()
 * queryKey (events): queryKeys.artist.savedEvents()
 * staleTime: 1 minute each. Saves are low-frequency — cached for the
 *   dashboard preview.
 *
 * INVALIDATION CONTRACT
 * ---------------------
 * Components that save or unsave MUST invalidate the matching key:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.artist.savedGigs() })
 *   queryClient.invalidateQueries({ queryKey: queryKeys.artist.savedEvents() })
 *
 * LIMIT
 * -----
 * Optional `limit` param is forwarded to both services so the dashboard
 * preview can fetch a small slice.
 */

import { useQueries } from '@tanstack/react-query';
import gigService from '../../services/gigService';
import eventService from '../../services/eventService';
import { queryKeys } from '../../constants/queryKeys';

/** Defensive unwrap for service responses. */
function unwrap(resp: any): any[] {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp.data)) return resp.data;
  return [];
}

export function useSavedItems(limit?: number) {
  const results = useQueries({
    queries: [
      {
        queryKey: queryKeys.artist.savedGigs(),
        queryFn: () => gigService.getSavedGigs({ limit }),
        staleTime: 1000 * 60,
      },
      {
        queryKey: queryKeys.artist.savedEvents(),
        queryFn: () => eventService.getSavedEvents({ limit }),
        staleTime: 1000 * 60,
      },
    ],
  });

  const [gigsQ, eventsQ] = results;

  return {
    gigs: unwrap(gigsQ.data),
    events: unwrap(eventsQ.data),
    isLoading: gigsQ.isLoading || eventsQ.isLoading,
    error: gigsQ.error ?? eventsQ.error ?? null,
  };
}

export default useSavedItems;
