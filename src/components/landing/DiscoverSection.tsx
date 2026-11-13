import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { LANDING } from '@/constants/landingTheme';

const OPPS = [
  { type: 'Gig', title: 'Live Music Performance', desc: 'Explore this opportunity and connect with creators worldwide.' },
  { type: 'Workshop', title: 'Experimental Photography', desc: 'Explore this opportunity and connect with creators worldwide.' },
  { type: 'Job', title: 'Motion Graphics Artist', desc: 'Explore this opportunity and connect with creators worldwide.' },
  { type: 'Collaboration', title: 'Short Film Project', desc: 'Explore this opportunity and connect with creators worldwide.' },
];

export default function DiscoverSection() {
  return (
    <View style={styles.section}>
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      {/* Heading — right aligned to match web */}
      <View style={styles.head}>
        <Text style={styles.h2}>Discover{'\n'}
          <MaskedView maskElement={<Text style={styles.h2Accent}>Opportunities</Text>}>
            <LinearGradient
              colors={['#ff4d88', '#ff822e', '#ff976b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.h2Accent, { opacity: 0 }]}>Opportunities</Text>
            </LinearGradient>
          </MaskedView>
        </Text>
        <Text style={styles.sub}>Gigs, workshops, and collaborations — all in one place.</Text>
      </View>

      {/* 2-col grid */}
      <View style={styles.grid}>
        {OPPS.map((opp, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.cardType}>{opp.type}</Text>
            <Text style={styles.cardTitle}>{opp.title}</Text>
            <Text style={styles.cardDesc}>{opp.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: 80,
    paddingBottom: 80,
    paddingHorizontal: LANDING.spacing.px,
    backgroundColor: LANDING.bg.primary,
    overflow: 'hidden',
  },
  glow1: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 9999,
    backgroundColor: LANDING.gradient.orange,
    opacity: 0.04,
    top: -200,
    right: -60,
  },
  glow2: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 9999,
    backgroundColor: LANDING.gradient.peach,
    opacity: 0.035,
    bottom: -100,
    left: -80,
  },
  head: {
    alignItems: 'flex-end',
    marginBottom: 40,
  },
  h2: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 40,
    lineHeight: 46,
    color: LANDING.text.primary,
    textAlign: 'right',
  },
  h2Accent: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 40,
    lineHeight: 46,
    textAlign: 'right',
  },
  sub: {
    fontFamily: LANDING.fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    color: LANDING.text.mid,
    textAlign: 'right',
    maxWidth: 300,
    marginTop: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    flexShrink: 0,
    backgroundColor: 'rgba(17,17,19,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(39,39,42,0.3)',
    borderRadius: 16,
    padding: 20,
  },
  cardType: {
    fontFamily: LANDING.fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: LANDING.gradient.rose,
    marginBottom: 6,
  },
  cardTitle: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 17,
    lineHeight: 23,
    color: LANDING.text.primary,
    marginBottom: 6,
  },
  cardDesc: {
    fontFamily: LANDING.fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: LANDING.text.mid,
  },
});
