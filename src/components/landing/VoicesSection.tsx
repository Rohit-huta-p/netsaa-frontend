import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { LANDING } from '@/constants/landingTheme';

const TESTIMONIALS = [
  {
    quote: '"NETSA helped me connect with filmmakers across the world and land my first international project."',
    name: 'Marcus Cole',
    type: 'Actor',
    img: 'https://netsaa.com/landing/imgMarcusCole.jpg',
  },
  {
    quote: '"I found three collaborative projects in my first week. The community here is incredibly supportive."',
    name: 'Lena Richter',
    type: 'Dancer',
    img: 'https://netsaa.com/landing/imgLenaRichter.jpg',
  },
  {
    quote: '"The opportunities on NETSA are real. I\'ve worked with amazing artists I never would have met otherwise."',
    name: 'Arjun Mehta',
    type: 'Musician',
    img: 'https://netsaa.com/landing/imgArjunMehta.jpg',
  },
  {
    quote: '"From open mics to paid gigs in a month. NETSA finally put my work in front of the right people."',
    name: 'Yuki Tanaka',
    type: 'Vocalist',
    img: 'https://netsaa.com/landing/imgYukiTanaka.jpg',
  },
];

export default function VoicesSection() {
  return (
    <View style={styles.section}>
      <View style={styles.glow} />

      {/* Heading */}
      <View style={styles.head}>
        <Text style={styles.h2}>Voices from the{'\n'}
          <MaskedView maskElement={<Text style={styles.h2Accent}>Community</Text>}>
            <LinearGradient
              colors={['#ff4d88', '#ff822e', '#ff976b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.h2Accent, { opacity: 0 }]}>Community</Text>
            </LinearGradient>
          </MaskedView>
        </Text>
        <Text style={styles.sub}>Real stories from artists building their creative careers on NETSA.</Text>
      </View>

      {/* 2-column staggered grid */}
      <View style={styles.grid}>
        <View style={styles.col}>
          <TestimonialCard card={TESTIMONIALS[0]} />
          <TestimonialCard card={TESTIMONIALS[2]} />
        </View>
        <View style={[styles.col, { marginTop: 40 }]}>
          <TestimonialCard card={TESTIMONIALS[1]} />
          <TestimonialCard card={TESTIMONIALS[3]} />
        </View>
      </View>
    </View>
  );
}

function TestimonialCard({ card }: { card: typeof TESTIMONIALS[0] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.quote}>{card.quote}</Text>
      <View style={styles.who}>
        <Image source={{ uri: card.img }} style={styles.avatar} />
        <View>
          <Text style={styles.name}>{card.name}</Text>
          <Text style={styles.type}>{card.type}</Text>
        </View>
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
  glow: {
    position: 'absolute',
    width: 700,
    height: 700,
    borderRadius: 9999,
    backgroundColor: LANDING.gradient.orange,
    opacity: 0.035,
    top: '30%',
    left: '50%',
    marginLeft: -350,
  },
  head: {
    alignItems: 'center',
    marginBottom: 40,
  },
  h2: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 36,
    lineHeight: 42,
    color: LANDING.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  h2Accent: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 36,
    lineHeight: 42,
    textAlign: 'center',
  },
  sub: {
    fontFamily: LANDING.fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    color: LANDING.text.mid,
    textAlign: 'center',
    maxWidth: 320,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
    gap: 12,
  },
  card: {
    backgroundColor: LANDING.bg.elevated,
    borderWidth: 1,
    borderColor: 'rgba(39,39,42,0.2)',
    borderRadius: 16,
    padding: 24,
  },
  quote: {
    fontFamily: LANDING.fonts.sans,
    fontSize: 14,
    lineHeight: 23,
    color: 'rgba(245,245,245,0.9)',
    marginBottom: 20,
  },
  who: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: LANDING.bg.primary,
  },
  name: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 13,
    color: LANDING.text.primary,
    lineHeight: 18,
  },
  type: {
    fontFamily: LANDING.fonts.sans,
    fontSize: 11,
    color: LANDING.gradient.rose,
    lineHeight: 15,
  },
});
