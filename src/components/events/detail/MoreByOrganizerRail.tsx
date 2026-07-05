/**
 * MoreByOrganizerRail — v2 "More by {organizer}" horizontal rail
 * (DOCS/04-design/mockups/event-detail-v2.html · the `.more-rail`).
 *
 * Other LIVE events by the same organizer (real data via useEventsByOrganizer,
 * powered by the public GET /v1/events?organizerId=…&status=live filter). The
 * currently-viewed event is already excluded by the hook. Renders nothing when
 * the organizer has no other live events — no empty state, no fake cards.
 */
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { EventDoc } from '@/services/eventService';
import { useEventsByOrganizer } from '@/hooks/useEventsByOrganizer';

// v2 palette (event-detail-v2.html)
const BG2 = '#131218';
const HAIR = 'rgba(255,255,255,0.06)';
const T0 = '#F0ECE6', T2 = '#8C857B', T4 = '#2E2B28';
const ORANGE = '#FF6B35';

const CARD_GRADIENTS: [string, string][] = [
  ['#2a1d3d', '#1a1322'],
  ['#3d1d2a', '#221318'],
  ['#1d3d2a', '#131822'],
];

function shortDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

interface Props {
  organizerId?: string;
  currentEventId: string;
  organizerName?: string;
}

export default function MoreByOrganizerRail({ organizerId, currentEventId, organizerName }: Props) {
  const router = useRouter();
  const { data } = useEventsByOrganizer(organizerId, currentEventId);
  const events = data?.events ?? [];

  if (events.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>More by {organizerName || 'this organizer'}</Text>
        <Text style={styles.aside}>{events.length} active</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroller}>
        {events.map((e: EventDoc, i: number) => {
          const cover = [...(e.media ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)[0];
          const coverUri = cover ? (cover.kind === 'video' ? cover.thumbnailUrl ?? cover.url : cover.url) : undefined;
          const tag = e.topicTags?.[0] ?? '';
          const city = (e.location as any)?.city ?? (e.location as any)?.venueName ?? '';
          const meta = [shortDate(e.startsAt), city].filter(Boolean).join('  ·  ');
          return (
            <Pressable
              key={e._id}
              onPress={() => router.push(`/events/${e._id}` as any)}
              style={styles.card}
              accessibilityRole="button"
              accessibilityLabel={e.title}
            >
              <View style={styles.cardImg}>
                {coverUri ? (
                  <ExpoImage source={{ uri: coverUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <LinearGradient colors={CARD_GRADIENTS[i % CARD_GRADIENTS.length]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                )}
              </View>
              <View style={styles.cardBody}>
                {tag ? <Text style={styles.cardTag}>{tag.toUpperCase()}</Text> : null}
                <Text style={styles.cardTitle} numberOfLines={2}>{e.title}</Text>
                {meta ? <Text style={styles.cardMeta}>{meta}</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 24, paddingBottom: 28, borderTopWidth: 1, borderTopColor: HAIR },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14 },
  title: { fontFamily: 'Outfit-Bold', fontSize: 11, color: '#C8C0B5', letterSpacing: 1.76, textTransform: 'uppercase' },
  aside: { fontFamily: 'SpaceMono-Regular', fontSize: 10, color: '#57524C', letterSpacing: 0.6 },
  scroller: { gap: 12, paddingHorizontal: 20 },
  card: { width: 220, backgroundColor: BG2, borderWidth: 1, borderColor: HAIR, borderRadius: 12, overflow: 'hidden' },
  cardImg: { height: 110, backgroundColor: '#1a1322' },
  cardBody: { padding: 14, paddingTop: 12 },
  cardTag: { fontFamily: 'SpaceMono-Bold', fontSize: 9.5, color: ORANGE, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  cardTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 13.5, color: T0, lineHeight: 17.5, marginBottom: 8 },
  cardMeta: { fontFamily: 'SpaceMono-Regular', fontSize: 10, color: T2, letterSpacing: 0.4 },
});
