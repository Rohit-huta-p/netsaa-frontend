import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_EVENT_URL || 'https://netsaa-events-service.onrender.com';

export interface EventMedia {
  kind: 'photo' | 'video';
  url: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  duration?: number;
  isHero: boolean;
  sortOrder: number;
}

export interface EventLocation {
  kind: 'in_person' | 'online';
  venueName?: string;
  address?: string;
  landmark?: string;
  geo?: { type: 'Point'; coordinates: [number, number] };
  onlinePlatform?: string;
}

export interface EventCapacity {
  total: number;
  registeredCount: number;
  slotsLeft?: number; // computed by backend on detail
}

export interface EventDoc {
  _id: string;
  organizerId: string | { _id: string; name: string; verified: boolean; avatar?: string; role?: string };
  title: string;
  tagline?: string;
  topicTags: string[];
  registrationMode: 'free_rsvp' | 'paid_ticket';
  about: string;
  whatToExpect?: string;
  skills: string[];
  startsAt: string;
  endsAt?: string;
  durationKind: 'm30' | 'h1' | 'h2' | 'h3' | 'half' | 'full' | 'multi';
  location: EventLocation;
  capacity: EventCapacity;
  media: EventMedia[];
  status: 'draft' | 'pending_review' | 'live' | 'cancelled' | 'completed';
  moderationFlagReason?: string;
  stats?: { views: number; saves: number; sharesCount: number };
  cancelledAt?: string;
  rescheduledFromAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventListParams {
  topicTag?: string;
  city?: string;
  mode?: 'free_rsvp' | 'paid_ticket';
  skill?: string;
  q?: string;
  page?: number;
  limit?: number;
}

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const eventService = {
  list: async (params: EventListParams = {}): Promise<{ events: EventDoc[]; total: number; page: number; limit: number }> => {
    const r = await client.get('/api/events', { params });
    return r.data.data;
  },

  detail: async (id: string): Promise<EventDoc> => {
    const r = await client.get(`/api/events/${id}`);
    return r.data.data.event;
  },

  create: async (payload: Partial<EventDoc>): Promise<{ _id: string; status: EventDoc['status']; moderationFlagReason?: string }> => {
    const r = await client.post('/api/events', payload);
    return r.data.data.event;
  },

  register: async (eventId: string, visibility: 'public' | 'private' = 'private'): Promise<{ ok: true; visibility: string }> => {
    const r = await client.post(`/api/events/${eventId}/register`, { visibility });
    return r.data.data;
  },

  cancelMyRegistration: async (eventId: string): Promise<{ ok: true }> => {
    const r = await client.delete(`/api/events/${eventId}/registrations/me`);
    return r.data.data;
  },

  suggestionTags: async (limit = 20): Promise<{ tags: Array<{ _id: string; displayName: string; usageCount: number }>; count: number }> => {
    const r = await client.get('/v1/admin/events/tags/suggestions', { params: { limit } });
    return r.data.data;
  },

  submitTag: async (rawInput: string): Promise<{ created: boolean; normalizedId: string; displayName: string }> => {
    const r = await client.post('/v1/admin/events/tags/submit', { rawInput });
    return r.data.data;
  },
};
