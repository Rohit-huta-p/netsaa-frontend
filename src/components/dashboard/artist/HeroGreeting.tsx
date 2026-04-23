// netsa-mobile/src/components/dashboard/artist/HeroGreeting.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SectionCard from '../SectionCard';

/**
 * HeroGreeting — opening card on the artist home dashboard.
 *
 * Layout (spec Task 12):
 *   - A large faint Devanagari watermark (नमस्ते) sits BEHIND the greeting
 *     text. Uses DM Serif Display at 80pt with very low opacity so it
 *     reads as a decorative brand element, not content.
 *   - Foreground headline "Namaste, {firstName}." in DM Serif Display 32pt.
 *   - Trust-tier chip (small capsule) showing the current tier with
 *     tier-specific color. Hidden when the user has no `trustTier`.
 *   - Rating row `★ {rating} · {count} reviews` — hidden if reviewCount
 *     is 0 or undefined so new artists don't see "0 reviews".
 *
 * The component wraps SectionCard to participate in the dashboard's
 * loading/error chrome, but passes an empty string for the title because
 * the hero has its own visual hierarchy (no "Hero" label).
 *
 * Purely presentational — parent passes a resolved user object.
 */

export interface HeroGreetingProps {
  user:
  | {
    displayName?: string;
    trustTier?: string;
    trustScore?: number;
    cached?: {
      averageRating?: number;
      totalReviews?: number;
    };
  }
  | null
  | undefined;
  isLoading?: boolean;
}

type TierKey = 'new' | 'rising' | 'trusted' | 'verified';

const TIER_COLORS: Record<TierKey, string> = {
  new: '#71717A',
  rising: '#3B82F6',
  trusted: '#22C55E',
  verified: '#F59E0B',
};

const TIER_LABELS: Record<TierKey, string> = {
  new: 'New',
  rising: 'Rising',
  trusted: 'Trusted',
  verified: 'Verified',
};

function normalizeTier(tier?: string): TierKey | null {
  if (!tier) return null;
  const t = tier.toLowerCase();
  if (t === 'new' || t === 'rising' || t === 'trusted' || t === 'verified') {
    return t;
  }
  return null;
}

export default function HeroGreeting({ user, isLoading }: HeroGreetingProps) {
  // Loading OR no user => show the skeleton chrome so layout stays stable
  // as hero data streams in.
  if (isLoading || !user) {
    return <SectionCard title="" isLoading />;
  }

  const displayName = user.displayName ?? '';
  const firstName = displayName.split(' ')[0] ?? '';

  // With no displayName at all, render a minimal placeholder so the card
  // still provides the dashboard's visual rhythm without a broken
  // "Namaste, ." sentence.
  if (!firstName) {
    return (
      <View style={styles.card} accessibilityRole="summary" accessibilityLabel="Welcome">
        <Text style={styles.watermark} allowFontScaling={false} numberOfLines={1}>
          नमस्ते
        </Text>
        <Text style={styles.greeting}>Welcome</Text>
      </View>
    );
  }

  const tierKey = normalizeTier(user.trustTier);
  const rating = user.cached?.averageRating;
  const reviewCount = user.cached?.totalReviews;
  const showRating =
    typeof rating === 'number' && typeof reviewCount === 'number' && reviewCount > 0;

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`Hero. Namaste, ${firstName}`}
    >
      {/* <Text style={styles.watermark} allowFontScaling={false} numberOfLines={1}>
        नमस्ते
      </Text> */}

      <View style={styles.foreground}>
        <Text style={styles.greeting} numberOfLines={2}>
          {`Namaste, ${firstName}.`}
        </Text>

        {tierKey ? (
          <View
            style={[styles.tierChip, { borderColor: TIER_COLORS[tierKey] }]}
            accessibilityRole="text"
            accessibilityLabel={`Trust tier ${TIER_LABELS[tierKey]}`}
          >
            <View style={[styles.tierDot, { backgroundColor: TIER_COLORS[tierKey] }]} />
            <Text style={[styles.tierLabel, { color: TIER_COLORS[tierKey] }]}>
              {TIER_LABELS[tierKey]}
            </Text>
          </View>
        ) : null}

        {showRating ? (
          <Text style={styles.ratingRow} accessibilityLabel={`${rating} stars, ${reviewCount} reviews`}>
            <Text style={styles.star}>★ </Text>
            {rating!.toFixed(1)}
            <Text style={styles.dot}> · </Text>
            {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
          </Text>
        ) : null}
      </View>
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
    overflow: 'hidden',
    minHeight: 120,
    justifyContent: 'center',
  },
  watermark: {
    position: 'absolute',
    right: 12,
    top: 8,
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 80,
    lineHeight: 88,
    color: '#FFFFFF',
    opacity: 0.08,
  },
  foreground: {
    position: 'relative',
  },
  greeting: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 32,
    lineHeight: 38,
    color: '#F5F5F5',
    marginBottom: 12,
  },
  tierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  tierLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 12,
    letterSpacing: 0.4,
  },
  ratingRow: {
    marginTop: 10,
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: '#A1A1AA',
  },
  star: {
    color: '#F59E0B',
  },
  dot: {
    color: '#52525B',
  },
});
