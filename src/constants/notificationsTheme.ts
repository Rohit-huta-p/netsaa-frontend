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
