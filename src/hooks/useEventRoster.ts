import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const BASE = process.env.EXPO_PUBLIC_API_EVENT_URL || 'https://netsaa-events-service.onrender.com';

export interface RosterRow {
  _id: string;
  userId: string;
  name: string;
  phone?: string;
  seats: number;
  registeredAt?: string;
  joinedAt?: string;       // waitlist entries
  position?: number;       // waitlist entries
  status: string;
  visibility?: 'public' | 'private';
}

export interface RosterData {
  confirmed: RosterRow[];
  waitlist: RosterRow[];
  cancelled: RosterRow[];
  counts: { confirmed: number; waitlist: number; cancelled: number };
}

const EMPTY: RosterData = {
  confirmed: [],
  waitlist: [],
  cancelled: [],
  counts: { confirmed: 0, waitlist: 0, cancelled: 0 },
};

export function useEventRoster(eventId: string) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['eventRoster', eventId],
    queryFn: async (): Promise<RosterData> => {
      try {
        const r = await axios.get(`${BASE}/v1/events/${eventId}/roster`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = r.data.data ?? {};
        // Tolerate the legacy {rows,total} shape until the branch backend is live.
        if (!d.counts && Array.isArray(d.rows)) {
          return { confirmed: d.rows, waitlist: [], cancelled: [], counts: { confirmed: d.rows.length, waitlist: 0, cancelled: 0 } };
        }
        return {
          confirmed: d.confirmed ?? [],
          waitlist: d.waitlist ?? [],
          cancelled: d.cancelled ?? [],
          counts: d.counts ?? { confirmed: 0, waitlist: 0, cancelled: 0 },
        };
      } catch (err: any) {
        if (err.response?.status === 404) return EMPTY;
        throw err;
      }
    },
    enabled: !!eventId && !!token,
  });
}
