/**
 * HeroGreetingHirer — opening card on hirer home.
 *
 * Layout (spec §5.1 #1):
 *   - Devanagari स्वागत (Swaagat) watermark at 80pt, 0.08 opacity, top-right.
 *     NOTE: keep commented-out initially to match artist-home's current
 *     state (the watermark design pass is deferred to Plan 6 polish). Enable
 *     by uncommenting the <Text style={styles.watermark}> block.
 *   - "Swaagat, {firstName}." headline in DM Serif Display 32pt.
 *   - Verified-business chip (gold border) when organizer.verification
 *     .verificationLevel !== 'none'.
 *   - Rating-as-hirer row: "★ {rating} · {reviews} reviews from artists"
 *     hidden when reviews = 0.
 *
 * Data via useHeroDataHirer — consumer needs nothing.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SectionCard from '../SectionCard';
import useHeroDataHirer from '@/hooks/useHeroDataHirer';

const VERIFICATION_LABEL: Record<string, string> = {
  none: '',
  basic: 'Verified',
  business: 'Verified Business',
  trusted: 'Trusted Hirer',
};

export default function HeroGreetingHirer() {
  const { user, organizer, isLoading } = useHeroDataHirer();

  if (isLoading || !user) return <SectionCard title="" isLoading />;

  const displayName = (user as any).displayName ?? '';
  const firstName = displayName.split(' ')[0] ?? '';

  if (!firstName) {
    return (
      <View style={styles.card} accessibilityRole="summary" accessibilityLabel="Welcome">
        {/* <Text style={styles.watermark} allowFontScaling={false} numberOfLines={1}>
          स्वागत
        </Text> */}
        <Text style={styles.greeting}>Welcome</Text>
      </View>
    );
  }

  const verificationLevel = organizer?.verification?.verificationLevel ?? 'none';
  const verificationLabel = VERIFICATION_LABEL[verificationLevel];
  const rating = organizer?.organizerStats?.averageRating;
  const reviewCount = organizer?.organizerStats?.totalReviews;
  const showRating =
    typeof rating === 'number' && typeof reviewCount === 'number' && reviewCount > 0;

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`Hero. Swaagat, ${firstName}`}
    >
      {/* <Text style={styles.watermark} allowFontScaling={false} numberOfLines={1}>
        स्वागत
      </Text> */}
      <View style={styles.foreground}>
        <Text style={styles.greeting} numberOfLines={2}>
          {`Swaagat, ${firstName}.`}
        </Text>

        {verificationLabel ? (
          <View style={styles.verifiedChip} accessibilityRole="text" accessibilityLabel={verificationLabel}>
            <View style={styles.verifiedDot} />
            <Text style={styles.verifiedLabel}>{verificationLabel}</Text>
          </View>
        ) : null}

        {showRating ? (
          <Text style={styles.ratingRow} accessibilityLabel={`${rating} stars, ${reviewCount} reviews from artists`}>
            <Text style={styles.star}>★ </Text>
            {rating!.toFixed(1)}
            <Text style={styles.dot}> · </Text>
            {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'} from artists
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
  foreground: { position: 'relative' },
  greeting: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 32,
    lineHeight: 38,
    color: '#F5F5F5',
    marginBottom: 12,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  verifiedDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6, backgroundColor: '#F59E0B' },
  verifiedLabel: { fontFamily: 'Outfit-SemiBold', fontSize: 12, letterSpacing: 0.4, color: '#F59E0B' },
  ratingRow: { marginTop: 10, fontFamily: 'Outfit-Regular', fontSize: 13, color: '#A1A1AA' },
  star: { color: '#F59E0B' },
  dot: { color: '#52525B' },
});
