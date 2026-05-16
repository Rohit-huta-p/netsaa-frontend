/**
 * MatchForYourGigsStrip — horizontal scroll of recommended artists for your gigs.
 *
 * Design source: DOCS/designs/hirer-home-v1.html (Match section inside By the numbers).
 * Plan: DOCS/NETSA_Hirer_Home_RN_Translation.md §6.6.
 *
 * States:
 *   - Loaded: gold-tinted tile, "Match for your gigs" title, horizontal scroll with % fit per artist.
 *   - Preview / empty (new hirer): same shell but title "Top in Pune", copy "post to see fit", no %.
 *
 * Data source: useRecommendedArtists({ gigIds, cityFilter, limit }) — wired to Visibility Engine
 * once that ships (PRD §3). Stub with mocked entries for v1.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, AccessibilityInfo } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';

type Trust = 'new' | 'rising' | 'trusted' | 'verified';

interface Artist {
  id: string;
  name: string;
  artType: string;
  city: string;
  trust: Trust;
  avatarColors: [string, string];
  /** Match score 0-100. Hidden in preview mode. */
  fitScore?: number;
}

interface Props {
  artists?: Artist[];
  preview?: boolean;
}

const TRUST_LABEL: Record<Trust, string> = {
  new: 'New',
  rising: 'Rising',
  trusted: 'Trusted',
  verified: 'Verified',
};
const TRUST_DOT: Record<Trust, string> = {
  new: '#6B6878',
  rising: '#8B5CF6',
  trusted: '#22C55E',
  verified: '#F59E0B',
};

const MOCK: Artist[] = [
  { id: '1', name: 'Ananya Iyer',  artType: 'Bharatanatyam', city: 'Pune',   trust: 'trusted',  avatarColors: ['#EC4899', '#FF6B35'], fitScore: 96 },
  { id: '2', name: 'Kabir Rao',    artType: 'Tabla',         city: 'Pune',   trust: 'verified', avatarColors: ['#F59E0B', '#FF6B35'], fitScore: 92 },
  { id: '3', name: 'Meera Joshi',  artType: 'Kathak',        city: 'Mumbai', trust: 'trusted',  avatarColors: ['#8B5CF6', '#EC4899'], fitScore: 89 },
  { id: '4', name: 'Aarav Singh',  artType: 'Punjabi Dhol',  city: 'Pune',   trust: 'rising',   avatarColors: ['#22C55E', '#8B5CF6'], fitScore: 87 },
];

export default function MatchForYourGigsStrip({ artists = MOCK, preview = false }: Props) {
  const router = useRouter();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const Container = reduceMotion ? View : Animated.View;
  const entering = reduceMotion ? undefined : FadeInUp.delay(160).duration(700);

  return (
    <Container style={styles.tile} entering={entering as any}>
      <View style={styles.head}>
        <View style={styles.headLeft}>
          {/* TODO: real star SVG icon */}
          <Text style={styles.star}>★</Text>
          <Text style={styles.title}>{preview ? 'Top in Pune' : 'Match for your gigs'}</Text>
        </View>
        {preview ? (
          <View style={styles.previewPill}><Text style={styles.previewPillText}>PREVIEW</Text></View>
        ) : (
          <Pressable onPress={() => router.push('/artists' as any)} accessibilityRole="button">
            <Text style={styles.link}>All →</Text>
          </Pressable>
        )}
      </View>

      {preview && (
        <Text style={styles.previewCopy}>
          Once you post, we'll surface artists matched to your brief. For now, a glimpse of who's around.
        </Text>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollRow}
      >
        {artists.map((a) => (
          <Pressable
            key={a.id}
            style={styles.card}
            onPress={() => router.push(`/artists/${a.id}` as any)}
            accessibilityRole="button"
            accessibilityLabel={`${a.name}, ${TRUST_LABEL[a.trust]} ${a.artType}, ${a.city}${a.fitScore != null && !preview ? `, ${a.fitScore}% fit` : ''}`}
          >
            <View style={[styles.avatar, { backgroundColor: a.avatarColors[0] }]}>
              <Text style={styles.avatarText}>
                {a.name.split(' ').map(p => p[0]).slice(0, 2).join('')}
              </Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardName} numberOfLines={1}>{a.name}</Text>
              <View style={styles.trustRow}>
                <View style={[styles.trustDot, { backgroundColor: TRUST_DOT[a.trust] }]} />
                <Text style={styles.trustLabel}>{TRUST_LABEL[a.trust]} · {a.artType.split(' ')[0]}</Text>
              </View>
              <Text style={[styles.fitText, preview && styles.fitTextPreview]}>
                {preview ? 'post to see fit' : a.fitScore != null ? `${a.fitScore}% fit` : ''}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: '#11111A',
    borderColor: 'rgba(243,239,232,0.09)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  star: { color: '#F59E0B', fontSize: 14 },
  title: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, letterSpacing: -0.4, color: '#F3EFE8' },
  link: { color: '#FF6B35', fontWeight: '700', fontSize: 10 },
  previewPill: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9 },
  previewPillText: { color: '#B8B1A6', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  previewCopy: { fontSize: 11, color: '#6B6878', lineHeight: 17, marginBottom: 12 },

  scrollRow: { gap: 10, paddingRight: 16 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    width: 210, padding: 10,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderColor: 'rgba(243,239,232,0.05)', borderWidth: 1,
    borderRadius: 14,
  },
  avatar: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#0A0A0F', fontWeight: '700', fontSize: 11 },
  cardBody: { flex: 1, minWidth: 0 },
  cardName: { fontSize: 12, fontWeight: '600', color: '#F3EFE8' },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  trustDot: { width: 5, height: 5, borderRadius: 99 },
  trustLabel: { fontSize: 9, color: '#6B6878' },
  fitText: { fontFamily: 'Outfit-Bold', fontSize: 10, color: '#FF6B35', marginTop: 2 },
  fitTextPreview: { color: '#6B6878', fontFamily: 'Outfit-Regular', fontWeight: '400' },
});
