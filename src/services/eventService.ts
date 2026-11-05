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
  city?: string;                                          // persisted + filtered server-side (events.ts: query['location.city'])
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

/** A host-authored custom registration question (event.registration.questions[i]). */
export interface EventQuestion {
  _id?: string;
  label: string;
  type: 'text' | 'choice' | 'link' | 'photo' | 'yes_no' | string;
  options?: string[];
  required?: boolean;
}

export interface EventDoc {
  _id: string;
  organizerId: string | { _id: string; name: string; verified: boolean; avatar?: string; role?: string };
  title: string;
  tagline?: string;
  topicTags: string[];
  registrationMode: 'free_rsvp' | 'paid_ticket';
  /** Detail/list responses carry this — backend maps ticketPrice → pricing.amount. */
  pricing?: { amount: number; currency?: string; refundPolicy?: string; refundCustomNote?: string };
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

  // ── E·9 photo-led detail fields (v4 schema; returned by the detail endpoint) ──
  eventType?: 'workshop' | 'masterclass' | 'audition' | 'open_mic' | 'competition' | 'performance' | 'screening' | 'meetup' | 'other' | 'showcase';
  eventTypeLabel?: string;
  skillLevel?: ('all' | 'beginner' | 'intermediate' | 'advanced') | Array<'all' | 'beginner' | 'intermediate' | 'advanced'>;
  eligibleArtistTypes?: string[];
  otherArtistTypes?: string[];
  openToAll?: boolean;
  languages?: string[];
  timeTbd?: boolean;
  coverFit?: 'whole' | 'fill';
  /** Featured artists — "Led by". userId links a NETSA profile; invite.status marks invited vs joined. */
  people?: Array<{ userId?: string; displayName: string; role?: string; avatarUrl?: string; invite?: { status: 'invited' | 'joined' } }>;
  // Subdoc _id is returned by the detail endpoint (Mongoose toObject). It is the
  // `spotId` / `questionId` the register+reserve contract keys off — see RegisterPayload.
  // NB: question _id CHURNS when the host edits questions (composerMapping strips+re-mints
  // it), so answers carry `label` too as the reliable server-side matcher.
  spots?: Array<{ _id?: string; name: string; note?: string; capacity?: number; price: number }>;
  offers?: Array<{ _id?: string; spotId?: string; name: string; price: number; audience?: 'everyone' | 'group'; endsAt?: string; seatLimit?: number; minSeats?: number }>;
  registration?: { door: 'open' | 'guest_list' | 'apply'; questions?: EventQuestion[] };
  requiresApproval?: boolean;
  lineup?: Array<{ when?: string; title: string; detail?: string }>;
  bring?: { items?: string[]; note?: string };
  included?: string[];
  eventConfig?: {
    materialsProvided?: boolean; preparationRequired?: boolean; preparationNotes?: string;
    competitionFormat?: string; judgingCriteria?: string[]; prizes?: Array<{ position: string; reward: string }>;
  };
  organizerSnapshot?: { name?: string; organizationName?: string; profileImageUrl?: string; verified?: boolean; role?: string; rating?: number };
}

/**
 * DPDP consent policy version sent with register/reserve. Mirrors the backend's
 * DPDP_POLICY_VERSION (events-service utils/consent.ts) so a FE/BE acceptance
 * reconciles to the same audited record. Bump both together when the consent
 * copy shown at registration changes.
 */
export const DPDP_CONSENT_VERSION = '2026.1';

/**
 * One answer to a host custom question. Send BOTH `questionId` and `label`:
 * the backend matches on either, but the question _id churns when the host edits
 * the event (composerMapping re-mints subdoc ids), so `label` is the reliable key.
 * `value` is a plain option string (choice), free text (text/link), or a boolean (yes_no).
 */
export interface RegisterAnswer {
  questionId?: string;
  label?: string;
  value: string | string[] | boolean;
}

