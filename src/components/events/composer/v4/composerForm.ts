/**
 * v4 composer form + payload contract.
 *
 * `ComposerFormV4` is what the UI holds. `buildEventPayload` is a PURE function
 * (no store, no network) that maps it to the POST /v1/events body matching the
 * v4 Event schema — the single contract the screens and the backend agree on.
 * Mirrors the gig form's buildBackendPayload pattern.
 */
import { presetFor, type EventTypeKey, type DoorPolicy, type DescribeSection } from './eventTypePresets';

export interface MediaItemV4 {
  kind: 'photo' | 'video';
  url: string;
  thumbnailUrl?: string;
  width?: number; height?: number;
  isHero?: boolean; sortOrder?: number;
  uploadId?: string; muxPlaybackId?: string; status?: 'processing' | 'ready' | 'errored';
  duration?: number; aspectRatio?: string;   // video only — filled by the Mux status poll
}
export interface PersonV4 { userId?: string; displayName: string; role: string; avatarUrl?: string; invited?: boolean }
export interface SpotV4 { id: string; name: string; note?: string; capacity: number; price: number } // price 0 = free
export interface OfferV4 {
  id: string; spotId?: string; name: string; price: number;
  audience: 'everyone' | 'group'; endsAt?: string | null; seatLimit?: number | null; minSeats?: number | null;
}
export interface QuestionV4 {
  id: string; label: string; type: 'text' | 'choice' | 'link' | 'photo' | 'yes_no';
  options?: string[]; required: boolean; spotIds?: string[];
}
export interface LineupItemV4 { when?: string; title: string; detail?: string }
export type RefundPolicyV4 = 'flex_24h' | 'firm' | 'custom';
export type SkillLevelV4 = 'all' | 'beginner' | 'intermediate' | 'advanced';

export interface ComposerFormV4 {
  // step 1 — the event
  eventType: string;                 // a preset key, or a typed-in label
  eventTypeLabel?: string;
  title: string;
  whoFor: string[];                  // listed artist types
  otherArtistTypes: string[];        // typed-in artist types
  openToAll: boolean;
  level: SkillLevelV4;
  styles: string[];                  // topicTags
  languages: string[];
  people: PersonV4[];
  // step 2 — when & where
  startsAt: string | null;
  endsAt: string | null;
  timeTbd: boolean;
  durationKind: string | null;
  format: 'in_person' | 'online';
  location: {
    venueName?: string; address?: string; city?: string; state?: string;
    landmark?: string; hideAddress?: boolean;
    onlinePlatform?: string; meetingLink?: string; meetingLinkRevealAt?: 'on_register' | 'T-24h' | 'T-1h';
  };
  // step 3 — spots
  paid: boolean;
  spots: SpotV4[];
  offers: OfferV4[];
  refundPolicy: RefundPolicyV4;
  refundFullUntil?: string | null;
  refundPartialUntil?: string | null;
  refundPartialPercent?: number | null;
  refundNote?: string;
  // step 4 — registration
  door: DoorPolicy;
  questions: QuestionV4[];
  ageRestriction: number | null;     // 0 | 16 | 18 | 21
  // step 5 — describe
  cover?: MediaItemV4 | null;
  coverFit: 'whole' | 'fill';
  about: string;
  tagline?: string;
  lineup: LineupItemV4[];
  bring: { items: string[]; note?: string };
  included: string[];
  photos: MediaItemV4[];
  videos: MediaItemV4[];
  // step 6 — publish
  visibility: 'public' | 'unlisted' | 'private';
}

const PRESET_KEYS = new Set<string>(['workshop', 'masterclass', 'audition', 'open_mic', 'competition', 'performance', 'screening', 'meetup', 'other']);
const isPresetType = (t: string) => PRESET_KEYS.has(t);

const ONE_DAY = 86400000;

