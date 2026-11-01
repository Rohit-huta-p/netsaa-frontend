// src/constants/notificationsTheme.ts
// Design tokens + restrained-semantic config for the notifications screen.
// Palette = locked A·Minimal (shared with gig board / CL home / artist home).
// Pure module — no RN imports beyond the lucide icon components used in the
// visual config. Mockup: DOCS/04-design/mockups/notifications-aminimal.html.
import {
  Briefcase, BadgeCheck, Clock, CalendarCheck, Calendar, MessageCircle,
  UserPlus, UserCheck, Banknote, Ban, MinusCircle, FileText, Settings,
  Sparkles, Star, Bell, Eye, type LucideIcon,
} from 'lucide-react-native';
import type { Notification } from '@/stores/notificationsStore';

/* ── palette: locked A·Minimal (same tokens as gig board / CL home / artist home) ── */
export const N = {
  bg0: '#0E0E12', bg1: '#121216', bg2: '#1C1C23', bg3: '#212129',
  hairline: 'rgba(255,255,255,0.06)', hairline2: 'rgba(255,255,255,0.10)',
  text0: '#FFFFFF', text1: '#D4D4D8', text2: '#A1A1AA', text3: '#8B8B99', text4: '#6B6B78',
  orange: '#FF6B35', orangeSoft: 'rgba(255,107,53,0.12)', orangeLine: 'rgba(255,107,53,0.30)', orangeInk: '#190B05',
  green: '#22C55E', amber: '#F59E0B', red: '#EF4444', purple: '#8B5CF6',
  greenSoft: 'rgba(34,197,94,0.12)', amberSoft: 'rgba(245,158,11,0.12)',
  redSoft: 'rgba(239,68,68,0.12)', purpleSoft: 'rgba(139,92,246,0.12)', mutedSoft: 'rgba(161,161,170,0.10)',
} as const;

/* ── fonts (exact loaded family strings — see app/_layout.tsx) ── */
export const FONT = {
  serif: 'DMSerifDisplay_400Regular',
  reg: 'Outfit-Regular', med: 'Outfit-Medium', semi: 'Outfit-SemiBold', bold: 'Outfit-Bold',
  mono: 'SpaceMono-Regular', monoBold: 'SpaceMono-Bold',
} as const;

/* ── restrained-semantic: colour carries STATE, not type ── */
export type NotifSemantic = 'orange' | 'green' | 'amber' | 'red' | 'purple' | 'muted';
export const SEMANTIC: Record<NotifSemantic, { color: string; soft: string }> = {
  orange: { color: N.orange, soft: N.orangeSoft },
  green: { color: N.green, soft: N.greenSoft },
  amber: { color: N.amber, soft: N.amberSoft },
  red: { color: N.red, soft: N.redSoft },
  purple: { color: N.purple, soft: N.purpleSoft },
  muted: { color: N.text2, soft: N.mutedSoft },
};

export type NotifVisual = { semantic: NotifSemantic; Icon: LucideIcon; eyebrow?: string };

const BY_SUBTYPE: Record<string, NotifVisual> = {
  'connection.request': { semantic: 'orange', Icon: UserPlus },
  'connection.accepted': { semantic: 'green', Icon: UserCheck },
  'connection.rejected': { semantic: 'muted', Icon: MinusCircle },
  'message.new': { semantic: 'purple', Icon: MessageCircle },
  'message.mention': { semantic: 'purple', Icon: MessageCircle },
  'gig.application.received': { semantic: 'orange', Icon: Briefcase },
  'gig.application.shortlisted': { semantic: 'green', Icon: Star, eyebrow: 'Shortlisted' },
  'gig.application.hired': { semantic: 'green', Icon: BadgeCheck, eyebrow: 'Hired' },
  'gig.application.rejected': { semantic: 'muted', Icon: MinusCircle },
  'gig.cancelled': { semantic: 'red', Icon: Ban, eyebrow: 'Cancelled' },
  'gig.deadline.approaching': { semantic: 'amber', Icon: Clock, eyebrow: 'Deadline' },
  'event.registration.success': { semantic: 'green', Icon: CalendarCheck },
  'event.reservation.expiring': { semantic: 'amber', Icon: Clock, eyebrow: 'Expiring' },
  'event.cancelled': { semantic: 'red', Icon: Ban, eyebrow: 'Cancelled' },
  'event.updated': { semantic: 'amber', Icon: Calendar },
  'event.reminder': { semantic: 'amber', Icon: Calendar },
  'event.reservation.expired': { semantic: 'muted', Icon: Clock, eyebrow: 'Expired' },
  'payment.success': { semantic: 'green', Icon: Banknote },
  'payment.failed': { semantic: 'red', Icon: Banknote, eyebrow: 'Payment failed' },
  'payment.refund.initiated': { semantic: 'amber', Icon: Banknote, eyebrow: 'Refund started' },
  'payment.refund.completed': { semantic: 'green', Icon: Banknote, eyebrow: 'Refunded' },
  'contract.sent': { semantic: 'orange', Icon: FileText },
  'contract.signed': { semantic: 'green', Icon: FileText, eyebrow: 'Signed' },
  'contract.expired': { semantic: 'muted', Icon: FileText, eyebrow: 'Expired' },
  'contract.cancelled': { semantic: 'red', Icon: Ban, eyebrow: 'Cancelled' },
  'system.alert': { semantic: 'amber', Icon: Bell },
  'system.maintenance': { semantic: 'muted', Icon: Settings },
  'system.feature.announcement': { semantic: 'purple', Icon: Sparkles },
  'system.policy.update': { semantic: 'muted', Icon: FileText },
  'profile.viewed': { semantic: 'purple', Icon: Eye },
};

