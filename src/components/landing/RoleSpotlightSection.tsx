import React, { useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LANDING } from '@/constants/landingTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ROLES = [
  {
    key: 'client',
    label: 'For Clients',
    title: 'Find your talent',
    pre: 'On NETSA for',
    big: 'Clients',
    desc: 'Post your event and get matched with vetted creative leads and performers.',
    cta: 'Hire the stage',
    tintColors: ['#f7c45a', '#ff822e'] as const,
    img: 'https://netsaa.com/landing/v2-client.jpg',
  },
  {
    key: 'lead',
    label: 'For Creative Leads',
    title: 'Find clients & crew',
    pre: 'On NETSA for',
    big: 'Creative Leads',
    desc: 'Win work, then build and book your own team — both sides, one profile.',
    cta: 'Lead the show',
    tintColors: ['#ff4d88', '#ff822e'] as const,
    img: 'https://netsaa.com/landing/imgSagarBora.jpg',
  },
  {
    key: 'artist',
    label: 'For Artists',
    title: 'Find your next gig',
    pre: 'On NETSA for',
    big: 'Artists',
    desc: 'Get discovered, apply to gigs that fit, and build your name.',
    cta: 'Take the stage',
    tintColors: ['#ff4d88', '#6d23b6'] as const,
    img: 'https://netsaa.com/landing/imgSagarBora2.jpg',
  },
];

const COLLAPSED_H = 96;
const EXPANDED_H = 320;

export default function RoleSpotlightSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <View style={styles.section}>
      <View style={[styles.glow]} />
      <View style={styles.head}>
        <Text style={styles.h2}>Find talent. Find clients.{'\n'}
          <Text style={styles.h2Grad}>{'Find work.'}</Text>
        </Text>
        <Text style={styles.sub}>Whichever side of the stage you're on, NETSA connects you to the other — all in one place.</Text>
      </View>
      <View style={styles.panels}>
        {ROLES.map((role, i) => (
          <RolePanel
            key={role.key}
            role={role}
            isOpen={openIdx === i}
            onPress={() => setOpenIdx(openIdx === i ? null : i)}
          />
        ))}
      </View>
    </View>
  );
}

function RolePanel({ role, isOpen, onPress }: {
  role: typeof ROLES[0];
  isOpen: boolean;
  onPress: () => void;
}) {
  const heightAnim = useRef(new Animated.Value(COLLAPSED_H)).current;
  const openOpacity = useRef(new Animated.Value(0)).current;
  const closedOpacity = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(heightAnim, {
        toValue: isOpen ? EXPANDED_H : COLLAPSED_H,
        useNativeDriver: false,
        damping: 18,
        stiffness: 120,
      }),
      Animated.timing(openOpacity, { toValue: isOpen ? 1 : 0, duration: 300, useNativeDriver: true }),
      Animated.timing(closedOpacity, { toValue: isOpen ? 0 : 1, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [isOpen]);

  return (
    <Animated.View style={[styles.panel, { height: heightAnim }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onPress}>
        <Image source={{ uri: role.img }} style={styles.panelImg} resizeMode="cover" />
        <LinearGradient
          colors={[...role.tintColors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { opacity: 0.4 }]}
        />
        <LinearGradient
          colors={['rgba(9,9,11,0)', 'rgba(9,9,11,0.5)', 'rgba(9,9,11,0.93)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Closed state */}
        <Animated.View style={[styles.closedState, { opacity: closedOpacity }]}>
          <Text style={styles.closedLabel}>{role.label}</Text>
          <Text style={styles.closedTitle}>{role.title}</Text>
        </Animated.View>

        {/* Open state */}
        <Animated.View style={[styles.openState, { opacity: openOpacity }]} pointerEvents={isOpen ? 'auto' : 'none'}>
          <Text style={styles.openPre}>{role.pre}</Text>
          <Text style={styles.openBig}>{role.big}</Text>
          <Text style={styles.openTitle}>{role.title}</Text>
          <Text style={styles.openDesc}>{role.desc}</Text>
          <Text style={styles.openCta}>{role.cta} <Text style={styles.openCtaArrow}>→</Text></Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: 80,
    paddingBottom: 80,
    paddingHorizontal: LANDING.spacing.px,
    backgroundColor: LANDING.bg.primary,
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 600,
    height: 440,
    borderRadius: 9999,
    backgroundColor: LANDING.gradient.orange,
    opacity: 0.04,
    top: -40,
    left: '50%',
    marginLeft: -300,
  },
  head: {
    marginBottom: 32,
  },
  h2: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 36,
    lineHeight: 42,
    color: LANDING.text.primary,
    marginBottom: 12,
  },
  h2Grad: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 36,
    lineHeight: 42,
    color: LANDING.gradient.rose,
  },
  sub: {
    fontFamily: LANDING.fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    color: LANDING.text.mid,
    maxWidth: 340,
  },
  panels: {
    gap: 10,
  },
  panel: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: LANDING.bg.elevated,
  },
  panelImg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.75,
  },
  closedState: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
  },
  closedLabel: {
    fontFamily: LANDING.fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(255,233,217,0.86)',
    marginBottom: 4,
  },
  closedTitle: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 24,
    color: '#fff',
    lineHeight: 28,
  },
  openState: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  openPre: {
    fontFamily: LANDING.fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
  },
  openBig: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 36,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 10,
  },
  openTitle: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 18,
    color: 'rgba(245,245,245,0.95)',
    textAlign: 'center',
    marginBottom: 10,
  },
  openDesc: {
    fontFamily: LANDING.fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(245,245,245,0.85)',
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 20,
  },
  openCta: {
    fontFamily: LANDING.fonts.sansMedium,
    fontSize: 14,
    color: '#fff',
  },
  openCtaArrow: {
    color: '#ffd9c2',
    fontFamily: LANDING.fonts.sansBold,
  },
});
