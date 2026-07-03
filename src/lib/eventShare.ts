import { Share } from 'react-native';
import type { EventDoc } from '@/services/eventService';

// Public web link for an event. Deep-linking is a fast-follow; this is the shareable URL.
export function eventPublicUrl(eventId: string): string {
  return `https://netsa.app/events/${eventId}`;
}

/** Native share sheet for an event. Swallows user-cancel. */
export async function shareEvent(event: Pick<EventDoc, '_id' | 'title'>): Promise<void> {
  try {
    await Share.share({
      message: `${event.title} on NETSA — ${eventPublicUrl(event._id)}`,
    });
  } catch {
    /* user dismissed — no-op */
  }
}