/** Apply-with-work submission (door:'apply' only). */
export interface RegisterApplication {
  pitch?: string;
  links?: string[];
  mediaIds?: string[];
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
  // ── additive register-flow fields (all optional; back-compat) ──
  answers?: RegisterAnswer[];   // validated server-side vs event.registration.questions
  spotId?: string;              // required by a multi-spot event; single/spot-less defaults
  dpdpConsent?: boolean;        // true → persisted to UserConsent (scope event_registration)
  consentVersion?: string;      // defaults to DPDP_CONSENT_VERSION
  application?: RegisterApplication; // stored only for door:'apply'
}

/** Optional extras shared by register + reserve bodies. */
export interface ReserveExtras {
  answers?: RegisterAnswer[];
  spotId?: string;
  dpdpConsent?: boolean;
  consentVersion?: string;
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
  /** Comma-separated craft/category slugs → any-of match server-side. */
  category?: string;
  /** Comma-separated eventType enum slugs → any-of ($in) match server-side (needs netsaa-backend#16). */
  eventType?: string;
  city?: string;
  mode?: 'free_rsvp' | 'paid_ticket';
  /** location.kind filter. */
  format?: 'in_person' | 'online';
  /** ISO datetimes bounding startsAt (the "When" window). */
  startsAfter?: string;
  startsBefore?: string;
  skill?: string;
  q?: string;
  /** Server-side sort. Client still handles price_low/popular locally. */
  sort?: 'soonest' | 'newest' | 'oldest';
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

  /** Public "who's going" — count + first names only (no PII). Used by the E·9 detail page. */
  getPublicRoster: async (id: string): Promise<{ count: number; names: string[] }> => {
    const r = await client.get(`/v1/events/${id}/roster/public`);
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
    const body: Record<string, unknown> = {
      quantity: payload.attendeeCount,
      attendees,
      visibility: payload.visibility ?? 'public',
    };
    // Additive fields — only sent when present so the body stays minimal for
    // plain open-door free events (back-compat).
    if (payload.answers?.length) body.answers = payload.answers;
    if (payload.spotId) body.spotId = payload.spotId;
    if (payload.dpdpConsent) {
      body.dpdpConsent = true;
      body.consentVersion = payload.consentVersion ?? DPDP_CONSENT_VERSION;
    }
    if (payload.application) body.application = payload.application;
    const r = await client.post(
      `/v1/events/${eventId}/register`,
      body,
      { headers: { 'Idempotency-Key': payload.idempotencyKey } },
    );
    return r.data.data;
  },

