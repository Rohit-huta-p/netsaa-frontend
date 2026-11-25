import { API_EVENTS_URL } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const BASE = API_EVENTS_URL;

export interface MyWaitlistMineEntry {
  _id: string;
  status: 'waiting' | 'promoted';
  position?: number;
  promotionExpiresAt?: string;
  eventId: {
    _id: string;
    title?: string;
    startsAt?: string;
    schedule?: { startDate?: string };
    location?: { venueName?: string; city?: string };
    ticketPrice?: number;
    pricing?: { amount?: number };
  } | null;
}

/**
 * All of the caller's ACTIVE waitlist entries across every event (waiting + promoted),
 * each with a light populated event summary. Hits GET /v1/waitlist/mine.
 *
 * Powers the home "What you're in" tab: a PROMOTED entry surfaces there as a
 * "Seat open · confirm" card without the user opening each event. Errors degrade to
 * an empty list (the home list just won't show promotions).
 */
export function useMyWaitlistMine() {
  const userId = useAuthStore((s) => s.user?._id);
  return useQuery<MyWaitlistMineEntry[]>({
    queryKey: ['myWaitlistMine', userId],
    queryFn: async () => {
      const token = useAuthStore.getState().accessToken;
      try {
        const r = await axios.get(`${BASE}/v1/waitlist/mine`, { headers: { Authorization: `Bearer ${token}` } });
        return (r.data?.data ?? []) as MyWaitlistMineEntry[];
      } catch {
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export default useMyWaitlistMine;
