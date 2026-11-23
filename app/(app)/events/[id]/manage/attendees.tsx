// app/(app)/events/[id]/manage/attendees.tsx
//
// "See all" — the full paginated attendee list for a hosted event, pushed from the
// host hub's capped stage previews. Reads ?stage to land on the group the host tapped
// and ?q to carry a search across. A manage/* Stack screen (headerless); the screen
// renders its own back affordance. Ownership is gated upstream (the organizer redirect
// into manage/*) and server-side on the roster endpoint, like the hub.
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import EventAttendeesAllScreen from '@/components/events/manage/EventAttendeesAllScreen';
import type { AttendeeGroup } from '@/components/events/manage/rosterFilters';

const GROUPS: string[] = ['requests', 'awaitingpay', 'confirmed', 'waitlist', 'checkedin', 'cancelled'];

export default function AttendeesRoute() {
  const params = useLocalSearchParams<{ id?: string | string[]; stage?: string | string[]; q?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const rawStage = Array.isArray(params.stage) ? params.stage[0] : params.stage;
  const stage = GROUPS.includes(rawStage ?? '') ? (rawStage as AttendeeGroup) : undefined;
  const rawQ = Array.isArray(params.q) ? params.q[0] : params.q;
  if (!id) return null;
  return <EventAttendeesAllScreen eventId={id} initialStage={stage} initialName={rawQ ?? ''} />;
}
