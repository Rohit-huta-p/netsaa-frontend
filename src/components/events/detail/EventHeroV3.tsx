/**
 * EventHeroV3 — the photo-led hero for the E·9 event detail page.
 *
 * A full-bleed, swipeable media carousel (photos via expo-image, videos via
 * NetsaVideoPlayer) over the brand-gradient fallback. Overlaid: the nav
 * (back · share · save) up top, and at the bottom — on a fade to the page bg —
 * the eyebrow (type · craft), the serif title, the tagline, and a tiny
 * "N going" line. Pagination dots, but NO numeric counter (per design).
 * Purely presentational; behaviour via callbacks.
 */
import { useState } from 'react';
import { View, Text, Pressable, Dimensions, FlatList, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Share2, Bookmark } from 'lucide-react-native';
import NetsaVideoPlayer from '@/components/media/NetsaVideoPlayer';
import type { EventDoc, EventMedia } from '@/services/eventService';
import { eyebrow as buildEyebrow } from '@/lib/eventDetailV3';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = 220;

const T0 = '#F3EFE8';
const ORANGE = '#FF6B35';

interface Props {
  event: EventDoc;
  onBack(): void;
  onShare(): void;
  onSave?(): void;
  saved?: boolean;
  goingCount?: number;
  goingLine?: string;
}

export default function EventHeroV3({ event, onBack, onShare, onSave, saved = false, goingCount = 0, goingLine }: Props) {
  const [index, setIndex] = useState(0);
  const media: EventMedia[] = [...(event.media ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const hasMedia = media.length > 0;

  return (
    <View style={styles.hero}>
      {hasMedia ? (
        <FlatList
          data={media}
          keyExtractor={(_, i) => `hero-v3-${i}`}
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
                <HeroFallback eventType={event.eventType} />
              )}
            </View>
          )}
        />
      ) : (
        <HeroFallback eventType={event.eventType} />
      )}

      {/* Subtle black tint over the cover photo — only when real media exists
          (the gradient fallback is already dark). Keeps the headline legible. */}
      {hasMedia ? <View pointerEvents="none" style={styles.tint} /> : null}

      {/* Top fade for nav legibility */}
      <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent']} pointerEvents="none" style={styles.topFade} />
      {/* Bottom fade to the page background, carrying the headline */}
      <LinearGradient
        colors={['transparent', 'rgba(18,18,22,0.35)', '#121216']}
        locations={[0, 0.55, 1]}
        pointerEvents="none"
        style={styles.bottomFade}
      />

      {/* Nav — back · (share · save) */}
      <View style={styles.topbar} pointerEvents="box-none">
        <Pressable onPress={onBack} hitSlop={8} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <ChevronLeft size={16} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={onShare} hitSlop={8} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Share">
          <Share2 size={15} color="#fff" />
        </Pressable>
        {onSave ? (
          <Pressable
            onPress={onSave}
            hitSlop={8}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Saved' : 'Save'}
            accessibilityState={{ selected: saved }}
          >
            <Bookmark size={15} color="#fff" fill={saved ? '#fff' : 'none'} />
          </Pressable>
        ) : null}
      </View>

      {/* Dots (no numeric counter) */}
      {/* {media.length > 1 ? (
        <View style={styles.dots}>
          {media.map((_, i) => (
            <View key={`hero-v3-dot-${i}`} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>
      ) : null} */}

      {/* Headline overlay */}
      <View style={styles.headline} pointerEvents="none">
        <Text style={styles.eyebrow}>{buildEyebrow(event).toUpperCase()}</Text>
        <Text style={styles.title}>{event.title}</Text>
        {event.tagline ? <Text style={styles.tagline}>{event.tagline}</Text> : null}
        {goingCount > 0 ? (
          <Text style={styles.going}>
            {goingCount} going{goingLine ? ` · ${goingLine}` : ''}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Per-event-type brand gradient for photo-less events — the same `pbg` washes
 * as the finalized E·9 mockups (radial accents over a dark diagonal base),
 * approximated with stacked LinearGradients (expo has no radial).
 */
const PAL: Record<string, { base: [string, string]; a1: string; a2: string }> = {
  kathak: { base: ['#3b1709', '#120705'], a1: 'rgba(255,176,80,0.60)', a2: 'rgba(255,90,40,0.50)' },
  ableton: { base: ['#1a1036', '#07060f'], a1: 'rgba(139,92,246,0.65)', a2: 'rgba(34,211,238,0.35)' },
  audition: { base: ['#2a0d1c', '#0c0508'], a1: 'rgba(244,114,182,0.55)', a2: 'rgba(150,63,89,0.60)' },
  openmic: { base: ['#241a3a', '#08070d'], a1: 'rgba(251,191,36,0.55)', a2: 'rgba(167,139,250,0.45)' },
  band: { base: ['#33120a', '#0d0605'], a1: 'rgba(251,191,36,0.60)', a2: 'rgba(239,68,68,0.50)' },
  film: { base: ['#0b2420', '#05090a'], a1: 'rgba(34,197,94,0.45)', a2: 'rgba(34,211,238,0.35)' },
  crew: { base: ['#101a2e', '#05070c'], a1: 'rgba(91,141,239,0.55)', a2: 'rgba(148,163,184,0.35)' },
  other: { base: ['#171a22', '#06070a'], a1: 'rgba(148,163,184,0.45)', a2: 'rgba(255,107,53,0.25)' },
};
const GRAD: Record<string, { base: [string, string]; a1: string; a2: string }> = {
  workshop: PAL.kathak, masterclass: PAL.ableton, audition: PAL.audition,
  open_mic: PAL.openmic, performance: PAL.openmic, competition: PAL.band,
  screening: PAL.film, meetup: PAL.crew, showcase: PAL.other, other: PAL.other,
};

function HeroFallback({ eventType }: { eventType?: string }) {
  const g = GRAD[eventType ?? ''] ?? PAL.other;
  return (
    <View style={{ width: SCREEN_W, height: HERO_H }}>
      <LinearGradient colors={g.base} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={[g.a1, 'transparent']} start={{ x: 0.9, y: 0 }} end={{ x: 0.25, y: 0.72 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['transparent', g.a2]} start={{ x: 0.25, y: 0.35 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: SCREEN_W, height: HERO_H, overflow: 'hidden', backgroundColor: '#1a0e25', position: 'relative' },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 96, zIndex: 2 },
  tint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.42)', zIndex: 1 },
  bottomFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: HERO_H * 0.72, zIndex: 2 },
  topbar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, zIndex: 4,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  dots: { position: 'absolute', bottom: 150, alignSelf: 'center', flexDirection: 'row', gap: 6, zIndex: 3 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotOn: { width: 18, borderRadius: 3, backgroundColor: '#fff' },
  headline: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 3, paddingHorizontal: 20, paddingBottom: 18, maxWidth: "80%" },
  eyebrow: { fontFamily: 'SpaceMono-Bold', fontSize: 10, letterSpacing: 2, color: 'rgba(243,239,232,0.82)', marginBottom: 8 },
  title: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 20, lineHeight: 28, letterSpacing: -0.5, color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 20, textShadowOffset: { width: 0, height: 2 } },
  tagline: { fontFamily: 'Outfit-Regular', fontSize: 10, lineHeight: 20, color: 'rgba(243,239,232,0.9)', marginTop: 0, maxWidth: '90%' },
  going: { fontFamily: 'Outfit-SemiBold', fontSize: 11.5, color: T0, marginTop: 12, opacity: 0.86 },
});
