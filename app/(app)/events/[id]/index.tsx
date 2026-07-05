import { useEffect, useState } from 'react';
import { useLocalSearchParams, Redirect, Stack, useRouter } from 'expo-router';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useEvent } from '@/hooks/useEvents';
import { useAuthStore } from '@/stores/authStore';
import { useEventsByOrganizer } from '@/hooks/useEventsByOrganizer';
import { shareEvent } from '@/lib/eventShare';
import { eventService } from '@/services/eventService';
import EventHeroV2 from '@/components/events/detail/EventHeroV2';
import EventDetailV2Body from '@/components/events/detail/EventDetailV2Body';
import MoreByOrganizerRail from '@/components/events/detail/MoreByOrganizerRail';
import EventCtaBar from '@/components/events/detail/EventCtaBar';
import MeetingLinkRevealCard from '@/components/events/detail/MeetingLinkRevealCard';
import DiscussionTabs from '@/components/events/detail/DiscussionTabs';

// v2 palette (event-detail-v2.html)
const BG = '#0B0A0F';
const TEXT_0 = '#F0ECE6';
const TEXT_2 = '#8C857B';

export default function EventDetailScreen() {
  const router = useRouter();
  const { id, openRegister, preview } = useLocalSearchParams<{ id: string; openRegister?: string; preview?: string }>();
  const [sheetOpenForce, setSheetOpenForce] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { data: event, isLoading, error } = useEvent(id);
  const userId = useAuthStore((s) => s.user?._id);

  // Organizer identity (resolved off the event, which may be a string id or a
  // populated { name, verified, avatar } object). Computed before the early
  // returns so the by-organizer hook can be called unconditionally.
  const organizerObj = event && typeof event.organizerId === 'object' ? event.organizerId : undefined;
  const organizerId = organizerObj?._id ?? (event && typeof event.organizerId === 'string' ? event.organizerId : undefined);
  const organizerName = organizerObj?.name;

  // One query powers both the "N events hosted" count and the "more by
  // organizer" rail (React Query dedupes the shared key).
  const { data: orgEvents } = useEventsByOrganizer(organizerId, id);

  useEffect(() => {
    if (openRegister === '1') setSheetOpenForce(true);
  }, [openRegister]);

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

  // Organizer view → redirect to manage. ?preview=1 bypasses the redirect so the
  // organizer lands on the exact viewer page — no separate preview chrome, it
  // renders identically to what an artist sees.
  if (organizerId && userId && organizerId === userId && preview !== '1') {
    return <Redirect href={`/events/${event._id}/manage/overview`} />;
  }

  // Toggle-save (bookmark). Optimistic; reconciles with the server's toggle
  // result and reverts on failure. Initial "already saved?" highlight needs an
  // isSaved flag on the detail payload (backend follow-up).
  const handleSave = async () => {
    const next = !isSaved;
    setIsSaved(next);
    try {
      const { saved } = await eventService.saveEvent(id);
      setIsSaved(saved);
    } catch {
      setIsSaved(!next);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentInsetAdjustmentBehavior="never" showsVerticalScrollIndicator={false}>
        {/* Hero owns the overlaid nav (back · share · save) */}
        <EventHeroV2 event={event} onBack={() => router.back()} onShare={() => shareEvent(event)} onSave={handleSave} saved={isSaved} />

        <EventDetailV2Body event={event} organizerEventCount={orgEvents?.total} />

        <View style={{ paddingHorizontal: 20 }}>
          <MeetingLinkRevealCard event={event} />
          <DiscussionTabs event={event} />
        </View>

        <MoreByOrganizerRail organizerId={organizerId} currentEventId={event._id} organizerName={organizerName} />

        <View style={{ height: 110 }} />
      </ScrollView>

      <EventCtaBar event={event} initialOpen={sheetOpenForce} onInitialOpenConsumed={() => setSheetOpenForce(false)} />
    </View>
  );
}
