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
  // Video (Mux) fields
  status?: 'processing' | 'ready' | 'errored';
  uploadId?: string;
  muxPlaybackId?: string;
  aspectRatio?: string;
}

export interface EventLocation {
  kind: 'in_person' | 'online';
  venueName?: string;
  address?: string;
  landmark?: string;
  geo?: { type: 'Point'; coordinates: [number, number] };
  onlinePlatform?: string;
  meetingLink?: string;                                   // online · join link · encrypted at rest (D7 reversed 2026-06-26)
  meetingLinkRevealAt?: 'on_register' | 'T-24h' | 'T-1h'; // when attendees see the link
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

export interface EventCancellationPolicy {
  fullRefundUntil?: string;          // ISO date — full refund before this
  partialRefundUntil?: string;       // ISO date — partialRefundPercent between fullRefundUntil and this
  partialRefundPercent?: number;     // 0-100
  notes?: string;                    // free-text shown to attendees
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

  // Schema migration 2026-06-25 — see DOCS/02-engineering/migrations/2026-06-25-event-flow-schema.md
  allowWaitlist?: boolean;
  waitlistCount?: number;                   // number of active waitlist entries (backend-computed)
  discussionCount?: number;                 // event-comment count (backend-computed) — powers O4 Discussion tile
  waitlistAutoPromote?: boolean;            // Q1 · per-event flag
  cancellationPolicy?: EventCancellationPolicy;
  walkupsAllowed?: boolean;                 // Q11 · day-of walk-ups opt-in
  maxGuestsPerRegistration?: number;        // default 5
  requiredAttendeeFields?: ('phone' | 'email' | 'guestNames')[];
  visibility?: 'public' | 'unlisted' | 'private';
  registrationClosed?: boolean;            // organiser can close/reopen RSVPs without cancelling
  ageRestriction?: number;
  language?: string;                        // ISO 639-1
  discussionVisibility?: 'public' | 'attendees_only';  // Q8

  /** Set by backend when the reveal window has opened for this viewer. */
  meetingLinkRevealed?: boolean;

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
  idempotencyKey: string;       // required; stable per attempt, reused on retry
}

/** Shape returned by POST /v1/events/:id/register (free events only; no paymentRequired field). */
export interface RegisterResponse {
  _id: string;
  eventId: string;
  userId: string;
  status: string;
  paymentStatus?: string;
  attendeeCount: number;
  visibility: 'public' | 'private';
  createdAt: string;
  updatedAt: string;
}

export interface EventListParams {
  topicTag?: string;
  city?: string;
  mode?: 'free_rsvp' | 'paid_ticket';
  skill?: string;
  q?: string;
  /** Filter to one organizer's events (public getEvents; still defaults to status:'live'). */
  organizerId?: string;
  status?: 'draft' | 'pending_review' | 'live' | 'cancelled' | 'completed';
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
    const attendees = [
      {
        fullName: payload.attendeeName,
        phone: payload.attendeePhone,
        email: payload.attendeeEmail || undefined,
        notes: payload.notes || undefined,
      },
      ...(payload.guestNames ?? [])
        .filter((g) => g.trim())
        .map((g) => ({ fullName: g.trim(), phone: payload.attendeePhone })),
    ];
    const r = await client.post(
      `/v1/events/${eventId}/register`,
      { quantity: payload.attendeeCount, attendees, visibility: payload.visibility ?? 'public' },
      { headers: { 'Idempotency-Key': payload.idempotencyKey } },
    );
    return r.data.data;
  },

