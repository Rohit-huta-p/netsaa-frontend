import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Search } from 'lucide-react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LANDING } from '@/constants/landingTheme';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HeroSection() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scrollBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scrollBounce, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(scrollBounce, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const scrollHeight = scrollBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [36, 48],
  });

  return (
    <View style={styles.hero}>
      {/* Ambient orbs */}
      {/* <View style={[styles.orb, styles.orbPink]} /> */}
      {/* <View style={[styles.orb, styles.orbOrange]} /> */}

      {/* Performer photo */}
      <View style={styles.heroImage}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=900&q=75' }}
          style={styles.heroPhoto}
          resizeMode="cover"
        />
        <LinearGradient
          colors={[LANDING.bg.primary, 'rgba(10,10,16,0.7)', 'rgba(10,10,16,0.3)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(10,10,16,0.3)', 'transparent', 'rgba(10,10,16,0.8)', LANDING.bg.primary]}
          locations={[0, 0.3, 0.8, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Nav
      <Animated.View style={[styles.nav, { opacity: fadeAnim }]}>
        <MaskedView
          maskElement={<Text style={styles.navLogoMask}>NETSA</Text>}
        >
          <LinearGradient colors={[...LANDING.gradient.colors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={[styles.navLogoMask, { opacity: 0 }]}>NETSA</Text>
          </LinearGradient>
        </MaskedView>

        <Pressable style={styles.navCta}>
          <Text style={styles.navCtaText}>JOIN WAITLIST</Text>
        </Pressable>
      </Animated.View> */}

      {/* Hero content */}
      <Animated.View style={[styles.heroContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Label */}
        <MaskedView
          maskElement={<Text style={styles.heroLabel}>FOR INDIAN PERFORMING ARTISTS</Text>}
        >
          <LinearGradient colors={[...LANDING.gradient.colors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={[styles.heroLabel, { opacity: 0 }]}>FOR INDIAN PERFORMING ARTISTS</Text>
          </LinearGradient>
        </MaskedView>

        {/* Title */}
        <View style={styles.titleWrap}>
          <Text style={styles.heroTitle}>Your Art{'\n'}Deserves a </Text>
          <MaskedView
            maskElement={<Text style={[styles.heroTitle, styles.heroTitleAccent]}>Stage.</Text>}
          >
            <LinearGradient colors={[...LANDING.gradient.colors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[styles.heroTitle, styles.heroTitleAccent, { opacity: 0 }]}>Stage.</Text>
            </LinearGradient>
          </MaskedView>
          <LinearGradient
            colors={[...LANDING.gradient.colors]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.titleUnderline}
          />
        </View>

        {/* Subtitle */}
        <Text style={styles.heroSub}>
          The platform where performing artists in India get discovered, get booked, and get paid. Directly.
        </Text>

        {/* CTAs */}
        <View style={styles.heroActions}>
          <Pressable style={({ pressed }) => [styles.btnWrap, pressed && { transform: [{ scale: 0.97 }] }]}>
            <LinearGradient
              colors={[...LANDING.gradient.colors]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnPrimary}
            >
              <Text style={styles.btnPrimaryText}>I'm an Artist</Text>
              <ArrowRight size={18} color="#fff" strokeWidth={2} />
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.btnSecondary}>
            <Text style={styles.btnSecondaryText}>I Need Talent</Text>
            <Search size={18} color={LANDING.accent.purple} strokeWidth={2} />
          </Pressable>
        </View>
      </Animated.View>

      {/* Scroll indicator */}
      {/* <View style={styles.scrollHint}>
        <Animated.View style={[styles.scrollLine, { height: scrollHeight }]} />
        <Text style={styles.scrollText}>SCROLL</Text>
      </View> */}

    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    minHeight: SCREEN_HEIGHT - 120,
    justifyContent: 'flex-end',
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 60,
    backgroundColor: LANDING.bg.primary,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbPink: {
    width: 400,
    height: 400,
    top: -80,
    right: -60,
    backgroundColor: LANDING.gradient.pink,
    opacity: 0.08,
  },
  orbOrange: {
    width: 320,
    height: 320,
    bottom: 80,
    left: -80,
    backgroundColor: LANDING.gradient.orange,
    opacity: 0.06,
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: SCREEN_WIDTH * 0.6,
    height: '100%',
    overflow: 'hidden',
  },
  heroPhoto: {
    width: '100%',
    height: '100%',
    opacity: 0.4,
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
  navLogoMask: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 22,
    letterSpacing: 2,
  },
  navCta: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: LANDING.border.default,
    borderRadius: 100,
  },
  navCtaText: {
    fontFamily: LANDING.fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 1,
    color: LANDING.text.mid,
    textTransform: 'uppercase',
  },
  heroContent: {
    paddingHorizontal: LANDING.spacing.px,
    zIndex: 5,
  },
  heroLabel: {
    fontFamily: LANDING.fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 20,
    color: LANDING.gradient.orange,
  },
  titleWrap: {
    marginBottom: 28,
  },
  heroTitle: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 48,
    lineHeight: 48 * 0.95,
    letterSpacing: -2,
    color: LANDING.text.primary,
  },
  heroTitleAccent: {
    fontStyle: 'italic',
  },
  titleUnderline: {
    width: 120,
    height: 3,
    borderRadius: 2,
    opacity: 0.25,
    marginTop: 4,
  },
  heroSub: {
    fontFamily: LANDING.fonts.sansLight,
    fontSize: 16,
    lineHeight: 16 * 1.7,
    color: LANDING.text.mid,
    maxWidth: 340,
    marginBottom: 32,
  },
  heroActions: {
    flexDirection: 'column',
    gap: 12,
  },
  btnWrap: {},
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  btnPrimaryText: {
    fontFamily: LANDING.fonts.sansSemiBold,
    fontSize: 15,
    color: '#fff',
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(139,92,246,0.25)',
  },
  btnSecondaryText: {
    fontFamily: LANDING.fonts.sansSemiBold,
    fontSize: 15,
    color: LANDING.accent.purple,
  },
  scrollHint: {
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  scrollLine: {
    width: 1,
    backgroundColor: LANDING.text.dim,
    marginBottom: 8,
  },
  scrollText: {
    fontFamily: LANDING.fonts.sansMedium,
    fontSize: 9,
    letterSpacing: 3,
    color: LANDING.text.dim,
    textTransform: 'uppercase',
  },
});
