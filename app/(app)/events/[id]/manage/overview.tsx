/**
 * Event manage / Overview — the A·Minimal host hub.
 *
 * Replaces the warm "Living Poster" overview (PosterHero / RoomStats / ViewerMirror
 * / BackstageActions / StageDoorDiscussion on #060509) with the managing-POV hub
 * that mirrors Manage-Gig: an attendee-lifecycle spine (Requests · Going · Waitlist
 * · Checked-in) over the #121216 canvas. All composition, state and the reused
 * sheets live in EventHostHub, powered by useEventHubData.
 *
 * Reached via <Redirect> from the event's detail route when the viewer is the
 * organizer (app/(app)/events/[id]/index.tsx), so ownership is already gated here
 * and server-side on every endpoint the hub calls.
 *
 * Mockup: DOCS/04-design/mockups/manage-event-aminimal.html
 * Spec:   DOCS/03-features/events/MANAGE_EVENT_BACKEND_READINESS.md
 */
import { useLocalSearchParams } from 'expo-router';
import EventHostHub from '@/components/events/manage/EventHostHub';

export default function OverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id) return null;
  return <EventHostHub eventId={id} />;
}
