import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Search, CheckCircle } from 'lucide-react-native';
import { LANDING } from '@/constants/landingTheme';

const PILLARS = [
  {
    icon: Zap,
    iconColor: LANDING.gradient.pink,
    iconBg: 'rgba(236,72,153,0.08)',
    title: 'Instant Payments',
    desc: '88% hits your bank the moment the show ends. Razorpay splits it in seconds. No chasing. No cash.',
  },
  {
    icon: Search,
    iconColor: LANDING.accent.cyan,
    iconBg: 'rgba(6,182,212,0.08)',
    title: 'Get Discovered',
    desc: 'Your portfolio, trust score, and art forms. Visible to every hirer in your city. They find you.',
  },
  {
    icon: CheckCircle,
    iconColor: LANDING.accent.green,
    iconBg: 'rgba(34,211,153,0.08)',
    title: 'Trust That Compounds',
    desc: 'Every verified payment, every review builds your reputation. Your career on record, not on WhatsApp.',
  },
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

function AppPhoneMockup() {
  return (
    <View style={styles.phone}>
      <View style={styles.phoneNotch} />
      <View style={styles.phoneScreen}>
        <View style={styles.phoneNav}>
          <Text style={styles.phoneLogo}>NETSA</Text>
          <LinearGradient colors={[LANDING.accent.purple, LANDING.gradient.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.phoneAvatar} />
        </View>
        <View style={styles.phoneSearch}>
          <Text style={styles.phoneSearchText}>Search artists, gigs, events...</Text>
        </View>
        <Text style={styles.phoneSectionTitle}>Top Artists in Pune</Text>
        <View style={styles.phoneCards}>
          {[
            { name: 'Priya S.', meta: 'Kathak artist', price: 'Rs.15K' },
            { name: 'Rohan M.', meta: 'Vocalist', price: 'Rs.25K' },
          ].map((card, i) => (
            <View key={i} style={styles.phoneCard}>
              <LinearGradient
                colors={i === 0 ? [LANDING.accent.purple, LANDING.gradient.orange] : [LANDING.gradient.orange, LANDING.gradient.gold]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.phoneCardImg}
              />
              <View style={styles.phoneCardBody}>
                <Text style={styles.phoneCardName}>{card.name}</Text>
                <Text style={styles.phoneCardMeta}>{card.meta}</Text>
                <Text style={styles.phoneCardPrice}>{card.price}</Text>
              </View>
            </View>
          ))}
        </View>
        <Text style={styles.phoneSectionTitle}>Open Gigs</Text>
        {/* Gig 1 */}
        <View style={styles.phoneGig}>
          <Text style={styles.phoneGigTitle}>Sangeet Performance</Text>
          <Text style={styles.phoneGigDetail}>Dec 14 · Koregaon Park · 4 artists</Text>
          <View style={styles.phoneGigBadge}>
            <Text style={styles.phoneGigBadgeText}>Rs. 8,000/artist</Text>
          </View>
        </View>
        {/* Gig 2 */}
        <View style={[styles.phoneGig, { marginTop: 8 }]}>
          <Text style={styles.phoneGigTitle}>Corporate Event</Text>
          <Text style={styles.phoneGigDetail}>Dec 20 · Hinjewadi · Solo act</Text>
          <View style={styles.phoneGigBadge}>
            <Text style={styles.phoneGigBadgeText}>Rs. 35,000</Text>
          </View>
        </View>
        {/* Bottom Nav */}
        <View style={styles.phoneBottomNav}>
          {[
            { label: 'Home', active: true },
            { label: 'Gigs', active: false },
            { label: 'Events', active: false },
            { label: 'Profile', active: false },
          ].map((item, i) => (
            <View key={i} style={styles.phoneNavItem}>
              <View style={[styles.phoneNavIcon, item.active && styles.phoneNavIconActive]} />
              <Text style={[styles.phoneNavLabel, item.active && styles.phoneNavLabelActive]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function SolutionSection() {
  return (
    <>
      <Ornament />
      <View style={styles.section}>
        <Text style={styles.label}>THE ANSWER</Text>
        <Text style={styles.heading}>
          A platform built by a performer, <Text style={{ color: LANDING.accent.cyan }}>for performers.</Text>
        </Text>

        <View style={styles.pillarsAndPhone}>
          <View style={styles.pillars}>
            {PILLARS.map((p, i) => (
              <View key={i} style={styles.pillar}>
                <View style={[styles.pillarIcon, { backgroundColor: p.iconBg }]}>
                  <p.icon size={22} color={p.iconColor} strokeWidth={1.8} />
                </View>
                <Text style={styles.pillarTitle}>{p.title}</Text>
                <Text style={styles.pillarDesc}>{p.desc}</Text>
              </View>
            ))}
          </View>

          <AppPhoneMockup />
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
    textTransform: 'uppercase',
    color: LANDING.accent.cyan,
    marginBottom: 24,
  },
  heading: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 28,
    lineHeight: 34,
    color: LANDING.text.primary,
    marginBottom: 40,
  },
  pillarsAndPhone: {
    gap: 32,
  },
  pillars: {
    gap: 16,
  },
  pillar: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: LANDING.bg.elevated,
    borderWidth: 1,
    borderColor: LANDING.border.default,
  },
  pillarIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pillarTitle: {
    fontFamily: LANDING.fonts.sansBold,
    fontSize: 18,
    color: LANDING.text.primary,
    marginBottom: 8,
  },
  pillarDesc: {
    fontFamily: LANDING.fonts.sans,
    fontSize: 14,
    color: LANDING.text.mid,
    lineHeight: 24,
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
  // Phone mockup
  phone: {
    width: 260,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: LANDING.bg.elevated,
    alignSelf: 'center',
    marginTop: 16,
  },
  phoneNotch: {
    width: 100,
    height: 24,
    backgroundColor: '#000',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    alignSelf: 'center',
  },
  phoneScreen: {
    padding: 16,
  },
  phoneNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  phoneLogo: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 13,
    color: LANDING.gradient.orange,
    letterSpacing: 1,
  },
  phoneAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  phoneSearch: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: LANDING.border.default,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  phoneSearchText: {
    fontSize: 11,
    color: LANDING.text.dim,
    fontFamily: LANDING.fonts.sans,
  },
  phoneSectionTitle: {
    fontFamily: LANDING.fonts.sansBold,
    fontSize: 9,
    letterSpacing: 1,
    color: LANDING.text.mid,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  phoneCards: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  phoneCard: {
    flex: 1,
    minWidth: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: LANDING.border.default,
  },
  phoneCardImg: {
    height: 70,
    opacity: 0.35,
  },
  phoneCardBody: {
    padding: 8,
  },
  phoneCardName: {
    fontSize: 10,
    fontFamily: LANDING.fonts.sansSemiBold,
    color: LANDING.text.primary,
  },
  phoneCardMeta: {
    fontSize: 8,
    color: LANDING.text.dim,
    fontFamily: LANDING.fonts.sans,
    marginTop: 2,
  },
  phoneCardPrice: {
    fontSize: 10,
    fontFamily: LANDING.fonts.sansBold,
    color: LANDING.gradient.orange,
    marginTop: 3,
  },
  phoneGig: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: LANDING.border.default,
  },
  phoneGigTitle: {
    fontSize: 11,
    fontFamily: LANDING.fonts.sansSemiBold,
    color: LANDING.text.primary,
  },
  phoneGigDetail: {
    fontSize: 9,
    color: LANDING.text.dim,
    fontFamily: LANDING.fonts.sans,
    marginTop: 2,
  },
  phoneGigBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(249,115,22,0.08)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginTop: 4,
  },
  phoneGigBadgeText: {
    fontSize: 8,
    fontFamily: LANDING.fonts.sansBold,
    color: LANDING.gradient.orange,
  },
  // Bottom nav bar in phone
  phoneBottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: LANDING.border.default,
    marginTop: 8,
  },
  phoneNavItem: {
    alignItems: 'center',
  },
  phoneNavIcon: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 2,
  },
  phoneNavIconActive: {
    backgroundColor: 'rgba(249,115,22,0.1)',
  },
  phoneNavLabel: {
    fontSize: 8,
    fontFamily: LANDING.fonts.sans,
    color: LANDING.text.dim,
  },
  phoneNavLabelActive: {
    color: LANDING.gradient.orange,
  },
});
