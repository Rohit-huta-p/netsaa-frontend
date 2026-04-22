/**
 * useUpcoming — composite React Query hook for the artist-home Upcoming
 * section. Fans out to gigs-service (hired applications) and
 * events-service (user event registrations), normalizes both into a
 * single typed list, and sorts by date ascending.
 *
 * RETURN SHAPE
 * ------------
 *   {
 *     data: UpcomingItem[],   // pre-sorted, soonest first
 *     isLoading: boolean,     // true while EITHER query is fetching
 *     error: unknown | null,  // first non-null error if either fails
 *   }
 *
 * Each UpcomingItem is:
 *   {
 *     type: 'gig' | 'event',
 *     id: string,             // underlying gig or event _id
 *     title: string,
 *     date: string | null,    // ISO date (or null if unknown)
 *     location?: string,
 *     counterparty?: string,  // hirer name for gigs, organizer for events
 *   }
 *
 * KEYS
 * ----
 * The public queryKey on this hook is queryKeys.artist.upcoming() — used
 * by artist-home for pull-to-refresh invalidation. The internal queries
 * use their own scoped keys so React Query dedupes them with any other
 * hook fetching the same data (e.g., useApplications for hired status).
 *
 * STALE
 * -----
 * 1 minute — upcoming lists shift slowly (new gigs are hired at most a
 * few per day for a typical artist). Not as volatile as applications.
 *
 * ERROR SEMANTICS
 * ---------------
 * Partial failures are tolerated: if the events query fails but gigs
 * succeeds, `data` contains just the gigs. `error` is the first
 * non-null error from either (so a SectionCard retry is possible).
 *
 * TODO(plan-2): verify the gigs-service response shape for the
 * "hired" filter and the events-service registrations shape. Both
 * endpoints return envelope objects of the form { data: [...] }. Defensive
 * reads below tolerate both flat arrays and envelopes.
 */

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import gigService from '../services/gigService';
import eventService from '../services/eventService';
import { queryKeys } from '../constants/queryKeys';

export type UpcomingItem = {
  type: 'gig' | 'event';
  id: string;
  title: string;
  date: string | null;
  location?: string;
  counterparty?: string;
};

/** Defensive unwrap: some services return `[...]`, others `{ data: [...] }`. */
function unwrap(resp: any): any[] {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp.data)) return resp.data;
  return [];
}

function normalizeLocation(loc: any): string | undefined {
  if (!loc) return undefined;
  if (typeof loc === 'string') return loc;
  if (loc.venueName && loc.city) return `${loc.venueName}, ${loc.city}`;
  if (loc.city) return loc.city;
  if (loc.venueName) return loc.venueName;
  return undefined;
}

function toGigItem(app: any): UpcomingItem | null {
  // Applications may have gigId populated as an object or be flat.
  const gig =
    (app?.gigId && typeof app.gigId === 'object' && app.gigId) ||
    app?.gig ||
    app;
  if (!gig) return null;
  const id = gig._id || gig.id || app?.gigId;
  if (!id) return null;
  const hirer = gig.organizer || gig.hirer || gig.postedBy;
  return {
    type: 'gig',
    id: String(id),
    title: gig.title || 'Untitled Gig',
    date: gig?.schedule?.startDate || gig.startDate || null,
    location: normalizeLocation(gig.location),
    counterparty:
      typeof hirer === 'object' ? hirer?.displayName || hirer?.name : undefined,
  };
}

function toEventItem(reg: any): UpcomingItem | null {
  const event =
    reg?.event ||
    reg?.eventDetails ||
    (reg?.eventId && typeof reg.eventId === 'object' ? reg.eventId : null);
  if (!event) return null;
  const id = event._id || event.id || reg?.eventId;
  if (!id) return null;
  const organizer = event.organizer || event.organizerId;
  return {
    type: 'event',
    id: String(id),
    title: event.title || 'Untitled Event',
    date: event?.schedule?.startDate || event.startDate || null,
    location: normalizeLocation(event.location),
    counterparty:
      typeof organizer === 'object'
        ? organizer?.displayName || organizer?.name || organizer?.organizationName
        : undefined,
  };
}

/**
 * `limit` applies per-source before merging — a value of 10 means "up to
 * 10 hired gigs and up to 10 event RSVPs, merged and sorted".
 */
export function useUpcoming(limit?: number) {
  const results = useQueries({
    queries: [
      {
        // Use the filtered applications key so this dedupes with
        // useApplications('hired', ...) if both mount on the same screen.
        queryKey: queryKeys.artist.applications('hired'),
        queryFn: () =>
          gigService.getUserApplications({ status: 'hired', limit }),
        staleTime: 1000 * 60, // 1 minute
      },
      {
        queryKey: [...queryKeys.artist.upcoming(), 'event-registrations'] as const,
        queryFn: () => eventService.getUserRegistrations({ limit }),
        staleTime: 1000 * 60,
      },
    ],
  });

  const [apps, regs] = results;

  const data = useMemo<UpcomingItem[]>(() => {
    const now = Date.now();
    const gigItems = unwrap(apps.data)
      .map(toGigItem)
      .filter((x): x is UpcomingItem => x !== null);
    const eventItems = unwrap(regs.data)
      .map(toEventItem)
      .filter((x): x is UpcomingItem => x !== null);

    const merged = [...gigItems, ...eventItems];

    // Keep future-dated (or undated, which we assume upcoming) items.
    const future = merged.filter((i) => {
      if (!i.date) return true;
      const t = new Date(i.date).getTime();
      return Number.isNaN(t) || t >= now;
    });

    future.sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : Infinity;
      const tb = b.date ? new Date(b.date).getTime() : Infinity;
      return ta - tb;
    });

    return future;
  }, [apps.data, regs.data]);

  return {
    data,
    isLoading: apps.isLoading || regs.isLoading,
    error: apps.error ?? regs.error ?? null,
  };
}

export default useUpcoming;
