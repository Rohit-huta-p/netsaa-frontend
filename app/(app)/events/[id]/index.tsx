import { useLocalSearchParams, Redirect, Stack } from 'expo-router';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useEvent } from '@/hooks/useEvents';
import { useAuthStore } from '@/stores/authStore';
import EventHeroGallery from '@/components/events/detail/EventHeroGallery';
import EventDetailSections from '@/components/events/detail/EventDetailSections';
import EventCapacityBar from '@/components/events/detail/EventCapacityBar';
import EventCtaBar from '@/components/events/detail/EventCtaBar';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: event, isLoading, error } = useEvent(id);
  const userId = useAuthStore((s) => s.user?._id);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-event-bg">
        <ActivityIndicator color="#FF6B35" />
      </View>
    );
  }

  if (error) {
    const status = (error as any)?.response?.status;
    if (status === 404) {
      return (
        <View className="flex-1 items-center justify-center bg-event-bg p-6">
          <Text className="font-serif text-event-textPrimary text-2xl mb-2">Not found</Text>
          <Text className="font-outfit text-event-textSecondary text-center">
            This event doesn't exist or is no longer visible.
          </Text>
        </View>
      );
    }
    if (status === 410) {
      return (
        <View className="flex-1 items-center justify-center bg-event-bg p-6">
          <Text className="font-serif text-event-textPrimary text-2xl mb-2">Cancelled</Text>
          <Text className="font-outfit text-event-textSecondary text-center">
            The organizer has cancelled this event.
          </Text>
        </View>
      );
    }
    return (
      <View className="flex-1 items-center justify-center bg-event-bg p-6">
        <Text className="font-outfit text-event-textSecondary">Couldn't load event. Try again.</Text>
      </View>
    );
  }

  if (!event) return null;

  // Organizer view → redirect to manage
  const organizerIdResolved = typeof event.organizerId === 'string'
    ? event.organizerId
    : event.organizerId?._id;
  if (organizerIdResolved && userId && organizerIdResolved === userId) {
    return <Redirect href={`/events/${event._id}/manage/overview`} />;
  }

  return (
    <View className="flex-1 bg-event-bg">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentInsetAdjustmentBehavior="never" showsVerticalScrollIndicator={false}>
        <EventHeroGallery media={event.media} title={event.title} />
        <EventDetailSections event={event} />
        <EventCapacityBar
          total={event.capacity.total}
          registeredCount={event.capacity.registeredCount}
        />
        <View style={{ height: 120 }} />
      </ScrollView>
      <EventCtaBar event={event} />
    </View>
  );
}
