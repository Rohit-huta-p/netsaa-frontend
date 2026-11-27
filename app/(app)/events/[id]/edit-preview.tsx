import { useLocalSearchParams, Redirect, Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useEvent } from '@/hooks/useEvents';
import { useAuthStore } from '@/stores/authStore';
import { EVENT_EDIT_IN_PREVIEW } from '@/lib/constants';
import EventEditInPreview from '@/components/events/detail/edit/EventEditInPreview';

const CANVAS = '#121216';
const ORANGE = '#FF6B35';

/**
 * Host "Edit in Preview" route. Guarded: the flag must be on (else fall back to the
 * composer wizard) and the viewer must be the organizer (same check as the detail
 * route). EventEditInPreview owns the fetch/hydrate/auto-save.
 */
export default function EditEventInPreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id);
  const userId = useAuthStore((s) => s.user?._id);

  // Flag off → the old composer edit path is the working fallback.
  if (!EVENT_EDIT_IN_PREVIEW) return <Redirect href={`/events/${id}/edit` as any} />;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: CANVAS, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={ORANGE} />
      </View>
    );
  }
  if (!event) return <Redirect href={`/events/${id}` as any} />;

  const organizerId = typeof event.organizerId === 'string' ? event.organizerId : event.organizerId?._id;
  if (!(organizerId && userId && organizerId === userId)) {
    return <Redirect href={`/events/${id}` as any} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: CANVAS }}>
      <Stack.Screen options={{ headerShown: false }} />
      <EventEditInPreview eventId={id} />
    </View>
  );
}