  reserve: async (
    eventId: string,
    quantity: number,
    idempotencyKey: string,
    extras?: ReserveExtras,
  ): Promise<{ reservationId: string; razorpayOrderId: string; paymentSessionId?: string; amountPaise: number }> => {
    const body: Record<string, unknown> = { quantity };
    if (extras?.answers?.length) body.answers = extras.answers;
    if (extras?.spotId) body.spotId = extras.spotId;
    if (extras?.dpdpConsent) {
      body.dpdpConsent = true;
      body.consentVersion = extras.consentVersion ?? DPDP_CONSENT_VERSION;
    }
    const r = await client.post(
      `/v1/events/${eventId}/reserve`,
      body,
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
    return r.data.data;
  },

  /**
   * DEV-ONLY mock payment: confirm a reserved hold as paid without a real Cashfree charge.
   * Called by openEventCheckout when the backend is in CASHFREE_DEV_MODE (the reserve response's
   * paymentSessionId starts with `session_dev_`). The backend route is itself dev-gated → 404 in
   * production, so this never results in a real registration there. `orderId` is the hold's
   * razorpayOrderId.
   */
  devConfirmReservation: async (orderId: string): Promise<void> => {
    await client.post(`/v1/reservations/${encodeURIComponent(orderId)}/dev-confirm`, {});
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

// ─────────────────────────────────────────────────────────────────────────────
// Host registration-request review (§6a-c/d/e) — approve/decline + full roster.
//
// Appended as standalone exported functions (not folded into the `eventService`
// object above) so this file stays merge-safe against the concurrent register-flow
// edits landing in the same object literal. They share the module-scoped `client`,
// so the Bearer token + base URL are applied exactly as for every other call.
// ─────────────────────────────────────────────────────────────────────────────

/** One answer to a host custom question, snapshotted on the registration (roster view). */
export interface RosterAnswer {
  questionId?: string;
  label: string;
  type?: string;
  value: string;
}

/** Apply-with-work submission on an apply-door request (roster view). */
export interface RosterApplication {
  pitch?: string;
  links?: string[];
  mediaIds?: string[];
}

/** One roster row (toRow in events-service registrations.getEventRoster). */
export interface EventRosterRow {
  _id: string;
  userId: string;
  name: string;
  phone?: string;
  seats: number;                 // = registration.quantity
  registeredAt?: string;         // request/registration time (pending rows sort newest-first)
  joinedAt?: string;             // waitlist entries only
  position?: number;             // waitlist entries only
  status: string;                // pending | approved | registered | attended | cancelled | declined | no-show
  visibility?: 'public' | 'private';
  spotId?: string;               // chosen ticket tier (event.spots[i]._id), when set
  answers?: RosterAnswer[];      // answers to the host's custom questions
  application?: RosterApplication; // apply-door pitch/links
}

/**
 * The host roster, bucketed by status. `requests` = pending guest_list/apply
 * requests awaiting the host's decision (newest first); `approved` = approved PAID
 * requests holding a seat while the attendee pays within 48h. Legacy 3-bucket
 * callers keep reading confirmed/waitlist/cancelled + counts unchanged.
 */
export interface EventRosterData {
  confirmed: EventRosterRow[];
  requests: EventRosterRow[];
  approved: EventRosterRow[];
  waitlist: EventRosterRow[];
  cancelled: EventRosterRow[];
  declined: EventRosterRow[];
  counts: {
    confirmed: number;
    requests: number;
    approved: number;
    waitlist: number;
    cancelled: number;
    declined: number;
  };
}

const EMPTY_ROSTER: EventRosterData = {
  confirmed: [], requests: [], approved: [], waitlist: [], cancelled: [], declined: [],
  counts: { confirmed: 0, requests: 0, approved: 0, waitlist: 0, cancelled: 0, declined: 0 },
};

/**
 * GET /v1/events/:id/roster (host only). Normalises to the full bucketed shape.
 * Tolerates the pre-approval-trio backend (3 buckets / legacy `{rows,total}`) by
 * defaulting the new buckets to empty, and a 404 (no roster yet) → empty roster.
 */
export async function getEventRoster(eventId: string): Promise<EventRosterData> {
  try {
    const r = await client.get(`/v1/events/${eventId}/roster`);
    const d = r.data?.data ?? {};
    // Legacy {rows,total} shape (oldest backend) — treat rows as confirmed.
    if (!d.counts && Array.isArray(d.rows)) {
      return {
        ...EMPTY_ROSTER,
        confirmed: d.rows,
        counts: { ...EMPTY_ROSTER.counts, confirmed: d.rows.length },
      };
    }
    const confirmed = d.confirmed ?? [];
    const requests = d.requests ?? [];
    const approved = d.approved ?? [];
    const waitlist = d.waitlist ?? [];
    const cancelled = d.cancelled ?? [];
    const declined = d.declined ?? [];
    return {
      confirmed, requests, approved, waitlist, cancelled, declined,
      counts: {
        confirmed: d.counts?.confirmed ?? confirmed.length,
        requests: d.counts?.requests ?? requests.length,
        approved: d.counts?.approved ?? approved.length,
        waitlist: d.counts?.waitlist ?? waitlist.length,
        cancelled: d.counts?.cancelled ?? cancelled.length,
        declined: d.counts?.declined ?? declined.length,
      },
    };
  } catch (err: any) {
    if (err?.response?.status === 404) return EMPTY_ROSTER;
    throw err;
  }
}

/** The 48h pay hold handed back when a PAID request is approved (§6a-e). */
export interface ApprovalPayment {
  reservationId: string;
  razorpayOrderId?: string;
  amountPaise: number;
  payBy: string;
}

export interface ApproveResult {
  /** 'registered' (free → ticket issued) or 'approved' (paid → awaiting payment). */
  status: string;
  payment?: ApprovalPayment;
}

/**
 * POST /v1/registrations/:id/approve (host only). Idempotent.
 * Free request → `registered` (+ ticket); paid request → `approved` + a 48h pay
 * hold. Throws on 409 (full / payout not set up / not pending) and 403 (not host);
 * callers read err.response.status + err.response.data.meta.message.
 */
export async function approveRegistration(registrationId: string): Promise<ApproveResult> {
  const r = await client.post(`/v1/registrations/${registrationId}/approve`);
  const d = r.data?.data ?? {};
  return { status: d.status, payment: d.payment };
}

/**
 * POST /v1/registrations/:id/decline (host only), with an optional reason.
 * → `declined` (no ticket). Throws on 409 (not pending) and 403 (not host).
 */
export async function declineRegistration(
  registrationId: string,
  reason?: string,
): Promise<{ status: string }> {
  const body = reason && reason.trim() ? { reason: reason.trim() } : {};
  const r = await client.post(`/v1/registrations/${registrationId}/decline`, body);
  const d = r.data?.data ?? {};
  return { status: d.status };
}

/**
 * Pull a human-readable message off a failed approve/decline call. Surfaces the
 * backend's own copy ('Event is full', 'Organizer payout not set up', …) with
 * sensible fallbacks for the two gate cases the Requests UI must handle.
 */
export function approvalErrorMessage(err: any, action: 'approve' | 'decline'): string {
  const status = err?.response?.status;
  const serverMsg: string | undefined = err?.response?.data?.meta?.message;
  if (status === 403) return "You're not the host of this event.";
  if (status === 409) {
    if (serverMsg) return serverMsg;
    return action === 'approve' ? "Event is full — can't approve more." : 'This request is no longer pending.';
  }
  if (status === 404) return 'That request no longer exists.';
  return serverMsg || `Could not ${action} the request. Please try again.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Host hub thin wrappers — waitlist promote, publish, registration-status.
//
// Standalone exports (not folded into the `eventService` object) so they stay
// merge-safe against concurrent edits to that literal, exactly like approve/
// decline above. Each endpoint already exists and is owner-gated server-side
// (netsaa-backend #34 closed the IDOR cluster, publishEvent included); the inline
// ownership check is the real gate, so these are plain `protect`-path POSTs.
// ─────────────────────────────────────────────────────────────────────────────

/** The promoted top-of-queue entry handed back by waitlist/promote (shape kept loose — only the 409 matters to the UI). */
export interface WaitlistPromoteResult {
  status?: string;
  registrationId?: string;
  entryId?: string;
}

/**
 * POST /v1/events/:id/waitlist/promote (host only). Promotes the TOP `waiting`
 * entry — and ONLY if a seat is free, else the backend 409s. Callers read
 * err.response.status === 409 to surface "no free seat" inline (see
 * waitlistPromoteErrorMessage).
 */
export async function promoteWaitlist(eventId: string): Promise<WaitlistPromoteResult> {
  const r = await client.post(`/v1/events/${eventId}/waitlist/promote`);
  return r.data?.data ?? {};
}

/** Human-readable message off a failed waitlist/promote — 409 = no seat free, 403 = not host. */
export function waitlistPromoteErrorMessage(err: any): string {
  const status = err?.response?.status;
  const serverMsg: string | undefined = err?.response?.data?.meta?.message;
  if (status === 403) return "You're not the host of this event.";
  if (status === 409) return serverMsg || 'No free seat to promote into yet.';
  if (status === 404) return 'No one is on the waitlist to promote.';
  return serverMsg || 'Could not promote from the waitlist. Please try again.';
}

/**
 * POST /v1/events/:id/publish (host only). Flips a draft → live. Returns the
 * updated event (or a thin { status }); the hook invalidates the detail query.
 */
export async function publishEvent(eventId: string): Promise<Partial<EventDoc>> {
  const r = await client.post(`/v1/events/${eventId}/publish`);
  return r.data?.data ?? {};
}

/** Valid organizer-set registration statuses from the roster (EventRegistration.status enum). */
export type RegistrationStatusUpdate = 'attended' | 'no-show' | 'cancelled';

/**
 * PATCH /v1/registrations/:id/status (host only). Used by the attendee sheet's
 * "Mark no-show". NB: this flips the REGISTRATION only — it does not touch the
 * ticket, so it is deliberately NOT the manual-check-in path (that is B2, which
 * must flip the ticket too for de-dup). See MANAGE_EVENT_BACKEND_READINESS §3/§4.
 */
export async function updateRegistrationStatus(
  registrationId: string,
  status: RegistrationStatusUpdate,
): Promise<{ status: string }> {
  const r = await client.patch(`/v1/registrations/${registrationId}/status`, { status });
  const d = r.data?.data ?? {};
  return { status: d.status ?? status };
}

/** Result of a manual per-registration check-in (netsaa-backend #35, B2). */
export interface CheckInByRegistrationResult {
  registrationId: string;
  status: string;          // 'attended'
  method?: string;         // 'manual'
  checkedInAt?: string;
}

/**
 * POST /v1/events/:id/registrations/:registrationId/check-in (host only, no body).
 * The one-tap manual check-in the attendee sheet / Checked-in spine needs: it flips
 * the registration → attended AND its ticket(s) → checked_in (unlike
 * updateRegistrationStatus, which is registration-only). 409 on a repeat or a reg
 * not in a checkable status — surfaced via checkInErrorMessage.
 */
export async function checkInByRegistration(
  eventId: string,
  registrationId: string,
): Promise<CheckInByRegistrationResult> {
  const r = await client.post(`/v1/events/${eventId}/registrations/${registrationId}/check-in`);
  return r.data?.data ?? {};
}

/** Human-readable message off a failed manual check-in — 409 = already in / not checkable, 403 = not host. */
export function checkInErrorMessage(err: any): string {
  const status = err?.response?.status;
  const serverMsg: string | undefined = err?.response?.data?.meta?.message;
  if (status === 403) return "You're not the host of this event.";
  if (status === 409) return serverMsg || 'This attendee can’t be checked in right now.';
  if (status === 404) return 'That registration no longer exists.';
  return serverMsg || 'Could not check this attendee in. Please try again.';
}

/** The refund leg of an organizer per-attendee cancel — null for a free registration (no money moved). */
export interface RegistrationCancelRefund {
  refundAmountPaise: number;
  netsaAbsorbedPaise: number;
  status: string;          // e.g. 'pending' (Cashfree settles async)
}
/** Result of an organizer cancelling + refunding one attendee (netsaa-backend #35, B1). */
export interface RegistrationCancelResult {
  registrationId: string;
  status: string;          // 'cancelled'
  seatFreed: boolean;
  refund: RegistrationCancelRefund | null;  // null = free reg, nothing to refund
}

/**
 * POST /v1/events/:id/registrations/:registrationId/cancel (host only), body { reason }.
 * Flips the registration → cancelled, voids its ticket(s) and frees the seat; a PAID
 * reg also gets a pending Cashfree refund (settles async), a free one gets refund:null.
 * Pay-as-fact: the UI reads only whether a refund exists, never its amounts.
 */
export async function cancelRegistrationByOrganizer(
  eventId: string,
  registrationId: string,
  reason: string,
): Promise<RegistrationCancelResult> {
  const body = reason && reason.trim() ? { reason: reason.trim() } : {};
  const r = await client.post(`/v1/events/${eventId}/registrations/${registrationId}/cancel`, body);
  return r.data?.data ?? {};
}

/** Human-readable message off a failed per-attendee cancel — 409 = not cancellable, 403 = not host. */
export function cancelRegistrationErrorMessage(err: any): string {
  const status = err?.response?.status;
  const serverMsg: string | undefined = err?.response?.data?.meta?.message;
  if (status === 403) return "You're not the host of this event.";
  if (status === 409) return serverMsg || 'This attendee can’t be cancelled right now.';
  if (status === 404) return 'That registration no longer exists.';
  return serverMsg || 'Could not cancel this attendee. Please try again.';
}
