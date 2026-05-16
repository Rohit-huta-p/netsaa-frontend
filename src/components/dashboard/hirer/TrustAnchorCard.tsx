/**
 * TrustAnchorCard — opening "Standing" card on hirer home.
 *
 * Design source: DOCS/designs/hirer-home-v1.html (Trust anchor section).
 * Plan: DOCS/NETSA_Hirer_Home_RN_Translation.md §6.2.
 *
 * Replaces TrustTierProgress on the hirer home with a richer editorial
 * presentation. Reads the same data model:
 *   - `user.trustScore` (0-100)
 *   - `computeTierProgress(score)` returns
 *     { currentTier, nextTier, currentScore, pointsToNext, progressPct }
 *
 * Visual language matches the finalized HTML mock:
 *   - Orange-tinted gradient overlay + radial glow.
 *   - "Standing" eyebrow + hairline rule.
 *   - Tier name (DM Serif 30pt) with status dot.
 *   - Right-aligned mono "PROGRESS" + serif fraction.
 *   - Animated progress bar (0 to progressPct on viewport-enter).
 *   - Next-tier callout copy underneath.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated as RNAnimated,
  Easing,
  AccessibilityInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useHeroDataHirer from '@/hooks/useHeroDataHirer';
import { computeTierProgress, type TrustTier } from '@/constants/trustTiers';

const TIER_LABEL: Record<TrustTier, string> = {
  new: 'New',
  rising: 'Rising',
  trusted: 'Trusted',
  verified: 'Verified',
};

const TIER_DOT_COLOR: Record<TrustTier, string> = {
  new: '#6B6878',
  rising: '#8B5CF6',
  trusted: '#22C55E',
  verified: '#F59E0B',
};

const TIER_OF_FOUR: Record<TrustTier, 1 | 2 | 3 | 4> = {
  new: 1,
  rising: 2,
  trusted: 3,
  verified: 4,
};

const NEXT_TIER_ACCENT: Record<TrustTier, string> = {
  new: '#8B5CF6',
  rising: '#22C55E',
  trusted: '#F59E0B',
  verified: '#F59E0B',
};

export default function TrustAnchorCard() {
  const { user, isLoading } = useHeroDataHirer();
  const widthAnim = useRef(new RNAnimated.Value(0)).current;

  const rawScore =
    typeof (user as any)?.trustScore === 'number' ? (user as any).trustScore : 0;

  const { currentTier, nextTier, currentScore, pointsToNext, progressPct } =
    computeTierProgress(rawScore);

  useEffect(() => {
    if (isLoading || !user) return;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((rm) => {
      if (cancelled) return;
      const target = Math.max(0, Math.min(1, progressPct / 100));
      RNAnimated.timing(widthAnim, {
        toValue: target,
        duration: rm ? 0 : 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });
    return () => {
      cancelled = true;
    };
  }, [isLoading, user, progressPct, widthAnim]);

  if (isLoading || !user) {
    return <View style={styles.skeleton} accessibilityElementsHidden />;
  }

  const tierLabel = TIER_LABEL[currentTier];
  const dotColor = TIER_DOT_COLOR[currentTier];
  const nextLabel = nextTier ? TIER_LABEL[nextTier] : null;
  const nextAccent = NEXT_TIER_ACCENT[currentTier];
  const tierOf = TIER_OF_FOUR[currentTier];
  const fillWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <LinearGradient
          colors={['rgba(255,107,53,0.10)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.7 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['rgba(255,107,53,0.30)', 'transparent']}
          start={{ x: 0.8, y: 0 }}
          end={{ x: 1.3, y: 0.5 }}
          style={styles.glow}
          pointerEvents="none"
        />

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
              {currentTier === 'verified'
                ? 'Top tier · keep delivering'
                : `Reputation in good standing · Tier ${tierOf} of 4`}
            </Text>
          </View>

          <View style={styles.progressRight}>
            <Text style={styles.progressLabel}>SCORE</Text>
            <Text style={styles.progressFraction} numberOfLines={1}>
              {currentScore}
              <Text style={styles.progressDenom}>/100</Text>
            </Text>
          </View>
        </View>

        <View
          style={styles.barTrack}
          accessibilityRole="progressbar"
          accessibilityValue={{ now: Math.round(progressPct), min: 0, max: 100 }}
          accessibilityLabel={
            nextLabel
              ? `${tierLabel} tier, ${pointsToNext} points to ${nextLabel}`
              : `${tierLabel} tier, top tier`
          }
        >
          <RNAnimated.View
            style={[
              styles.barFill,
              { width: fillWidth, backgroundColor: dotColor },
            ]}
          />
        </View>

        {nextLabel ? (
          <Text style={styles.footnote}>
            {pointsToNext} {pointsToNext === 1 ? 'point' : 'points'} to{' '}
            <Text style={[styles.footnoteTier, { color: nextAccent }]}>
              {nextLabel}
            </Text>
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
  glow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 140,
    height: 140,
  },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  micro: {
    fontSize: 9,
    letterSpacing: 2,
    fontFamily: 'Outfit-Bold',
    color: '#B8B1A6',
  },
  rule: { flex: 1, height: 1, backgroundColor: 'rgba(243,239,232,0.14)' },

  tierRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 16,
  },
  tierLeft: { flex: 1 },
  dotWithName: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 99 },
  tierName: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 30,
    letterSpacing: -1,
    color: '#F3EFE8',
    lineHeight: 32,
  },
  tierCaption: { fontSize: 12, color: '#6B6878' },

  progressRight: { alignItems: 'flex-end' },
  progressLabel: {
    fontSize: 10,
    color: '#6B6878',
    fontFamily: 'Outfit-Bold',
    letterSpacing: 1,
  },
  progressFraction: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 24,
    color: '#F59E0B',
  },
  progressDenom: { color: '#3F3D4A' },

  barTrack: {
    height: 3,
    backgroundColor: 'rgba(243,239,232,0.05)',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 10,
  },
  barFill: { height: '100%', borderRadius: 99 },

  footnote: { fontSize: 11, color: '#6B6878' },
  footnoteTier: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 13 },

  skeleton: {
    marginHorizontal: 24,
    marginBottom: 28,
    height: 160,
    borderRadius: 22,
    backgroundColor: '#0D0B12',
  },
});
