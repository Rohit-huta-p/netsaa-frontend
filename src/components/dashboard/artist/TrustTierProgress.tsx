// netsa-mobile/src/components/dashboard/artist/TrustTierProgress.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useHeroData from '@/hooks/useHeroData';
import {
  computeTierProgress,
  TrustTier,
} from '@/constants/trustTiers';

/**
 * TrustTierProgress — tier-colored progress bar for the artist home.
 *
 * Data comes from `useHeroData` (same queryKey as HeroGreeting, so React
 * Query dedupes the network call). The local math lives in
 * `computeTierProgress` from `@/constants/trustTiers`.
 *
 * Layout (spec Task 19):
 *   - Row 1: current tier name + raw score `32 / 100`
 *   - Row 2: progress bar that fills within the current tier's range
 *            (0-100% of THAT range, not the full 0-100 score band)
 *   - Row 3: points-to-next copy, or "Verified — top tier" when at
 *            the top tier. See TRUST_TIER_THRESHOLDS for the cutoffs.
 *
 * Purely presentational; no mutations. Read-only — matches the rest of
 * Wave 2b.1.
 */

const TIER_COLORS: Record<TrustTier, string> = {
  new: '#71717A',
  rising: '#3B82F6',
  trusted: '#22C55E',
  verified: '#F59E0B',
};

const TIER_LABELS: Record<TrustTier, string> = {
  new: 'New',
  rising: 'Rising',
  trusted: 'Trusted',
  verified: 'Verified',
};

export default function TrustTierProgress() {
  const { data: user, isLoading } = useHeroData();

  // Don't render anything while the score is loading — the dashboard
  // already shows the HeroGreeting skeleton from the same query.
  if (isLoading || !user) return null;

  const rawScore =
    typeof (user as any).trustScore === 'number'
      ? (user as any).trustScore
      : 0;

  const { currentTier, nextTier, currentScore, pointsToNext, progressPct } =
    computeTierProgress(rawScore);

  const tierColor = TIER_COLORS[currentTier];
  const tierLabel = TIER_LABELS[currentTier];
  const nextLabel = nextTier ? TIER_LABELS[nextTier] : null;

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`Trust tier ${tierLabel}, ${currentScore} of 100`}
    >
      <View style={styles.topRow}>
        <View style={styles.tierLabelWrap}>
          <View
            style={[styles.tierDot, { backgroundColor: tierColor }]}
            accessibilityElementsHidden
          />
          <Text style={[styles.tierName, { color: tierColor }]}>
            {tierLabel}
          </Text>
        </View>
        <Text style={styles.score}>
          <Text style={styles.scoreValue}>{currentScore}</Text>
          <Text style={styles.scoreDenom}> / 100</Text>
        </Text>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.max(2, progressPct)}%`, backgroundColor: tierColor },
          ]}
        />
      </View>

      <Text style={styles.subtext}>
        {nextLabel
          ? `${pointsToNext} ${pointsToNext === 1 ? 'point' : 'points'} to ${nextLabel}`
          : 'Verified — top tier'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F0F12',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1F1F23',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tierLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tierName: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  score: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: '#A1A1AA',
  },
  scoreValue: {
    fontFamily: 'Outfit-SemiBold',
    color: '#F5F5F5',
  },
  scoreDenom: {
    color: '#71717A',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1F1F23',
    overflow: 'hidden',
    marginBottom: 10,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  subtext: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: '#A1A1AA',
  },
});