const BY_TYPE: Record<Notification['type'], NotifVisual> = {
  connection: { semantic: 'orange', Icon: UserPlus },
  message: { semantic: 'purple', Icon: MessageCircle },
  gig: { semantic: 'orange', Icon: Briefcase },
  event: { semantic: 'amber', Icon: Calendar },
  payment: { semantic: 'green', Icon: Banknote },
  contract: { semantic: 'orange', Icon: FileText },
  system: { semantic: 'muted', Icon: Settings },
  profile: { semantic: 'purple', Icon: Eye },
};

/** Resolve a notification to its icon + semantic colour (+ optional eyebrow).
 *  Exact subtype wins; else the coarse type; else a neutral bell. */
export function getNotifConfig(n: Pick<Notification, 'type' | 'subtype'>): NotifVisual {
  return BY_SUBTYPE[n.subtype] ?? BY_TYPE[n.type] ?? { semantic: 'muted', Icon: Bell };
}

/** First "quoted" entity in a string — the gig/event/contract name the backend
 *  embeds in a body like `Someone applied to your gig "Kathak lead"`. Returns ''
 *  if none. Coupled to the factory's current strings; if they change we just
 *  fall back to the full server body (safe — tidier copy, never broken). */
function firstQuoted(s: string): string {
  const m = s.match(/"([^"]+)"/);
  return m ? m[1].trim() : '';
}

/** Display copy (title + optional body) for a notification row.
 *
 *  The backend factory stores generic, name-less strings ("New Connection
 *  Request" / "Someone wants to connect with you") because the emitted event
 *  carries only an actorId, not a name. The client already has the populated
 *  actor (displayName) and the state eyebrow from getNotifConfig, so here we
 *  compose warmer, calmer copy:
 *    • person-actor types lead with the name ("{name} wants to connect");
 *    • state-eyebrow types (SHORTLISTED/HIRED/CANCELLED/…) let the eyebrow
 *      carry the state and put the gig/event name in the title;
 *    • money is stated plainly (pay-as-fact — no "Successful!" hype);
 *    • bodies keep the server's specifics (gig/event titles, ₹ amounts,
 *      ticket counts, reasons) since those live only in the server string.
 *  Anything without a case falls through to the server's own title/body.
 *
 *  Scope: IN-APP display only. Push/email copy still comes from the backend
 *  factory — matching it there needs the actor name + entity title plumbed into
 *  the event payload (backend follow-up). This switch is the single place to
 *  extend. */