/** A fresh form seeded from a type's preset (suggestions/defaults only). */
export function initialFormV4(type: string = 'workshop'): ComposerFormV4 {
  const preset = presetFor(type);
  return {
    eventType: type,
    eventTypeLabel: isPresetType(type) ? undefined : type,
    title: '',
    whoFor: [], otherArtistTypes: [], openToAll: false, level: 'all', styles: [], languages: [],
    people: [],
    startsAt: null, endsAt: null, timeTbd: false, durationKind: null, format: 'in_person', location: {},
    paid: false,
    // One ticket type per event (kept simple): a single invisible spot the
    // backend derives capacity/price from. Not seeded per type anymore.
    spots: [{ id: 'spot-0', name: 'General', capacity: 20, price: 0 }],
    offers: [],
    refundPolicy: 'flex_24h',
    door: preset.defaultDoor,
    questions: [], ageRestriction: null,
    cover: null, coverFit: 'whole', about: '', tagline: '',
    lineup: [], bring: { items: [] }, included: [],
    photos: [],
    videos: [],
    visibility: 'public',
  };
}

function lowestPaidSpotPrice(spots: Array<{ price: number }>): number {
  const paid = spots.map((s) => s.price).filter((p) => p > 0);
  return paid.length ? Math.min(...paid) : 0;
}

function deriveCancellationPolicy(form: ComposerFormV4): Record<string, any> | undefined {
  if (form.refundPolicy === 'flex_24h') {
    const until = form.startsAt ? new Date(new Date(form.startsAt).getTime() - ONE_DAY).toISOString() : undefined;
    return { fullRefundUntil: until, notes: 'Full refund up to 24h before the event.' };
  }
  if (form.refundPolicy === 'firm') return { notes: 'No refunds once registered.' };
  // custom — a STRUCTURED window, not free prose (E10), so refunds are computable
  return {
    fullRefundUntil: form.refundFullUntil || undefined,
    partialRefundUntil: form.refundPartialUntil || undefined,
    partialRefundPercent: form.refundPartialPercent ?? undefined,
    notes: form.refundNote || undefined,
  };
}

function buildLocation(form: ComposerFormV4): Record<string, any> {
  const L = form.location;
  if (form.format === 'online') {
    return { kind: 'online', onlinePlatform: L.onlinePlatform, meetingLink: L.meetingLink, meetingLinkRevealAt: L.meetingLinkRevealAt };
  }
  return {
    kind: 'in_person',
    venueName: L.venueName, address: L.address, city: L.city, state: L.state,
    landmark: L.landmark, hideAddress: !!L.hideAddress,
  };
}

function buildMedia(form: ComposerFormV4): MediaItemV4[] {
  const out: MediaItemV4[] = [];
  if (form.cover) out.push({ ...form.cover, isHero: true, sortOrder: 0 });
  form.photos.forEach((m, i) => out.push({ ...m, isHero: false, sortOrder: i + 1 }));
  // Videos ride after the photos. Only persist a reel that finished processing on
  // Mux (has a playbackId) — a still-processing or errored reel never reaches the
  // event doc, where nothing would later flip it to ready (publish is gated on this too).
  const base = form.photos.length + 1;
  form.videos
    .filter((v) => v.status === 'ready' && v.muxPlaybackId)
    .forEach((v, i) => out.push({ ...v, kind: 'video', isHero: false, sortOrder: base + i }));
  return out;
}

