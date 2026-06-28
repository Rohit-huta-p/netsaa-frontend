import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const BASE = process.env.EXPO_PUBLIC_API_EVENT_URL || 'https://netsaa-events-service.onrender.com';

export interface RosterRow {
  _id: string;
  userId: string;
  name: string;
  city?: string;
  registeredAt: string;
  status: string;
  visibility: 'public' | 'private';
}

export function useEventRoster(eventId: string) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['eventRoster', eventId],
    queryFn: async (): Promise<{ rows: RosterRow[]; total: number }> => {
      try {
        const r = await axios.get(`${BASE}/v1/events/${eventId}/roster`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return r.data.data;
      } catch (err: any) {
        // 404 = backend not yet shipped (Plan 6 Task 12 pending), return empty
        if (err.response?.status === 404) return { rows: [], total: 0 };
        throw err;
      }
    },
    enabled: !!eventId && !!token,
  });
}
