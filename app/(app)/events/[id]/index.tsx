import { useEffect, useState } from 'react';
import { useLocalSearchParams, Redirect, Stack, useRouter } from 'expo-router';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { ChevronLeft, Heart, Share2 } from 'lucide-react-native';
import { useEvent } from '@/hooks/useEvents';
import { useAuthStore } from '@/stores/authStore';
import EventHeroGallery from '@/components/events/detail/EventHeroGallery';
import EventDetailSections from '@/components/events/detail/EventDetailSections';
import EventCapacityBar from '@/components/events/detail/EventCapacityBar';
import EventCtaBar from '@/components/events/detail/EventCtaBar';
import MeetingLinkRevealCard from '@/components/events/detail/MeetingLinkRevealCard';
import DiscussionTabs from '@/components/events/detail/DiscussionTabs';

const BG = '#09090b';
const TEXT_0 = '#f4f4f5';
const TEXT_2 = '#71717a';
const HAIRLINE = 'rgba(255,255,255,0.10)';

export default function EventDetailScreen() {
  const router = useRouter();
  const { id, openRegister } = useLocalSearchParams<{ id: string; openRegister?: string }>();
  const [sheetOpenForce, setSheetOpenForce] = useState(false);
  const { data: event, isLoading, error } = useEvent(id);

  useEffect(() => {
    if (openRegister === '1') setSheetOpenForce(true);
  }, [openRegister]);
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

  // Organizer view → redirect to manage
  const organizerIdResolved = typeof event.organizerId === 'string'
    ? event.organizerId
    : event.organizerId?._id;
  if (organizerIdResolved && userId && organizerIdResolved === userId) {
    return <Redirect href={`/events/${event._id}/manage/overview`} />;
  }

  // Nav meta: city + type
  const city = (event as any).location?.city || '';
  const navMeta = [city, 'event'].filter(Boolean).join(' · ').toLowerCase();

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* NAV — inbox-style */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 12,
      }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 38, height: 38, borderRadius: 19,
            borderWidth: 1, borderColor: HAIRLINE,
            alignItems: 'center', justifyContent: 'center',
          }}>
          <ChevronLeft size={18} color={TEXT_0} />
        </Pressable>
        <View style={{ flex: 1 }} />
        {navMeta ? (
          <Text className="font-outfit" style={{ color: '#52525b', fontSize: 11, letterSpacing: 0.6 }}>
            {navMeta}
          </Text>
        ) : null}
        <Pressable
          style={{
            width: 38, height: 38, borderRadius: 19,
            borderWidth: 1, borderColor: HAIRLINE,
            alignItems: 'center', justifyContent: 'center',
          }}>
          <Heart size={18} color={TEXT_0} />
        </Pressable>
        <Pressable
          style={{
            width: 38, height: 38, borderRadius: 19,
            borderWidth: 1, borderColor: HAIRLINE,
            alignItems: 'center', justifyContent: 'center',
          }}>
          <Share2 size={16} color={TEXT_0} />
        </Pressable>
      </View>

      <ScrollView contentInsetAdjustmentBehavior="never" showsVerticalScrollIndicator={false}>
        <EventHeroGallery event={event} />
        <EventDetailSections event={event} />
        <View style={{ paddingHorizontal: 20 }}>
          <MeetingLinkRevealCard event={event} />
          <DiscussionTabs event={event} />
        </View>
        <EventCapacityBar
          total={event.capacity.total}
          registeredCount={event.capacity.registeredCount}
          registrationDeadline={event.registrationDeadline}
        />
        <View style={{ height: 130 }} />
      </ScrollView>
      <EventCtaBar event={event} initialOpen={sheetOpenForce} onInitialOpenConsumed={() => setSheetOpenForce(false)} />
    </View>
  );
}
