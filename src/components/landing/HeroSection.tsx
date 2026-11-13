import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useRouter } from 'expo-router';
import { LANDING } from '@/constants/landingTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PROOF_AVATARS = [
  'https://netsaa.com/landing/imgContainer.jpg',
  'https://netsaa.com/landing/imgContainer1.jpg',
  'https://netsaa.com/landing/imgContainer2.jpg',
  'https://netsaa.com/landing/imgContainer3.jpg',
];

export default function HeroSection() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.hero}>
      {/* Glow blobs */}
      <View style={[styles.glow, styles.glowRose]} />
      <View style={[styles.glow, styles.glowOrange]} />
      <View style={[styles.glow, styles.glowPeach]} />

      {/* Nav */}
      <Animated.View style={[styles.nav, { opacity: fadeAnim }]}>
        <MaskedView maskElement={<Text style={styles.navLogo}>NETSA</Text>}>
          <LinearGradient colors={[...LANDING.gradient.colors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={[styles.navLogo, { opacity: 0 }]}>NETSA</Text>
          </LinearGradient>
        </MaskedView>
        <Pressable style={styles.navCta} onPress={() => router.push('/(auth)/login')}>
          <LinearGradient
            colors={[...LANDING.gradient.colors]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.navCtaGrad}
          >
            <Text style={styles.navCtaText}>LOG IN</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Hero content — centered */}
      <Animated.View style={[styles.heroContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Headline */}
        <Text style={styles.headLine1}>THE STAGE IS</Text>
        <MaskedView maskElement={<Text style={styles.headLine2}>REVOLUTIONIZED</Text>}>
          <LinearGradient
            colors={['#ff4d88', '#ff822e', '#ff976b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[styles.headLine2, { opacity: 0 }]}>REVOLUTIONIZED</Text>
          </LinearGradient>
        </MaskedView>

        {/* Subtitle */}
        <Text style={styles.sub}>
          Empowering India's performing artists with a transparent, direct, and professional ecosystem.
        </Text>

        {/* CTAs */}
        <View style={styles.ctas}>
          <Pressable
            style={({ pressed }) => [styles.btnWrap, pressed && { transform: [{ scale: 0.97 }] }]}
            onPress={() => router.push('/(auth)/register')}
          >
            <LinearGradient
              colors={[...LANDING.gradient.colors]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnFill}
            >
              <Text style={styles.btnFillText}>Join NETSA</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.btnOutline, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/(app)/gigs')}
          >
            <Text style={styles.btnOutlineText}>Explore Gigs</Text>
          </Pressable>
        </View>

        {/* Proof strip */}
        <View style={styles.proof}>
          <View style={styles.avatars}>
            {PROOF_AVATARS.map((uri, i) => (
              <Image
                key={i}
                source={{ uri }}
                style={[styles.avatar, { marginLeft: i === 0 ? 0 : -14 }]}
              />
            ))}
          </View>
          <Text style={styles.proofLabel}>26M+ Aspiring Artists in India</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    minHeight: 680,
    backgroundColor: LANDING.bg.primary,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 64,
    paddingTop: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    borderRadius: 9999,
  },
  glowRose: {
    width: 500,
    height: 500,
    top: -180,
    left: -60,
    backgroundColor: LANDING.gradient.rose,
    opacity: 0.05,
  },
  glowOrange: {
    width: 420,
    height: 420,
    top: -120,
    right: -60,
    backgroundColor: LANDING.gradient.orange,
    opacity: 0.06,
  },
  glowPeach: {
    width: 360,
    height: 360,
    top: '30%',
    left: '30%',
    backgroundColor: LANDING.gradient.peach,
    opacity: 0.04,
  },
  nav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 56,
    paddingHorizontal: LANDING.spacing.px,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  navLogo: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 22,
    letterSpacing: 2,
  },
  navCta: {
    borderRadius: 9999,
    overflow: 'hidden',
  },
  navCtaGrad: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 9999,
  },
  navCtaText: {
    fontFamily: LANDING.fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 1,
    color: '#fff',
    textTransform: 'uppercase',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: LANDING.spacing.px,
    zIndex: 2,
    width: '100%',
  },
  headLine1: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 38,
    letterSpacing: -1.5,
    color: LANDING.text.primary,
    textAlign: 'center',
    lineHeight: 42,
  },
  headLine2: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 48,
    letterSpacing: -2,
    textAlign: 'center',
    lineHeight: 52,
    marginBottom: 24,
  },
  sub: {
    fontFamily: LANDING.fonts.sans,
    fontSize: 15,
    lineHeight: 24,
    color: LANDING.text.mid,
    textAlign: 'center',
    maxWidth: SCREEN_WIDTH - 64,
    marginBottom: 32,
  },
  ctas: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  btnWrap: {},
  btnFill: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 9999,
  },
  btnFillText: {
    fontFamily: LANDING.fonts.sansSemiBold,
    fontSize: 15,
    color: '#fff',
  },
  btnOutline: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  btnOutlineText: {
    fontFamily: LANDING.fonts.sansSemiBold,
    fontSize: 15,
    color: LANDING.text.primary,
  },
  proof: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatars: {
    flexDirection: 'row',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: LANDING.bg.primary,
    backgroundColor: LANDING.bg.elevated,
  },
  proofLabel: {
    fontFamily: LANDING.fonts.sansMedium,
    fontSize: 13,
    color: '#fff',
  },
});