/** Map the form to the POST /v1/events body (v4 schema). Pure. */
export function buildEventPayload(form: ComposerFormV4): Record<string, any> {
  const paid = form.paid;
  // clientId carries each spot's identity to the backend, which turns it into a
  // stable _id (preserved on edit). Offers reference a spot by that same id.
  const spots = form.spots.map((s) => ({ clientId: s.id, name: s.name, note: s.note || undefined, capacity: s.capacity, price: paid ? s.price : 0 }));
  const spotIds = new Set(form.spots.map((s) => s.id));
  const offers = paid
    ? form.offers.map((o) => ({ spotId: o.spotId && spotIds.has(o.spotId) ? o.spotId : undefined, name: o.name, price: o.price, audience: o.audience, endsAt: o.endsAt || undefined, seatLimit: o.seatLimit ?? undefined, minSeats: o.minSeats ?? undefined }))
    : [];
  const capacityTotal = spots.reduce((sum, s) => sum + (s.capacity || 0), 0);

  return {
    eventType: isPresetType(form.eventType) ? form.eventType : 'other',
    eventTypeLabel: isPresetType(form.eventType) ? undefined : (form.eventTypeLabel || form.eventType),
    title: form.title.trim(),
    eligibleArtistTypes: form.openToAll ? [] : form.whoFor,
    otherArtistTypes: form.otherArtistTypes,
    openToAll: form.openToAll,
    skillLevel: form.level,
    topicTags: form.styles,
    languages: form.languages,
    language: form.languages[0] || 'en',
    people: form.people.map((p) => ({ userId: p.userId, displayName: p.displayName, role: p.role, avatarUrl: p.avatarUrl, invite: p.invited ? { status: 'invited' } : undefined })),

    startsAt: form.startsAt || undefined,
    endsAt: form.endsAt || undefined,
    timeTbd: form.timeTbd,
    durationKind: form.durationKind || undefined,
    location: buildLocation(form),

    registrationMode: paid ? 'paid_ticket' : 'free_rsvp',
    spots,
    offers,
    capacity: { total: capacityTotal },           // backend also re-derives from spots
    pricing: paid ? { amount: lowestPaidSpotPrice(spots), currency: 'INR', refundPolicy: form.refundPolicy } : undefined,
    refundPolicy: paid ? form.refundPolicy : undefined,
    cancellationPolicy: paid ? deriveCancellationPolicy(form) : undefined,

    registration: {
      door: form.door,
      questions: form.questions.map((q) => ({
        label: q.label, type: q.type,
        options: q.type === 'choice' ? (q.options || []) : undefined,
        required: !!q.required, spotIds: q.spotIds,
      })),
    },
    requiresApproval: form.door !== 'open',
    ageRestriction: form.ageRestriction ?? undefined,

    about: form.about.trim(),
    tagline: form.tagline || undefined,
    coverFit: form.coverFit,
    lineup: form.lineup.filter((l) => l.title.trim()).map((l) => ({ when: l.when || undefined, title: l.title, detail: l.detail || undefined })),
    bring: (form.bring.items.length || form.bring.note) ? { items: form.bring.items, note: form.bring.note || undefined } : undefined,
    included: form.included.filter(Boolean),
    media: buildMedia(form),

    visibility: form.visibility,
  };
}

/**
 * Inverse of buildEventPayload: hydrate the form from an existing event (edit mode).
 * Reads the v4 embedded fields defensively (`any`) since the shared EventDoc type
 * doesn't carry them yet. Lossy only for the refund enum, which is re-derived
 * heuristically from the stored cancellationPolicy.
 */