export function resolveNotifCopy(n: Notification): { title: string; body?: string } {
  const actor = n.actorId && typeof n.actorId === 'object' ? n.actorId : null;
  const name = actor?.displayName?.trim();
  const serverTitle = (n.title || '').trim();
  const serverBody = (n.message || n.body || '').trim();
  const entity = firstQuoted(serverBody);   // gig / event / contract name, when present
  const body = serverBody || undefined;

  switch (n.subtype) {
    /* ── Network — a person acted, so lead with their name ── */
    case 'connection.request': {
      // Keep a real personal note from the requester; drop the generic fallback.
      const personal = /^someone wants to connect/i.test(serverBody) ? '' : serverBody;
      return {
        // Only override when we have a name — never downgrade good server copy.
        title: name ? `${name} wants to connect` : (serverTitle || 'New connection request'),
        body: personal || undefined,
      };
    }
    case 'connection.accepted':
      return {
        title: name ? `${name} accepted your request` : (serverTitle || 'Connection accepted'),
        body: 'Say hello to start the conversation.',
      };
    case 'connection.rejected':
      return { title: serverTitle || 'Connection request closed', body };
    case 'message.new':
    case 'message.mention':
      return { title: name ? `${name} sent you a message` : (serverTitle || 'New message'), body };
    case 'profile.viewed':
      return { title: name ? `${name} viewed your profile` : (serverTitle || 'Your profile got a view') };

    /* ── Gigs ── */
    case 'gig.application.received':
      // Hirer side; actor = applicant. Name leads, the gig becomes the detail.
      return { title: name ? `${name} applied to your gig` : (serverTitle || 'New application'), body: entity || body };
    case 'gig.application.shortlisted':   // eyebrow already reads SHORTLISTED
      return { title: entity || serverTitle || 'Application shortlisted' };
    case 'gig.application.hired':         // eyebrow already reads HIRED
      return { title: entity || serverTitle || 'You got the gig' };
    case 'gig.application.rejected':
      return { title: 'Not selected this time', body: entity || body };
    case 'gig.cancelled':                 // eyebrow CANCELLED — body keeps the reason
      return { title: entity || serverTitle || 'Gig cancelled', body };
    case 'gig.deadline.approaching':      // eyebrow DEADLINE
      return { title: entity || serverTitle || 'Deadline approaching', body };

    /* ── Events (eyebrow'd ones put the event name in the title) ── */
    case 'event.registration.success':
      return { title: 'Registration confirmed', body };
    case 'event.reservation.expiring':    // eyebrow EXPIRING — body keeps the countdown
      return { title: entity || serverTitle || 'Reservation expiring', body };
    case 'event.cancelled':               // eyebrow CANCELLED
      return { title: entity || serverTitle || 'Event cancelled', body };
    case 'event.updated':
      return { title: 'Event updated', body };
    case 'event.reminder':
      return { title: serverTitle || 'Event reminder', body };
    case 'event.reservation.expired':     // eyebrow EXPIRED
      return { title: entity || serverTitle || 'Reservation expired', body };

    /* ── Payments (pay-as-fact: money stated plainly, no hype) ── */
    case 'payment.success':
      return { title: 'Payment received', body };
    case 'payment.failed':                // eyebrow "Payment failed" — body keeps ₹ + reason
      return { title: serverTitle || 'Payment failed', body };
    case 'payment.refund.initiated':      // eyebrow "Refund started"
      return { title: serverTitle || 'Refund started', body };
    case 'payment.refund.completed':      // eyebrow "Refunded"
      return { title: serverTitle || 'Refund completed', body };

    /* ── Contracts ── */
    case 'contract.sent':
      return { title: name ? `${name} sent you a contract` : (serverTitle || 'New contract'), body: entity || body };
    case 'contract.signed':               // eyebrow SIGNED
      return { title: entity || serverTitle || 'Contract signed' };
    case 'contract.expired':              // eyebrow EXPIRED
      return { title: entity || serverTitle || 'Contract expired' };
    case 'contract.cancelled':            // eyebrow CANCELLED
      return { title: entity || serverTitle || 'Contract cancelled', body };

    /* ── System + anything untemplated: trust the server copy ── */
    default:
      return { title: serverTitle, body };
  }
}

/* ── category filter tabs ── */
export type NotifCategory = 'all' | 'gigs' | 'events' | 'network';
export const CATEGORY_TABS: { key: NotifCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'gigs', label: 'Gigs' },
  { key: 'events', label: 'Events' },
  { key: 'network', label: 'Network' },
];

// Single source of truth so counts and filtering can never disagree.
const TYPE_TO_CATEGORY: Record<Notification['type'], Exclude<NotifCategory, 'all'> | null> = {
  gig: 'gigs', contract: 'gigs', payment: 'gigs',
  event: 'events',
  connection: 'network', message: 'network', profile: 'network',
  system: null, // system notifications appear only under All
};

export function matchesCategory(n: Pick<Notification, 'type'>, cat: NotifCategory): boolean {
  return cat === 'all' ? true : TYPE_TO_CATEGORY[n.type] === cat;
}

export function filterByCategory(list: Notification[], cat: NotifCategory): Notification[] {
  return cat === 'all' ? list : list.filter((n) => matchesCategory(n, cat));
}

/** Bucket counts of the currently-loaded list. Honest: equals exactly what
 *  filtering to that tab shows. NOT a global total (would need an API aggregate). */
export function bucketCounts(list: Notification[]): Record<NotifCategory, number> {
  const c: Record<NotifCategory, number> = { all: list.length, gigs: 0, events: 0, network: 0 };
  for (const n of list) {
    const b = TYPE_TO_CATEGORY[n.type];
    if (b) c[b] += 1;
  }
  return c;
}

/** Compact relative stamp: "now", "5m", "3h", weekday, or "12 Jul". */
export function formatStamp(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  if (days < 7) return new Date(d).toLocaleDateString('en-IN', { weekday: 'short' });
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
