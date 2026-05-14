import { eventTokens } from '@/constants/themeColors';

export type EventStatus = 'draft' | 'pending_review' | 'live' | 'cancelled' | 'completed';
export type RegistrationMode = 'free_rsvp' | 'paid_ticket';
export type LocationKind = 'in_person' | 'online';
export type DurationKind = 'm30' | 'h1' | 'h2' | 'h3' | 'half' | 'full' | 'multi';

export const eventStatusLabel: Record<EventStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending review',
  live: 'Live',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

export const eventStatusColor: Record<EventStatus, string> = {
  draft: eventTokens.textSecondary,
  pending_review: eventTokens.gold,
  live: eventTokens.brand,
  cancelled: eventTokens.capacityUrgent,
  completed: eventTokens.textMuted ?? '#6E6C76',
};

export const durationKindLabel: Record<DurationKind, string> = {
  m30: '30 min',
  h1: '1 hr',
  h2: '2 hr',
  h3: '3 hr',
  half: 'Half day',
  full: 'Full day',
  multi: 'Multi-day',
};

export const CAPACITY_URGENCY_THRESHOLD = 0.9;

export function isCapacityUrgent(total: number, registered: number): boolean {
  if (total <= 0) return false;
  return registered / total >= CAPACITY_URGENCY_THRESHOLD;
}

export function computeSlotsLeft(total: number, registered: number): number {
  return Math.max(0, total - registered);
}

export { eventTokens };