export function eventToForm(e: any): Partial<ComposerFormV4> {
  const paid = e?.registrationMode === 'paid_ticket';

  // Collapse any event to a single ticket type: total capacity + its one price.
  // (The composer is one-ticket now; a legacy multi-spot event folds down, keeping
  // the first spot's _id so its identity is preserved on save.)
  const firstSpot = Array.isArray(e?.spots) && e.spots.length ? e.spots[0] : undefined;
  const totalCap = Number(e?.capacity?.total)
    || (Array.isArray(e?.spots) ? e.spots.reduce((n: number, s: any) => n + (Number(s.capacity) || 0), 0) : 0)
    || 20;
  const spots: SpotV4[] = [{
    id: String(firstSpot?._id || 'spot-0'),
    name: firstSpot?.name || 'General',
    capacity: totalCap,
    price: paid ? (Number(e?.pricing?.amount ?? e?.ticketPrice ?? firstSpot?.price) || 0) : 0,
  }];

  const offers: OfferV4[] = Array.isArray(e?.offers) ? e.offers.map((o: any, i: number) => ({
    id: String(o._id || `offer-${i}`), spotId: o.spotId ? String(o.spotId) : undefined,
    name: o.name || '', price: Number(o.price) || 0, audience: o.audience === 'group' ? 'group' : 'everyone',
    endsAt: o.endsAt ?? null, seatLimit: o.seatLimit ?? null, minSeats: o.minSeats ?? null,
  })) : [];

  const questions: QuestionV4[] = Array.isArray(e?.registration?.questions) ? e.registration.questions.map((q: any, i: number) => ({
    id: String(q._id || `q-${i}`), label: q.label || '', type: q.type || 'text',
    options: q.options, required: !!q.required, spotIds: Array.isArray(q.spotIds) ? q.spotIds.map(String) : undefined,
  })) : [];

  // refund enum ← cancellationPolicy (heuristic; organizer can re-confirm)
  const cp = e?.cancellationPolicy;
  let refundPolicy: RefundPolicyV4 = 'flex_24h';
  if (cp) {
    if (cp.partialRefundUntil || cp.partialRefundPercent != null) refundPolicy = 'custom';
    else if (typeof cp.notes === 'string' && /no refund/i.test(cp.notes)) refundPolicy = 'firm';
    else refundPolicy = 'flex_24h';
  }

  const media: MediaItemV4[] = Array.isArray(e?.media) ? e.media : [];
  const videos = media.filter((m) => m.kind === 'video');
  const imgs = media.filter((m) => m.kind !== 'video');   // undefined kind = legacy photo
  const cover = imgs.find((m) => m.isHero) || null;
  const photos = imgs.filter((m) => !m.isHero);

  const presetKey = isPresetType(e?.eventType) ? e.eventType : undefined;
  return {
    eventType: e?.eventTypeLabel || presetKey || e?.eventType || 'workshop',
    eventTypeLabel: e?.eventTypeLabel || undefined,
    title: e?.title || '',
    whoFor: Array.isArray(e?.eligibleArtistTypes) ? e.eligibleArtistTypes : [],
    otherArtistTypes: Array.isArray(e?.otherArtistTypes) ? e.otherArtistTypes : [],
    openToAll: !!e?.openToAll,
    level: (e?.skillLevel as SkillLevelV4) || 'all',
    styles: Array.isArray(e?.topicTags) ? e.topicTags : [],
    languages: Array.isArray(e?.languages) && e.languages.length ? e.languages : (e?.language ? [e.language] : []),
    people: Array.isArray(e?.people) ? e.people.map((p: any) => ({
      userId: p.userId ? String(p.userId) : undefined, displayName: p.displayName || '', role: p.role || '',
      avatarUrl: p.avatarUrl, invited: p.invite?.status === 'invited',
    })) : [],

    startsAt: e?.startsAt || null,
    endsAt: e?.endsAt || null,
    timeTbd: !!e?.timeTbd,
    durationKind: e?.durationKind || null,
    format: e?.location?.kind === 'online' ? 'online' : 'in_person',
    location: {
      venueName: e?.location?.venueName, address: e?.location?.address, city: e?.location?.city, state: e?.location?.state,
      landmark: e?.location?.landmark, hideAddress: e?.location?.hideAddress,
      onlinePlatform: e?.location?.onlinePlatform, meetingLink: e?.location?.meetingLink, meetingLinkRevealAt: e?.location?.meetingLinkRevealAt,
    },

    paid,
    spots,
    offers,
    refundPolicy,
    refundFullUntil: cp?.fullRefundUntil ?? null,
    refundPartialUntil: cp?.partialRefundUntil ?? null,
    refundPartialPercent: cp?.partialRefundPercent ?? null,
    refundNote: cp?.notes || undefined,

    door: e?.registration?.door || 'open',
    questions,
    ageRestriction: e?.ageRestriction ?? null,

    cover,
    coverFit: e?.coverFit === 'fill' ? 'fill' : 'whole',
    about: e?.about || '',
    tagline: e?.tagline || '',
    lineup: Array.isArray(e?.lineup) ? e.lineup.map((l: any) => ({ when: l.when, title: l.title || '', detail: l.detail })) : [],
    bring: e?.bring ? { items: Array.isArray(e.bring.items) ? e.bring.items : [], note: e.bring.note } : { items: [] },
    included: Array.isArray(e?.included) ? e.included : [],
    photos,
    videos,

    visibility: e?.visibility || 'public',
  };
}
