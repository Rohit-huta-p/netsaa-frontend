/**
 * EventHeroV2 — the full-bleed hero for the v2 artist event-detail
 * (DOCS/04-design/mockups/event-detail-v2.html · the `.hero` block).
 *
 * 320px, edge-to-edge: a paginated media carousel (photos via expo-image,
 * videos via NetsaVideoPlayer) over the brand gradient fallback, with the
 * nav overlaid INSIDE the hero (back · share · save), a top counter "NN/NN",
 * and bottom pagination dots. Purely presentational — behaviour via callbacks.
 */
import { useState } from 'react';
import { View, Image, Text, Pressable, Dimensions, FlatList, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Share2, Bookmark } from 'lucide-react-native';
import NetsaVideoPlayer from '@/components/media/NetsaVideoPlayer';
import type { EventDoc, EventMedia } from '@/services/eventService';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = 320;
const NETSA_FALLBACK = require('@/../assets/netsa-logo-fallback.png');

// v2 palette (event-detail-v2.html)
const T0 = '#F0ECE6';

interface Props {
  event: EventDoc;
  onBack(): void;
  onShare(): void;
  onSave?(): void;
}

export default function EventHeroV2({ event, onBack, onShare, onSave }: Props) {
  const [index, setIndex] = useState(0);
  const media: EventMedia[] = [...(event.media ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const hasMedia = media.length > 0;

  return (
    <View style={styles.hero}>
      {/* Background — media carousel, or the brand-gradient fallback */}
      {hasMedia ? (
        <FlatList
          data={media}
          keyExtractor={(_, i) => `hero-v2-${i}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            setIndex(Math.max(0, Math.min(media.length - 1, i)));
          }}
          renderItem={({ item }) => (
            <View style={{ width: SCREEN_W, height: HERO_H }}>
              {item.kind === 'video' && item.muxPlaybackId ? (
                <NetsaVideoPlayer playbackId={item.muxPlaybackId} style={{ width: SCREEN_W, height: HERO_H }} />
              ) : item.url ? (
                <ExpoImage source={{ uri: item.url }} style={{ width: SCREEN_W, height: HERO_H }} contentFit="cover" transition={200} />
              ) : (
                <HeroFallback />
              )}
            </View>
          )}
        />
      ) : (
        <HeroFallback />
      )}

      {/* Top fade — legibility for the overlaid nav */}
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'transparent']}
        pointerEvents="none"
        style={styles.topFade}
      />
      {/* Bottom scrim */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)']}
        pointerEvents="none"
        style={styles.bottomScrim}
      />

      {/* Overlaid nav — back · (share · save) */}
      <View style={styles.topbar} pointerEvents="box-none">
        <Pressable onPress={onBack} hitSlop={8} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <ChevronLeft size={16} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={onShare} hitSlop={8} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Share">
          <Share2 size={15} color="#fff" />
        </Pressable>
        <Pressable onPress={onSave} hitSlop={8} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Save">
          <Bookmark size={15} color="#fff" />
        </Pressable>
      </View>

      {/* Counter — "NN/NN" (only with >1 media) */}
      {media.length > 1 ? (
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {String(index + 1).padStart(2, '0')}
            <Text style={styles.counterSep}> / </Text>
            {String(media.length).padStart(2, '0')}
          </Text>
        </View>
      ) : null}

      {/* Pagination dots */}
      {media.length > 1 ? (
        <View style={styles.dots}>
          {media.map((_, i) => (
            <View key={`hero-v2-dot-${i}`} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function HeroFallback() {
  return (
    <View style={{ width: SCREEN_W, height: HERO_H }}>
      <LinearGradient colors={['#1a1322', '#2d1b3d', '#1a0e25']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(255,107,53,0.18)', 'transparent']} start={{ x: 0.3, y: 0.2 }} end={{ x: 0.8, y: 0.7 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(139,92,246,0.22)', 'transparent']} start={{ x: 0.8, y: 0.8 }} end={{ x: 0.2, y: 0.2 }} style={StyleSheet.absoluteFill} />
      <View style={StyleSheet.absoluteFill}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Image source={NETSA_FALLBACK} style={{ width: 110, height: 110, opacity: 0.18 }} resizeMode="contain" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: SCREEN_W, height: HERO_H, overflow: 'hidden', backgroundColor: '#1a0e25', position: 'relative' },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 80, zIndex: 2 },
  bottomScrim: { position: 'absolute', bottom: 0, left: 0, right: 0, height: HERO_H * 0.4 },
  topbar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingTop: 14, paddingBottom: 8,
    zIndex: 3,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  counter: {
    position: 'absolute', top: 14, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
    zIndex: 3,
  },
  counterText: { fontFamily: 'SpaceMono-Bold', fontSize: 10.5, color: '#fff', letterSpacing: 1 },
  counterSep: { color: 'rgba(255,255,255,0.4)' },
  dots: { position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', gap: 6, zIndex: 3 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotOn: { width: 18, borderRadius: 3, backgroundColor: T0 },
});
