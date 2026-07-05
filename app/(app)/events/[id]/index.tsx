import { useLocalSearchParams, Redirect, Stack } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { useEvent } from '@/hooks/useEvents';
import { useAuthStore } from '@/stores/authStore';
import EventDetailViewer from '@/components/events/detail/EventDetailViewer';

// v2 palette (event-detail-v2.html)
const BG = '#0B0A0F';
const TEXT_0 = '#F0ECE6';
const TEXT_2 = '#8C857B';

export default function EventDetailScreen() {
  const { id, openRegister, preview } = useLocalSearchParams<{ id: string; openRegister?: string; preview?: string }>();
  const { data: event, isLoading, error } = useEvent(id);
  const userId = useAuthStore((s) => s.user?._id);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG }}>
        <ActivityIndicator color="#FF6B35" />
      </View>
    );
  }

  if (error) {
    const status = (error as any)?.response?.status;
    if (status === 404) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG, padding: 24 }}>
          <Text className="font-serif" style={{ color: TEXT_0, fontSize: 26, marginBottom: 8 }}>Not found</Text>
          <Text className="font-outfit" style={{ color: TEXT_2, textAlign: 'center' }}>
            This event doesn't exist or is no longer visible.
          </Text>
        </View>
      );
    }
    if (status === 410) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG, padding: 24 }}>
          <Text className="font-serif" style={{ color: TEXT_0, fontSize: 26, marginBottom: 8 }}>Cancelled</Text>
          <Text className="font-outfit" style={{ color: TEXT_2, textAlign: 'center' }}>
            The organizer has cancelled this event.
          </Text>
        </View>
      );
    }
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG, padding: 24 }}>
        <Text className="font-outfit" style={{ color: TEXT_2 }}>Couldn't load event. Try again.</Text>
      </View>
    );
  }

  if (!event) return null;

  // Organizer hitting the route directly → send to manage. (Preview is now a
  // modal over manage, so ?preview=1 is only a harmless deep-link fallback that
  // still renders the viewer.)
  const organizerIdResolved =
    typeof event.organizerId === 'string' ? event.organizerId : event.organizerId?._id;
  if (organizerIdResolved && userId && organizerIdResolved === userId && preview !== '1') {
    return <Redirect href={`/events/${event._id}/manage/overview`} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <Stack.Screen options={{ headerShown: false }} />
      <EventDetailViewer event={event} initialOpenRegister={openRegister === '1'} />
    </View>
  );
}
