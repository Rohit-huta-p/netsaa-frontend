/**
 * TrustAnchorCard — opening "Standing" card on hirer home.
 *
 * Design source: DOCS/designs/hirer-home-v1.html (Trust anchor section).
 * Plan: DOCS/NETSA_Hirer_Home_RN_Translation.md §6.2.
 *
 * Layout:
 *   - Orange-tint gradient + radial glow top-right
 *   - "Standing" micro label
 *   - Tier name (serif 30pt) with status dot
 *   - Right-aligned mono "PROGRESS" + serif fraction (e.g., 7/10)
 *   - Animated progress bar (0 to target on mount)
 *   - Footer copy with next-tier callout
 *
 * Replaces (or supplements) TrustTierProgress.
 *
 * TODO §6.2 — wire to existing tier/hire data. Decide whether to retire
 * TrustTierProgress or keep both for one release.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// TODO §4: import LinearGradient from 'react-native-linear-gradient' (or 'expo-linear-gradient' if already used).
// TODO §4: import Animated, useSharedValue, useAnimatedStyle, withTiming from 'react-native-reanimated'.

type Tier = 'new' | 'rising' | 'trusted' | 'verified';

const TIER_LABEL: Record<Tier, string> = {
  new: 'New',
  rising: 'Rising',
  trusted: 'Trusted',
  verified: 'Verified',
};

const TIER_DOT_COLOR: Record<Tier, string> = {
  new: '#6B6878',
  rising: '#8B5CF6',
  trusted: '#22C55E',
  verified: '#F59E0B',
};

const TIER_NEXT_LABEL: Record<Tier, string | null> = {
  new: 'Rising',
  rising: 'Trusted',
  trusted: 'Verified',
  verified: null,
};

interface Props {
  tier?: Tier;
  /** Current count toward the next tier (e.g., 7). */
  progress?: number;
  /** Required count for the next tier (e.g., 10). */
  goal?: number;
}

export default function TrustAnchorCard({
  tier = 'trusted',
  progress = 7,
  goal = 10,
}: Props) {
  const fillPct = goal > 0 ? Math.min(1, progress / goal) : 0;
  const nextTier = TIER_NEXT_LABEL[tier];
  const remaining = Math.max(0, goal - progress);
  const tierLabel = TIER_LABEL[tier];
  const dotColor = TIER_DOT_COLOR[tier];

  return (
    <View style={styles.wrap}>
      {/* TODO §4: wrap with LinearGradient + radial glow overlay */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.micro}>STANDING</Text>
          <View style={styles.rule} />
        </View>

        <View style={styles.tierRow}>
          <View style={styles.tierLeft}>
            <View style={styles.dotWithName}>
              <View style={[styles.dot, { backgroundColor: dotColor }]} />
              <Text style={styles.tierName}>{tierLabel}</Text>
            </View>
            <Text style={styles.tierCaption}>
              {tier === 'new'
                ? 'Build your standing with each clean hire · Tier 1 of 4'
                : `Reputation in good standing · Tier ${tier === 'rising' ? 2 : tier === 'trusted' ? 3 : 4} of 4`}
            </Text>
          </View>

          <View style={styles.progressRight}>
            <Text style={styles.progressLabel}>PROGRESS</Text>
            <Text style={styles.progressFraction}>
              {progress}<Text style={styles.progressDenom}>/{goal}</Text>
            </Text>
          </View>
        </View>

        <View
          style={styles.barTrack}
          accessibilityRole="progressbar"
          accessibilityValue={{ now: progress, min: 0, max: goal }}
        >
          {/* TODO §4: width animates from 0 to fillPct on mount via Reanimated useAnimatedStyle */}
          <View style={[styles.barFill, { width: `${fillPct * 100}%` }]} />
        </View>

        {nextTier ? (
          <Text style={styles.footnote}>
            {remaining === 1
              ? `One more clean hire earns `
              : `${remaining} more clean hires earns `}
            <Text style={styles.footnoteTier}>{nextTier}</Text>
            .
          </Text>
        ) : (
          <Text style={styles.footnote}>Top tier. Keep delivering.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 24, paddingBottom: 28 },
  card: {
    backgroundColor: '#14111B',
    borderColor: 'rgba(243,239,232,0.09)',
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
    overflow: 'hidden',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  micro: {
    fontSize: 9,
    letterSpacing: 2,
    fontFamily: 'Outfit_700Bold',
    color: '#B8B1A6',
  },
  rule: { flex: 1, height: 1, backgroundColor: 'rgba(243,239,232,0.14)' },

  tierRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, gap: 16 },
  tierLeft: { flex: 1 },
  dotWithName: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 99 },
  tierName: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 30,
    letterSpacing: -1,
    color: '#F3EFE8',
  },
  tierCaption: { fontSize: 12, color: '#6B6878' },

  progressRight: { alignItems: 'flex-end' },
  progressLabel: { fontSize: 10, color: '#6B6878', fontFamily: 'Outfit_700Bold', letterSpacing: 1 },
  progressFraction: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 24, color: '#F59E0B' },
  progressDenom: { color: '#3F3D4A' },

  barTrack: {
    height: 3,
    backgroundColor: 'rgba(243,239,232,0.05)',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    // TODO §4: animate via Reanimated. Static fill for now.
    borderRadius: 99,
  },

  footnote: { fontSize: 11, color: '#6B6878' },
  footnoteTier: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 13, color: '#F59E0B' },
});
