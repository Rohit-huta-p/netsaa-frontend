// src/components/dashboard/artist/home/ArtistProfileCompletion.tsx
//
// Artist-home profile-completion nudge — the LOCKED "Segments" card
// (DOCS/04-design/mockups/artist-profile-completion-card.html, locked 2026-10-28).
//
// A single quiet card: eyebrow · big N% · "N of 10" · a row of ten sneaker
// icons that fill as the profile fills · one supporting line · ONE CTA that
// opens the profile editor. At 100% it flips to green and softens the CTA to
// "View profile".
//
// This REPLACES the old floating "Playbill" overlay for artists (the scrapped
// bookability concept). The % is the same scorer the Playbill used —
// computeOverallScore(user) from ProfileStrengthWidget — so no new math, we
// just surface it. Pay-as-fact: no field breakdown, no counts. StyleSheet-only.

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Line, G } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Pencil, Eye } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { computeOverallScore } from '@/components/profile/ProfileStrengthWidget';
import { HC, HF } from './ui';

// Mockup's soft mint for the complete state (warmer than the home's #22C55E
// system green, matches the locked card). Dim colour = unfilled sneaker.
const GOOD = '#5FD39A';
const DIM = '#3D3D49';
const ON_ACCENT = '#190B05'; // near-black-brown ink on the orange CTA

// ─── one sneaker (Phosphor `sneaker`, filled) ─────────────────────────────
// Filled body in `currentColor`; sole-seam + 3 lace lines as a dark overlay so
// the shape still reads at ~25px. viewBox is the mockup's tight crop.
function Sneaker({ color }: { color: string }) {
  return (
    <Svg width="100%" height="100%" viewBox="26 36 226 172">
      <Path
        fill={color}
        d="M32,192a8,8,0,0,0,8,8H240a8,8,0,0,0,8-8V167.06a32,32,0,0,0-21.88-30.35l-60.73-20.25A32,32,0,0,1,146.27,99.1L123,44.75a8,8,0,0,0-10-4.27L37.27,68A8,8,0,0,0,32,75.54Z"
      />
      <G stroke="rgba(0,0,0,0.42)" strokeWidth={13} strokeLinecap="round">
        <Line x1="40" y1="168" x2="240" y2="168" />
        <Line x1="120" y1="104" x2="144.55" y2="95.07" />
        <Line x1="104" y1="80" x2="133.51" y2="69.27" />
        <Line x1="136" y1="128" x2="166.61" y2="116.87" />
      </G>
    </Svg>
  );
}

export default function ArtistProfileCompletion() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  const pct = Math.max(0, Math.min(100, computeOverallScore(user)));
  const full = pct >= 100;
  const on = Math.round(pct / 10); // sneakers filled, 0–10
  const liveColor = full ? GOOD : HC.orange;

  const openProfile = () =>
    // Self-profile route → SpotlightProfile (owner). `highlight=true` surfaces
    // the missing fields so "Complete your profile" lands on the gaps.
    router.push((full ? '/(app)/profile' : '/(app)/profile?highlight=true') as any);

  return (
    <View style={styles.card}>
      <Text style={[styles.eyebrow, full && { color: GOOD }]}>YOUR PROFILE</Text>

      <View style={styles.head}>
        <Text style={styles.pct}>{pct}%</Text>
        <Text style={styles.cap}>{on} OF 10</Text>
      </View>

      {/* Decorative — the % text above carries the value for screen readers. */}
      <View style={styles.shoes} importantForAccessibility="no-hide-descendants">
        {Array.from({ length: 10 }, (_, i) => (
          <View key={i} style={styles.shoeCell}>
            <Sneaker color={i < on ? liveColor : DIM} />
          </View>
        ))}
      </View>

      <Text style={styles.sub}>
        {full
          ? 'Your profile is complete. Hirers see the whole picture.'
          : 'Complete your profile so hirers can find and book you.'}
      </Text>

      <Pressable
        onPress={openProfile}
        style={({ pressed }) => [
          styles.cta,
          full ? styles.ctaGhost : styles.ctaFill,
          pressed && { opacity: 0.85 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={full ? 'View profile' : 'Complete your profile'}
      >
        {full ? <Eye size={16} color={HC.cream} /> : <Pencil size={16} color={ON_ACCENT} />}
        <Text style={[styles.ctaTxt, full ? { color: HC.cream } : { color: ON_ACCENT }]}>
          {full ? 'View profile' : 'Complete your profile'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: HC.card,
    borderWidth: 1,
    borderColor: HC.hair,
    borderRadius: 18,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 18,
  },
  eyebrow: { fontFamily: HF.mono, fontSize: 10, letterSpacing: 3, color: HC.orange },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12, marginBottom: 10 },
  pct: { fontFamily: HF.serif, fontSize: 30, color: HC.cream, lineHeight: 32 },
  cap: { fontFamily: HF.mono, fontSize: 10, letterSpacing: 1.5, color: HC.t2, marginBottom: 3 },
  shoes: { flexDirection: 'row', gap: 7, alignItems: 'flex-end' },
  shoeCell: { flex: 1, aspectRatio: 226 / 172 },
  sub: { fontFamily: HF.body, fontSize: 13, lineHeight: 19, color: HC.t2, marginTop: 10 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16, marginTop: 18 },
  ctaFill: { backgroundColor: HC.orange },
  ctaGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: HC.chipb },
  ctaTxt: { fontFamily: HF.bold, fontSize: 14 },
});
