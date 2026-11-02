import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import {
  getEventRoster,
  type EventRosterData,
  type EventRosterRow,
} from '@/services/eventService';

// The roster shape + fetch now live in eventService (getEventRoster), which
// normalises the full bucketed response (confirmed / requests / approved /
// waitlist / cancelled / declined) and tolerates the legacy shapes + a 404.
// These aliases keep the existing `import { ..., type RosterRow } from
// '@/hooks/useEventRoster'` call-sites working unchanged.
export type RosterRow = EventRosterRow;
export type RosterData = EventRosterData;

export function useEventRoster(eventId: string) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery<EventRosterData>({
    queryKey: ['eventRoster', eventId],
    queryFn: () => getEventRoster(eventId),
    enabled: !!eventId && !!token,
  });
}
