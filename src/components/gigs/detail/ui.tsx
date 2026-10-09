// src/components/gigs/detail/ui.tsx
//
// Shared tokens + small presentational atoms for the A·Minimal gig-detail
// redesign. Tokens mirror the finalized gig-form system (see
// DOCS/02-engineering/NETSA_GigDetail_Redesign_Spec.md §2). StyleSheet-only —
// NativeWind CSS gradients/blur are no-ops in RN, so gradients use
// expo-linear-gradient.

import React from 'react';
import { View, Text, Pressable, StyleSheet, Image, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const C = {
  canvas: '#050505',
  card: '#0B0B0F',
  well: '#101016',
  wellb: '#262630',
  chip: '#141419',
  chipb: '#26262f',
  orange: '#FF6B35',
  orangeSoft: 'rgba(255,107,53,0.10)',
  orangeBorder: 'rgba(255,107,53,0.30)',
  orangeTint: '#FFCBB2',
  green: '#22C55E',
  greenSoft: 'rgba(34,197,94,0.08)',
  greenBorder: 'rgba(34,197,94,0.28)',
  amber: '#FBBF24',
  t1: '#FFFFFF',
  label: '#F0F0F2',
  t2: '#D4D4D8',
  t3: '#A1A1AA',
  t4: '#8B8B99',
  t5: '#54545C',
  t6: '#3F3F46',
  hair: 'rgba(255,255,255,0.06)',
} as const;

// Space Grotesk → Outfit-Bold (display), Space Mono → Outfit-SemiBold uppercase.
export const F = {
  display: 'Outfit-Bold',
  bold: 'Outfit-Bold',
  semi: 'Outfit-SemiBold',
  med: 'Outfit-Medium',
  reg: 'Outfit-Regular',
} as const;

/** Circular icon button (header / save). */
export function IconBtn({
  children,
  onPress,
  label,
  color = C.t4,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  label: string;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [s.ib, pressed && { opacity: 0.6 }]}
    >
      <View style={{ opacity: color === C.t4 ? 1 : 1 }}>{children}</View>
    </Pressable>
  );
}

/** Rounded-square producer avatar — image or warm-gradient initials fallback. */
export function Avatar({ url, initials, size = 56 }: { url?: string | null; initials: string; size?: number }) {
  const radius = Math.round(size * 0.28);
  if (url) {
    return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: radius, borderWidth: 1, borderColor: '#3a2a20' }} />;
  }
  return (
    <LinearGradient
      colors={['#2a1a12', '#3a2418']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: radius, borderWidth: 1, borderColor: '#3a2a20', alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontFamily: F.bold, color: C.orangeTint, fontSize: Math.round(size * 0.34) }}>{initials}</Text>
    </LinearGradient>
  );
}

/**
 * Section heading — Outfit-Bold 18, white (mockup "About this gig" style).
 * Locked "V1 Accent Tick": optional 3px leading bar — orange on the
 * apply-decision trio (`main`), grey on quiet sections, none on "About".
 */
export function SectionTitle({
  children,
  accent = 'none',
  style,
}: {
  children: React.ReactNode;
  accent?: 'main' | 'quiet' | 'none';
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.secTitleRow, style]}>
      {accent !== 'none' && (
        <View
          testID="section-tick"
          style={[s.secTick, { backgroundColor: accent === 'main' ? C.orange : C.t5 }]}
        />
      )}
      <Text style={s.secTitle}>{children}</Text>
    </View>
  );
}

/** Verified check glyph in brand green. */
export function VerifiedMark({ size = 15 }: { size?: number }) {
  // simple rounded check badge
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.greenSoft, borderWidth: 1, borderColor: C.greenBorder, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: C.green, fontSize: Math.round(size * 0.6), fontFamily: F.bold, lineHeight: size }}>✓</Text>
    </View>
  );
}

export function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.bl}>
      <View style={s.blDot} />
      <Text style={s.blTxt}>{children}</Text>
    </View>
  );
}

/** Label / value row with a bottom hairline (Who-we're-looking-for rows). */
export function KVRow({ k, v, sub, last }: { k: string; v: string; sub?: string; last?: boolean }) {
  return (
    <View style={[s.r, last && { borderBottomWidth: 0 }]}>
      <Text style={s.rK}>{k}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.rV}>{v}</Text>
        {!!sub && <Text style={s.rSub}>{sub}</Text>}
      </View>
    </View>
  );
}

export function Chip({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <View style={s.chip}>
      <Text style={[s.chipTxt, muted && { color: C.t4 }]}>{children}</Text>
    </View>
  );
}

/** Orange-tint tag (perks), optional leading icon node. */
export function Tag({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={s.tag}>
      {icon}
      <Text style={s.tagTxt}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  ib: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: C.hair, alignItems: 'center', justifyContent: 'center' },
  secTitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 12 },
  secTick: { width: 3, height: 18, borderRadius: 2, marginRight: 10 },
  secTitle: { fontFamily: F.bold, fontSize: 18, color: C.t1, letterSpacing: -0.3 },
  bl: { flexDirection: 'row', gap: 11, alignItems: 'flex-start', marginTop: 12 },
  blDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.t5, marginTop: 8 },
  blTxt: { flex: 1, fontFamily: F.reg, fontSize: 14, lineHeight: 22, color: C.t3 },
  r: { flexDirection: 'row', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.hair },
  rK: { fontFamily: F.semi, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: C.t4, width: 96, paddingTop: 2 },
  rV: { fontFamily: F.med, fontSize: 14, color: C.t1 },
  rSub: { fontFamily: F.reg, fontSize: 12, color: C.t4, marginTop: 2 },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 10, backgroundColor: C.chip, borderWidth: 1, borderColor: C.chipb },
  chipTxt: { fontFamily: F.reg, fontSize: 13, color: C.t3 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9, backgroundColor: C.orangeSoft, borderWidth: 1, borderColor: C.orangeBorder },
  tagTxt: { fontFamily: F.med, fontSize: 12.5, color: C.orangeTint },
});
