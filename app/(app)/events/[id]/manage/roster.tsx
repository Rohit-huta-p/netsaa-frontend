// app/(app)/events/[id]/manage/roster.tsx
//
// Retired. The roster is superseded by the See-all attendee list (manage/attendees),
// which searches name/phone across every group — not just Confirmed/Waitlist/Cancelled
// — plus sorts and pagination. Any lingering deep-link lands on the Confirmed group.
// (RosterList.tsx / RosterRow.tsx are now unimported; a follow-up removes them.)
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function RosterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id) return null;
  return <Redirect href={`/events/${id}/manage/attendees?stage=confirmed` as any} />;
}
