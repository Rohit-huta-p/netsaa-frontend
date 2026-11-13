import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { LANDING } from '@/constants/landingTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_W = (SCREEN_WIDTH - LANDING.spacing.px * 2 - 12) / 2;
const CARD_H = CARD_W * (360 / 270);

const ARTISTS = [
  {
    img: 'https://netsaa.com/landing/v2-dancer.jpg',
    name: 'Dancer',
    role: 'Kathak & contemporary',
    city: 'Pune',
    accent: '#ff4d88',
    shadowColor: 'rgba(255,77,136,0.5)',
    rotate: '-2.5deg',
    marginTop: 0,
  },
  {
    img: 'https://netsaa.com/landing/v2-musician.jpg',
    name: 'Vocalist',
    role: 'Hindustani vocal',
    city: 'Mumbai',
    accent: '#8b5cf6',
    shadowColor: 'rgba(139,92,246,0.5)',
    rotate: '2.5deg',
    marginTop: 48,
  },
  {
    img: 'https://netsaa.com/landing/v2-vocalist.jpg',
    name: 'Musician',
    role: 'Sitar & tabla',
    city: 'Delhi',
    accent: '#f59e0b',
    shadowColor: 'rgba(245,158,11,0.45)',
    rotate: '-2deg',
    marginTop: 20,
  },
  {
    img: 'https://netsaa.com/landing/v2-actor.jpg',
    name: 'Actor',
    role: 'Stage & screen',
    city: 'Bengaluru',
    accent: '#14b8a6',
    shadowColor: 'rgba(20,184,166,0.45)',
    rotate: '2.5deg',
    marginTop: 72,
  },
];

export default function CreativeCommunitySection() {
  return (
    <View style={styles.section}>
      <View style={styles.glow} />

      {/* Heading */}
      <View style={styles.head}>
        <Text style={styles.h2Line1}>The{' '}
          <MaskedView maskElement={<Text style={styles.h2Accent}>Creative</Text>}>
            <LinearGradient
              colors={['#ff4d88', '#ff822e', '#ff976b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.h2Accent, { opacity: 0 }]}>Creative</Text>
            </LinearGradient>
          </MaskedView>
        </Text>
        <Text style={styles.h2Line2}>Community</Text>
        <Text style={styles.sub}>
          Meet artists from every discipline, building an audience and sharing across the globe.
        </Text>
      </View>

      {/* Cards grid — 2 columns, staggered */}
      <View style={styles.grid}>
        {/* Column 1: cards 0 and 2 */}
        <View style={styles.col}>
          {[ARTISTS[0], ARTISTS[2]].map((a, i) => (
            <ArtistCard key={a.name} artist={a} />
          ))}
        </View>
        {/* Column 2: cards 1 and 3 (offset down) */}
        <View style={[styles.col, { marginTop: 48 }]}>
          {[ARTISTS[1], ARTISTS[3]].map((a, i) => (
            <ArtistCard key={a.name} artist={a} />
          ))}
        </View>
      </View>
    </View>
  );
}

function ArtistCard({ artist }: { artist: typeof ARTISTS[0] }) {
  return (
    <View style={[
      styles.card,
      {
        transform: [{ rotate: artist.rotate }],
        shadowColor: artist.accent,
      }
    ]}>
      <Image source={{ uri: artist.img }} style={styles.cardImg} resizeMode="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(9,9,11,0.2)', 'rgba(9,9,11,0.88)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardMeta}>
        <Text style={styles.cardName}>{artist.name}</Text>
        <View style={styles.roleRow}>
          <View style={[styles.roleDot, { backgroundColor: artist.accent }]} />
          <Text style={[styles.cardRole, { color: artist.accent }]}>{artist.role}</Text>
        </View>
        <Text style={styles.cardCity}>{artist.city}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: 80,
    paddingBottom: 100,
    paddingHorizontal: LANDING.spacing.px,
    backgroundColor: LANDING.bg.primary,
    overflow: 'visible',
  },
  glow: {
    position: 'absolute',
    width: 700,
    height: 700,
    borderRadius: 9999,
    backgroundColor: LANDING.gradient.rose,
    opacity: 0.05,
    top: -80,
    right: -150,
  },
  head: {
    marginBottom: 40,
  },
  h2Line1: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 40,
    lineHeight: 46,
    color: LANDING.text.primary,
  },
  h2Accent: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 40,
    lineHeight: 46,
  },
  h2Line2: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 40,
    lineHeight: 46,
    color: LANDING.text.primary,
    marginBottom: 14,
  },
  sub: {
    fontFamily: LANDING.fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    color: LANDING.text.mid,
    maxWidth: 300,
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
    width: '100%',
    aspectRatio: 270 / 360,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: LANDING.bg.elevated,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 8,
  },
  cardImg: {
    ...StyleSheet.absoluteFillObject,
  },
  cardMeta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    zIndex: 2,
  },
  cardName: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 18,
    color: LANDING.text.primary,
    marginBottom: 4,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cardRole: {
    fontFamily: LANDING.fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  cardCity: {
    fontFamily: LANDING.fonts.sans,
    fontSize: 11,
    color: LANDING.text.primary,
    opacity: 0.7,
  },
});
