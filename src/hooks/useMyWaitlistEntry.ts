import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const BASE = process.env.EXPO_PUBLIC_API_EVENT_URL || 'https://netsaa-events-service.onrender.com';

export interface WaitlistEntry {
  _id: string;
  position: number;
  quantity: number;
  status: 'waiting' | 'promoted';
  promotionExpiresAt?: string;
}

/**
 * Probes whether the current user is on the waitlist for this event.
 * Hits GET /v1/events/:id/waitlist/me
 *
 * - 200 → returns the waitlist entry
 * - 404 → returns null (not on waitlist)
 * - Other errors → thrown (React Query surfaces them)
 *
 * staleTime 30 s — keeps the CTA state stable without hammering the backend.
 */
export function useMyWaitlistEntry(eventId: string) {
  const userId = useAuthStore((s) => s.user?._id);

  return useQuery<WaitlistEntry | null>({
    queryKey: ['myWaitlist', eventId, userId],
    queryFn: async () => {
      const token = useAuthStore.getState().accessToken;
      try {
        const r = await axios.get(
          `${BASE}/v1/events/${eventId}/waitlist/me`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        return r.data.data ?? r.data;
      } catch (err: any) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!userId && !!eventId,
    staleTime: 30_000,
  });
}
