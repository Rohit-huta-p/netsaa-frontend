/**
 * useEventsByOrganizer — other LIVE events by a given organizer, for the event
 * detail "More by organizer" rail. Public read: GET /v1/events?organizerId=…&status=live
 * (the events-service getEvents filter). Returns the events array (with the
 * currently-viewed event filtered out) plus the total count — the same query
 * powers both the rail and the organizer card's "N events hosted" line.
 *
 * Disabled until an organizerId is known; short-circuits without a network call.
 */
import { useQuery } from '@tanstack/react-query';
import { eventService, type EventDoc } from '@/services/eventService';

export function useEventsByOrganizer(
  organizerId?: string,
  excludeEventId?: string,
  limit = 12,
) {
  return useQuery<{ events: EventDoc[]; total: number }>({
    queryKey: ['eventsByOrganizer', organizerId, excludeEventId, limit],
    enabled: !!organizerId,
    staleTime: 1000 * 60,
    queryFn: async () => {
      const { events, total } = await eventService.list({
        organizerId,
        status: 'live',
        limit,
      });
      return { events: events.filter((e) => e._id !== excludeEventId), total };
    },
  });
}

export default useEventsByOrganizer;
