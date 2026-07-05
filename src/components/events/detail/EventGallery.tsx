/**
 * EventGallery — "Gallery" scroll rail for the v2 artist event detail.
 * (DOCS/04-design/mockups/events/event-detail/event-detail-v2-with-gallery.html · variation B)
 *
 * A full-bleed horizontal filmstrip of the organizer's photos (event.media,
 * photos only — videos are already showcased in the hero). The first tile is
 * featured (wider); tapping any tile opens a full-screen, swipeable lightbox
 * with a counter. Renders NOTHING unless there are ≥2 photos — a single image
 * is already the hero, so a one-tile "gallery" would just repeat it.
 *
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
import { X } from 'lucide-react-native';
import type { EventDoc, EventMedia } from '@/services/eventService';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PAD = 20;

// v2 palette (event-detail-v2.html)
const BG_2 = '#131218';
const HAIRLINE = 'rgba(255,255,255,0.06)';
const T1 = '#C8C0B5';
const T3 = '#57524C';

interface Props {
  event: EventDoc;
}

export default function EventGallery({ event }: Props) {
  const photos: EventMedia[] = [...(event.media ?? [])]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((m) => m.kind === 'photo' && !!m.url);

  const [openAt, setOpenAt] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);

  // A gallery only earns its section with 2+ photos (1 is already the hero).
  if (photos.length < 2) return null;

  const open = (i: number) => {
    setCurrent(i);
    setOpenAt(i);
  };

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text style={styles.title}>Gallery</Text>
        <Text style={styles.aside}>{photos.length} photos</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {photos.map((p, i) => (
          <Pressable
            key={`gph-${i}`}
            onPress={() => open(i)}
            style={[styles.tile, i === 0 && styles.tileWide]}
            accessibilityRole="imagebutton"
            accessibilityLabel={`Photo ${i + 1} of ${photos.length}`}
          >
            <ExpoImage
              source={{ uri: p.url }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={150}
            />
          </Pressable>
        ))}
      </ScrollView>

      {/* Full-screen lightbox — swipe through all photos */}
      <Modal
        visible={openAt !== null}
        animationType="fade"
        onRequestClose={() => setOpenAt(null)}
        statusBarTranslucent
      >
        <View style={styles.viewer}>
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            initialScrollIndex={openAt ?? 0}
            getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
            keyExtractor={(_, i) => `lb-${i}`}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setCurrent(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))
            }
            renderItem={({ item }) => (
              <View style={styles.slide}>
                <ExpoImage
                  source={{ uri: item.url }}
                  style={{ width: SCREEN_W, height: SCREEN_H }}
                  contentFit="contain"
                  transition={150}
                />
              </View>
            )}
          />

          <View style={styles.viewerTop} pointerEvents="box-none">
            <Text style={styles.viewerCount}>
              {current + 1} / {photos.length}
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
  // the header and rail pad themselves. Matches the other v2 sections' top rhythm.
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

  // Lightbox
  viewer: { flex: 1, backgroundColor: '#000' },
  slide: { width: SCREEN_W, height: SCREEN_H, alignItems: 'center', justifyContent: 'center' },
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
