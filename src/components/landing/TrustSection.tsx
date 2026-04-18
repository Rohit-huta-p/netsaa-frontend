import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { LANDING } from '@/constants/landingTheme';

const COMPARE = [
  { before: 'WhatsApp chaos', after: 'Professional profile' },
  { before: 'Cash payments', after: 'Instant bank pay' },
  { before: 'No portfolio', after: 'Video portfolio' },
  { before: 'Invisible to hirers', after: 'Hirers find you' },
  { before: 'No proof of work', after: 'Every gig on record' },
];

const TIERS = [
  { name: 'New', color: LANDING.trust.new, benefit: '2 active gigs' },
  { name: 'Rising', color: LANDING.trust.rising, benefit: 'Full marketplace access' },
  { name: 'Trusted', color: LANDING.trust.trusted, benefit: 'Priority in search' },
  { name: 'Verified', color: LANDING.trust.verified, benefit: 'Lower fees, featured' },
];

function Ornament() {
  return (
    <View style={styles.ornament}>
      <View style={styles.ornamentLine} />
      <View style={styles.ornamentDiamond} />
      <View style={styles.ornamentLine} />
    </View>
  );
}

export default function TrustSection() {
  return (
    <>
      <Ornament />
      <View style={styles.section}>
        <Text style={styles.label}>TRUST</Text>
        <Text style={styles.heading}>
          Your reputation <Text style={{ color: LANDING.accent.green }}>grows with every gig.</Text>
        </Text>

        {/* Before/After Header */}
        <View style={styles.compareHeader}>
          <View style={[styles.compareHeaderLabel, { justifyContent: 'flex-end' }]}>
            <View style={[styles.headerDot, { backgroundColor: LANDING.gradient.orange }]} />
            <Text style={[styles.headerLabelText, { color: LANDING.gradient.orange }]}>Before</Text>
          </View>
          <View style={{ width: 32 }} />
          <View style={styles.compareHeaderLabel}>
            <View style={[styles.headerDot, { backgroundColor: LANDING.accent.green }]} />
            <Text style={[styles.headerLabelText, { color: LANDING.accent.green }]}>With NETSA</Text>
          </View>
        </View>

        {/* Compare Rows */}
        {COMPARE.map((row, i) => (
          <View key={i} style={[styles.compareRow, i === COMPARE.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={styles.beforeText}>{row.before}</Text>
            <View style={styles.arrowWrap}>
              <ArrowRight size={16} color={LANDING.accent.green} strokeWidth={2} />
            </View>
            <Text style={styles.afterText}>{row.after}</Text>
          </View>
        ))}

        {/* Trust Tiers */}
        <View style={styles.tierTrack}>
          {/* Gradient line behind */}
          <LinearGradient
            colors={TIERS.map(t => t.color)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tierLine}
          />
          {TIERS.map((tier, i) => (
            <View key={i} style={styles.tier}>
              <View style={[styles.tierDot, { backgroundColor: tier.color }]}>
                <View style={[styles.tierDotRing, { borderColor: tier.color }]} />
              </View>
              <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
              <Text style={styles.tierBenefit}>{tier.benefit}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: LANDING.spacing.sectionVertical,
    paddingHorizontal: LANDING.spacing.px,
    backgroundColor: LANDING.bg.primary,
  },
  label: {
    fontFamily: LANDING.fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 4,
    color: LANDING.accent.green,
    marginBottom: 24,
  },
  heading: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 28,
    lineHeight: 34,
    color: LANDING.text.primary,
    marginBottom: 40,
  },
  compareHeader: {
    flexDirection: 'row',
    paddingBottom: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  compareHeaderLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerLabelText: {
    fontFamily: LANDING.fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  beforeText: {
    flex: 1,
    fontFamily: LANDING.fonts.sans,
    fontSize: 14,
    color: LANDING.text.dim,
    textAlign: 'right',
    paddingRight: 12,
    textDecorationLine: 'line-through',
    textDecorationColor: 'rgba(249,115,22,0.3)',
  },
  arrowWrap: {
    width: 32,
    alignItems: 'center',
  },
  afterText: {
    flex: 1,
    fontFamily: LANDING.fonts.sansSemiBold,
    fontSize: 14,
    color: LANDING.text.primary,
    paddingLeft: 12,
  },
  tierTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 48,
    paddingTop: 40,
    position: 'relative',
  },
  tierLine: {
    position: 'absolute',
    top: 49,
    left: 30,
    right: 30,
    height: 3,
    borderRadius: 2,
    opacity: 0.3,
  },
  tier: {
    flex: 1,
    alignItems: 'center',
    zIndex: 2,
  },
  tierDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginBottom: 12,
  },
  tierDotRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 14,
    borderWidth: 2,
    opacity: 0.2,
  },
  tierName: {
    fontFamily: LANDING.fonts.sansBold,
    fontSize: 12,
    marginBottom: 4,
  },
  tierBenefit: {
    fontFamily: LANDING.fonts.sans,
    fontSize: 10,
    color: LANDING.text.dim,
    textAlign: 'center',
    lineHeight: 15,
  },
  ornament: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: LANDING.spacing.px,
    backgroundColor: LANDING.bg.primary,
  },
  ornamentLine: {
    flex: 1,
    maxWidth: 200,
    height: 1,
    backgroundColor: LANDING.border.default,
  },
  ornamentDiamond: {
    width: 6,
    height: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    transform: [{ rotate: '45deg' }],
  },
});
