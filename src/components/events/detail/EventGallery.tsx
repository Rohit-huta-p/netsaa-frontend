/**
 * EventGallery — "Gallery" scroll rail for the v2 artist event detail.
 * (DOCS/04-design/mockups/events/event-detail/event-detail-v2-with-gallery.html · variation B)
 *
 * A full-bleed horizontal filmstrip of the organizer's media — photos AND
 * videos. The first tile is featured (wider); video tiles carry a play badge
 * and duration. Tapping any tile opens a full-screen, swipeable lightbox:
 * photos render contained, videos play inline (NetsaVideoPlayer) — but only the
 * ACTIVE slide mounts a player, so swiping away stops playback (no off-screen
 * audio, no stack of players).
 *
 * Renders nothing unless there are ≥2 items — a single one is already the hero,
 * so a one-tile "gallery" would just repeat it. Counts are real (event.media).
 * Sits in the section stack between "What to expect" and "Schedule".
 */
import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  FlatList,
  Modal,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { X, Play } from 'lucide-react-native';
import NetsaVideoPlayer from '@/components/media/NetsaVideoPlayer';
import type { EventDoc, EventMedia } from '@/services/eventService';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PAD = 20;

// v2 palette (event-detail-v2.html)
const BG_2 = '#131218';
const HAIRLINE = 'rgba(255,255,255,0.06)';
const T1 = '#C8C0B5';
const T3 = '#57524C';

/** seconds → "m:ss" (e.g. 48 → "0:48"), '' when unknown. */
function fmtDuration(sec?: number): string {
  if (!sec || sec < 0) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** thumbnail uri for a tile — video → thumbnailUrl, photo → url. */
function thumbUri(m: EventMedia): string | undefined {
  return m.kind === 'video' ? m.thumbnailUrl : m.url;
}

interface Props {
  event: EventDoc;
}

export default function EventGallery({ event }: Props) {
  // Photos (need a url) + videos (need something to show or play).
  const items: EventMedia[] = [...(event.media ?? [])]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((m) =>
      m.kind === 'photo'
        ? !!m.url
        : !!(m.muxPlaybackId || m.thumbnailUrl || m.url),
    );

  const [openAt, setOpenAt] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);

  // A gallery only earns its section with 2+ items (1 is already the hero).
  if (items.length < 2) return null;

  const photoCount = items.filter((m) => m.kind === 'photo').length;
  const videoCount = items.length - photoCount;
  const label =
    videoCount === 0
      ? `${photoCount} photos`
      : photoCount === 0
        ? `${videoCount} ${videoCount === 1 ? 'video' : 'videos'}`
        : `${photoCount} photos · ${videoCount} ${videoCount === 1 ? 'video' : 'videos'}`;

  const open = (i: number) => {
    setCurrent(i);
    setOpenAt(i);
  };

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text style={styles.title}>Gallery</Text>
        <Text style={styles.aside}>{label}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {items.map((item, i) => {
          const isVideo = item.kind === 'video';
          const uri = thumbUri(item);
          const dur = fmtDuration(item.duration);
          return (
            <Pressable
              key={`g-${i}`}
              onPress={() => open(i)}
              style={[styles.tile, i === 0 && styles.tileWide]}
              accessibilityRole="imagebutton"
              accessibilityLabel={`${isVideo ? 'Video' : 'Photo'} ${i + 1} of ${items.length}`}
            >
              {uri ? (
                <ExpoImage source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.tileFallback]} />
              )}
              {isVideo ? (
                <>
                  <View style={styles.playBadge}>
                    <Play size={15} color="#fff" fill="#fff" />
                  </View>
                  {dur ? <Text style={styles.durLabel}>{dur}</Text> : null}
                </>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Full-screen lightbox — swipe through all media */}
      <Modal
        visible={openAt !== null}
        animationType="fade"
        onRequestClose={() => setOpenAt(null)}
        statusBarTranslucent
      >
        <View style={styles.viewer}>
          <FlatList
            data={items}
            horizontal
            pagingEnabled
            extraData={current}
            initialScrollIndex={openAt ?? 0}
            getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
            keyExtractor={(_, i) => `lb-${i}`}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setCurrent(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))
            }
            renderItem={({ item, index }) => {
              const playable = item.kind === 'video' && !!item.muxPlaybackId;
              const active = index === current;
              const uri = thumbUri(item) ?? item.url;
              return (
                <View style={styles.slide}>
                  {playable && active ? (
                    // Only the active video mounts a player → swiping away stops it.
                    <NetsaVideoPlayer
                      playbackId={item.muxPlaybackId as string}
                      poster={item.thumbnailUrl}
                      style={{ width: SCREEN_W }}
                    />
                  ) : (
                    <ExpoImage source={{ uri }} style={{ width: SCREEN_W, height: SCREEN_H }} contentFit="contain" transition={150} />
                  )}
                  {item.kind === 'video' && !(playable && active) ? (
                    <View style={styles.playBadgeLg} pointerEvents="none">
                      <Play size={26} color="#fff" fill="#fff" />
                    </View>
                  ) : null}
                </View>
              );
            }}
          />

          <View style={styles.viewerTop} pointerEvents="box-none">
            <Text style={styles.viewerCount}>
              {current + 1} / {items.length}
            </Text>
            <Pressable
              onPress={() => setOpenAt(null)}
              hitSlop={12}
              style={styles.viewerClose}
              accessibilityRole="button"
              accessibilityLabel="Close gallery"
            >
              <X size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Full-bleed section: no horizontal padding (the rail scrolls edge-to-edge);
  // header and rail pad themselves. Matches the other v2 sections' top rhythm.
  section: {
    paddingTop: 24,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderColor: HAIRLINE,
    marginTop: 18,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: PAD,
    marginBottom: 14,
  },
  title: {
    fontFamily: 'Outfit-Bold',
    fontSize: 11,
    color: T1,
    letterSpacing: 1.76,
    textTransform: 'uppercase',
  },
  aside: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 10,
    color: T3,
    letterSpacing: 0.6,
  },
  rail: {
    gap: 10,
    paddingHorizontal: PAD,
    paddingBottom: 4,
  },
  tile: {
    width: 132,
    height: 172,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: BG_2,
  },
  tileWide: { width: 220 },
  tileFallback: {
    backgroundColor: '#1a1322',
  },
  // play badge on rail video tiles (centered)
  playBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -17 }, { translateY: -17 }],
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  durLabel: {
    position: 'absolute',
    right: 7,
    bottom: 7,
    fontFamily: 'SpaceMono-Bold',
    fontSize: 9,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    overflow: 'hidden',
    letterSpacing: 0.3,
  },

  // Lightbox
  viewer: { flex: 1, backgroundColor: '#000' },
  slide: { width: SCREEN_W, height: SCREEN_H, alignItems: 'center', justifyContent: 'center' },
  playBadgeLg: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  viewerTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: 12,
  },
  viewerCount: { fontFamily: 'SpaceMono-Bold', fontSize: 12, color: '#fff', letterSpacing: 1 },
  viewerClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