  reserve: async (
    eventId: string,
    quantity: number,
    idempotencyKey: string,
  ): Promise<{ reservationId: string; razorpayOrderId: string; amountPaise: number }> => {
    const r = await client.post(
      `/v1/events/${eventId}/reserve`,
      { quantity },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
    return r.data.data;
  },

  // Tag taxonomy endpoints are not implemented server-side yet — degrade gracefully
  // (no autocomplete / silent submit) instead of throwing + retrying on 404.
  suggestionTags: async (limit = 20): Promise<{ tags: Array<{ _id: string; displayName: string; usageCount: number }>; count: number }> => {
    try {
      const r = await client.get('/v1/admin/events/tags/suggestions', { params: { limit } });
      return r.data.data;
    } catch {
      return { tags: [], count: 0 };
    }
  },

  submitTag: async (rawInput: string): Promise<{ created: boolean; normalizedId: string; displayName: string }> => {
    try {
      const r = await client.post('/v1/admin/events/tags/submit', { rawInput });
      return r.data.data;
    } catch {
      return { created: false, normalizedId: '', displayName: rawInput };
    }
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

  // Current user's saved events / event registrations (artist dashboard
  // Saved + Upcoming). Backend: GET /v1/users/me/saved-events and
  // /v1/users/me/event-registrations (both `protect`ed). Returns the raw
  // { data } envelope — consumers read `.data`.
  getSavedEvents: async (params?: { limit?: number }): Promise<{ data: any[] }> => {
    const r = await client.get('/v1/users/me/saved-events', { params });
    return (r.data ?? { data: [] }) as { data: any[] };
  },

  getUserRegistrations: async (params?: { limit?: number }): Promise<{ data: any[] }> => {
    const r = await client.get('/v1/users/me/event-registrations', { params });
    return (r.data ?? { data: [] }) as { data: any[] };
  },

  // Toggle-save (bookmark) an event. Backend POST /v1/events/:id/save is a
  // toggle — creates or deletes the SavedEvent — and returns the new state.
  // Envelope is { meta, data: { saved }, errors }, so unwrap to { saved }.
  saveEvent: async (eventId: string): Promise<{ saved: boolean }> => {
    const r = await client.post(`/v1/events/${eventId}/save`);
    return r.data.data;
  },

  getTicket: async (registrationId: string): Promise<{
    registrationId: string; ticketCode: string; backupCode: string;
    qrPayload: string; attendeeCount: number; status: string;
  }> => {
    const r = await client.get(`/v1/registrations/${registrationId}/ticket`);
    return r.data.data;
  },

  checkIn: async (eventId: string, code: string, method: 'qr' | 'manual' | 'backup' = 'qr'): Promise<{
    ticketId: string; attendeeName: string; status: string; checkedInAt: string;
  }> => {
    const r = await client.post(`/v1/events/${eventId}/check-in`, { code, method });
    return r.data.data;
  },

  cancelRegistration: async (registrationId: string, reason: string): Promise<{ status: string; refundId: string | null; refundAmountPaise: number }> =>
    (await client.post(`/v1/registrations/${registrationId}/cancel`, { reason })).data.data,

  cancelEvent: async (eventId: string, reason: string): Promise<{ affectedRegistrations: number; totalRefundPaise: number; netsaAbsorbedTotalPaise: number }> =>
    (await client.post(`/v1/events/${eventId}/cancel`, { reason })).data.data,

  update: async (id: string, patch: Partial<EventDoc>): Promise<EventDoc> => {
    const r = await client.patch(`/v1/events/${id}`, patch);
    return r.data.data;
  },

  addWalkup: async (
    eventId: string,
    body: { fullName: string; phone: string; quantity: number; payment: 'free' | 'cash' },
  ): Promise<{ registrationId: string; status: string; seats: number }> =>
    (await client.post(`/v1/events/${eventId}/walkup`, body)).data.data,

  joinWaitlist: async (eventId: string, quantity: number, attendeeSnapshot: { fullName: string; phone: string; email?: string }): Promise<{
    entryId: string; position: number; status: string;
  }> => (await client.post(`/v1/events/${eventId}/waitlist/join`, { quantity, attendeeSnapshot })).data.data,

  leaveWaitlist: async (eventId: string): Promise<{ status: string }> =>
    (await client.delete(`/v1/events/${eventId}/waitlist`)).data.data,

  confirmPromotion: async (entryId: string, idempotencyKey: string): Promise<{ registrationId: string }> =>
    (await client.post(`/v1/waitlist/${entryId}/confirm`, {}, { headers: { 'Idempotency-Key': idempotencyKey } })).data.data,

  // ---- Discussion thread (event comments) ----
  // Backend: GET/POST /v1/events/:eventId/discussion (both `protect`).
  // attendees_only events 403 non-registrants server-side (organizer exempt).
  // Returns the raw envelope { success, data }; DiscussionTab unwraps `.data`
  // (mirrors gigService.getGigDiscussion / postGigDiscussion).
  getEventDiscussion: async (eventId: string): Promise<any> => {
    const r = await client.get(`/v1/events/${eventId}/discussion`);
    return r.data;
  },

  postEventDiscussion: async (eventId: string, text: string): Promise<any> => {
    const r = await client.post(`/v1/events/${eventId}/discussion`, { text });
    return r.data;
  },
};

// Default export so `import eventService from '@/services/eventService'` resolves
// to the object. Metro/Babel interop yields `undefined` for a default import of a
// module with only named exports — which silently broke event discussion (and any
// other default-import site). The named `export const eventService` above is kept
// for existing `import { eventService }` sites. Mirrors gigService's default export.
export default eventService;
