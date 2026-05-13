import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const BASE = process.env.EXPO_PUBLIC_API_EVENT_URL || 'https://netsaa-events-service.onrender.com';

/**
 * Probes whether the current user is registered for this event.
 * Hits GET /api/events/:id/registrations/me (shipped in Plan 6 Task 12).
 *
 * - 200 → returns the registration row
 * - 404 → returns null (not registered)
 * - Other errors → thrown (React Query surfaces them)
 *
 * staleTime 60 s — keeps the CTA state stable during a session without
 * hammering the backend on every render.
 */
export function useMyRegistration(eventId: string) {
  const userId = useAuthStore((s) => s.user?._id);

  return useQuery({
    queryKey: ['myRegistration', eventId, userId],
    queryFn: async () => {
      const token = useAuthStore.getState().accessToken;
      try {
        const r = await axios.get(
          `${BASE}/api/events/${eventId}/registrations/me`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        return r.data.data ?? r.data;
      } catch (err: any) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!userId && !!eventId,
    staleTime: 60_000,
  });
}
