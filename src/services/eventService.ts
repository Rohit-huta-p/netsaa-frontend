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

export interface AgendaItem {
  date: string;          // ISO date (the day this item belongs to)
  title: string;         // short topic name, e.g. "Aarambh · The beginning"
  subtitle?: string;     // optional one-line description
  startsAt?: string;     // ISO datetime (full start time, overrides date)
  durationMinutes?: number;
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
  registrationDeadline?: string; // ISO datetime · cutoff for new registrations
  agenda?: AgendaItem[];         // optional per-day breakdown, populated for multi-day events
  status: 'draft' | 'pending_review' | 'live' | 'cancelled' | 'completed';
  moderationFlagReason?: string;
  stats?: { views: number; saves: number; sharesCount: number };
  cancelledAt?: string;
  rescheduledFromAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterPayload {
  visibility?: 'public' | 'private';
  attendeeName: string;
  attendeePhone: string;
  attendeeEmail?: string;
  attendeeCount: number;        // 1-5
  guestNames?: string[];
  notes?: string;
}

export interface RegisterResponse {
  ok: true;
  visibility: 'public' | 'private';
  attendeeCount: number;
  paymentRequired: boolean;
  // Present when paymentRequired === true:
  order_id?: string;
  amount?: number;            // paise
  currency?: string;
  key_id?: string;
  prefill?: { name?: string; email?: string; contact?: string };
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
    const r = await client.get('/v1/events', { params });
    // Backend envelope is { meta: { total, page, pages }, data: EventDoc[] }.
    // Unwrap into the declared shape the UI consumes (data.events / data.total),
    // NOT the raw array — returning r.data.data made data.events undefined → "no events".
    const meta = r.data?.meta ?? {};
    return {
      events: Array.isArray(r.data?.data) ? r.data.data : [],
      total: meta.total ?? 0,
      page: meta.page ?? Number(params.page ?? 1),
      limit: Number(params.limit ?? 20),
    };
  },

  detail: async (id: string): Promise<EventDoc> => {
    const r = await client.get(`/v1/events/${id}`);
    return r.data.data;
  },

  create: async (payload: Partial<EventDoc>): Promise<{ _id: string; status: EventDoc['status']; moderationFlagReason?: string }> => {
    const r = await client.post('/v1/events', payload);
    return r.data.data;
  },

  register: async (
    eventId: string,
    payload: RegisterPayload,
  ): Promise<RegisterResponse> => {
    const r = await client.post(`/v1/events/${eventId}/register`, payload);
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

  /**
   * Hirer dashboard "Your posts" section — events the current organizer has posted.
   *
   * Endpoint: GET /v1/organizers/me/events (events.routes.ts:28 → events.ts:79).
   * The events controller still reads organizerId from req.query (TODO in source
   * targets req.user._id migration, filed as TODOS P3.2). Until that lands the
   * frontend passes organizerId explicitly so the call works against any
   * backend version (stale dist + fresh source both accept the param).
   *
   * Response shape (per events.ts:84-89):
   *   { meta: { status, message, total }, data: EventDoc[], errors: [] }
   *
   * Filter mapping (events status enum: draft | pending_review | live | cancelled | completed):
   *   Draft  → status='draft'
   *   Live   → status='live'
   *   Closed → status='completed' OR status='cancelled' (caller decides)
   *
   * Backend currently returns ALL events regardless of status filter — the
   * status query param exists in the request but the controller ignores it.
   * Caller is responsible for client-side filtering until backend honors it.
   */
  getOrganizerEvents: async (params: {
    organizerId: string;
    status?: 'draft' | 'pending_review' | 'live' | 'cancelled' | 'completed';
    limit?: number;
  }): Promise<EventDoc[]> => {
    const r = await client.get('/v1/organizers/me/events', { params });
    // Backend returns data as the array directly (not wrapped in { events }).
    const data = r.data?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.events)) return data.events;
    return [];
  },
};
