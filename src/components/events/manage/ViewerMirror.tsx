/**
 * ViewerMirror — "How viewers see it" (event-manage-living-poster.html · the `.mirror`).
 *
 * A compact, honest reflection of the public listing, sitting under the room so
 * the host can proof what they published without leaving:
 *   - cover thumbnail (event.media[0]) with a photo-count badge, or the
 *     brand-gradient fallback when no media is set yet
 *   - serif title · a 2-line story snippet (event.about) · a mono facts line
 *     built only from real fields (agenda length · price · first topic tags)
 *   - two actions: Edit listing (→ composer edit) · Open full preview (→ ?preview=1)
 *
 * Purely presentational — the two routes arrive via callbacks (overview owns nav).
 */
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pencil } from 'lucide-react-native';
import type { EventDoc, EventMedia } from '@/services/eventService';
import { formatRupees } from '@/lib/eventPricing';

// Inbox-rhythm palette (DOCS/04-design/mockups/INBOX_RHYTHM_DESIGN_SYSTEM.md)
const SURFACE='rgba(255,255,255,0.04)', HAIR2='rgba(255,255,255,0.10)';
const T0='#F3EFE8', T1='#A1A1AA', T2='#71717a', T3='#52525b';
const ORANGE='#FF6B35';

interface ViewerMirrorProps {
  event: EventDoc;
  onEdit(): void;         // → the composer in edit mode
  onOpenPreview(): void;  // → the viewer route (?preview=1)
}

export default function ViewerMirror({ event, onEdit, onOpenPreview }: ViewerMirrorProps) {
  const media: EventMedia[] = [...(event.media ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const cover = media[0];
  const coverUri = cover
    ? cover.kind === 'video'
      ? cover.thumbnailUrl ?? cover.url
      : cover.url
    : undefined;

  const isPaid = event.registrationMode === 'paid_ticket';
  const ticketPrice = (event as any).pricing?.amount ?? (event as any).ticketPrice ?? 0;

  // Facts — real fields only. Omit any that isn't present rather than inventing.
  const snippet = event.about?.trim();
  const facts = [
    event.agenda?.length ? `${event.agenda.length}-DAY AGENDA` : null,
    isPaid ? `PAID ${formatRupees(ticketPrice)}` : 'FREE',
    ...(event.topicTags ?? []).slice(0, 2).map((t) => t.toUpperCase()),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View>
      <Text style={styles.lab}>How viewers see it</Text>

      <View style={styles.mirror}>
        <View style={styles.top}>
          <View style={styles.thumb}>
            {coverUri ? (
              <ExpoImage source={{ uri: coverUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <LinearGradient
                colors={['rgba(255,107,53,0.85)', '#20122b', '#0b0710']}
                start={{ x: 0.6, y: 0.15 }}
                end={{ x: 0.1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            {media.length > 0 ? (
              <Text style={styles.cnt}>{media.length}</Text>
            ) : null}
          </View>

          <View style={styles.body}>
            <Text style={styles.mt} numberOfLines={1}>{event.title}</Text>
            {snippet ? (
              <Text style={styles.snip} numberOfLines={2}>{snippet}</Text>
            ) : null}
            {facts ? <Text style={styles.facts}>{facts}</Text> : null}
          </View>
        </View>

        <View style={styles.btns}>
          <Pressable
            onPress={onEdit}
            style={[styles.btn, styles.btnEdit]}
            accessibilityRole="button"
            accessibilityLabel="Edit listing"
          >
            <Pencil size={13} color={T1} />
            <Text style={[styles.btnText, { color: T1 }]}>Edit listing</Text>
          </Pressable>
          <Pressable
            onPress={onOpenPreview}
            style={styles.btn}
            accessibilityRole="button"
            accessibilityLabel="Open full preview"
          >
            <Text style={[styles.btnText, { color: ORANGE }]}>Open full preview →</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // .lab — left mono label (matches Backstage), 24/12 rhythm
  lab: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 9.5,
    letterSpacing: 1.9,
    textTransform: 'uppercase',
    color: T3,
    marginTop: 24,
    marginBottom: 12,
  },
  mirror: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: HAIR2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  top: { flexDirection: 'row', gap: 12, padding: 12 },
  thumb: {
    width: 66,
    height: 66,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#0b0710',
    flexShrink: 0,
  },
  cnt: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    fontFamily: 'SpaceMono-Regular',
    fontSize: 8,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  body: { flex: 1, minWidth: 0 },
  mt: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 16,
    lineHeight: 18,
    color: T0,
  },
  snip: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    lineHeight: 16.5,
    color: T2,
    marginTop: 4,
  },
  facts: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 9,
    letterSpacing: 0.27,
    color: T3,
    marginTop: 6,
  },
  btns: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: HAIR2,
  },
  btn: {
    flex: 1,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnEdit: { borderRightWidth: 1, borderRightColor: HAIR2 },
  btnText: { fontFamily: 'Outfit-SemiBold', fontSize: 12 },
});
