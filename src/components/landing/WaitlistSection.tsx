import React, { useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LANDING } from '@/constants/landingTheme';

export default function WaitlistSection() {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.section}>
      {/* Badge */}
      <LinearGradient
        colors={['rgba(236,72,153,0.08)', 'rgba(249,115,22,0.08)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.badge}
      >
        <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
        <Text style={styles.badgeText}>EARLY ACCESS</Text>
      </LinearGradient>

      {/* Heading */}
      <Text style={styles.heading}>
        Be Among{'\n'}the First{' '}
        <MaskedView maskElement={<Text style={styles.headingAccent}>200.</Text>}>
          <LinearGradient colors={[...LANDING.gradient.colors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={[styles.headingAccent, { opacity: 0 }]}>200.</Text>
          </LinearGradient>
        </MaskedView>
      </Text>

      <Text style={styles.sub}>
        We're launching in Pune with performing artists. Join the waitlist and shape the platform before it goes public.
      </Text>

      {/* Phone input */}
      <View style={styles.phoneRow}>
        <Text style={styles.phonePrefix}>+91</Text>
        <View style={styles.phoneDivider} />
        <TextInput
          style={styles.phoneInput}
          placeholder="Your mobile number"
          placeholderTextColor={LANDING.text.dim}
          keyboardType="phone-pad"
          maxLength={10}
        />
        <Pressable style={({ pressed }) => [pressed && { transform: [{ scale: 0.92 }] }]}>
          <LinearGradient
            colors={[...LANDING.gradient.colors]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.phoneSubmit}
          >
            <ArrowRight size={18} color="#fff" strokeWidth={2} />
          </LinearGradient>
        </Pressable>
      </View>

      <Text style={styles.spots}>
        <Text style={styles.spotsHighlight}>47 spots</Text> claimed of 200
      </Text>

      {/* Chips */}
      <View style={styles.chips}>
        {[
          { label: 'Verified Payments', color: LANDING.accent.green },
          { label: 'No Middlemen', color: LANDING.gradient.orange },
          { label: '88% Yours', color: LANDING.accent.purple },
        ].map((chip, i) => (
          <View key={i} style={styles.chip}>
            <View style={[styles.chipDot, { backgroundColor: chip.color }]} />
            <Text style={styles.chipText}>{chip.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: LANDING.spacing.sectionVerticalLarge,
    paddingHorizontal: LANDING.spacing.px,
    alignItems: 'center',
    backgroundColor: LANDING.bg.primary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 100,
    marginBottom: 24,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: LANDING.gradient.orange,
  },
  badgeText: {
    fontFamily: LANDING.fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 2,
    color: LANDING.gradient.orange,
  },
  heading: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 36,
    lineHeight: 40,
    color: LANDING.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  headingAccent: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 36,
    lineHeight: 40,
  },
  sub: {
    fontFamily: LANDING.fonts.sans,
    fontSize: 15,
    color: LANDING.text.mid,
    textAlign: 'center',
    lineHeight: 25,
    maxWidth: 380,
    marginBottom: 36,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: LANDING.border.default,
    borderRadius: 14,
    paddingLeft: 18,
    paddingRight: 5,
    paddingVertical: 5,
    width: '100%',
    maxWidth: 400,
    marginBottom: 12,
  },
  phonePrefix: {
    fontFamily: LANDING.fonts.sansMedium,
    fontSize: 14,
    color: LANDING.text.dim,
  },
  phoneDivider: {
    width: 1,
    height: 24,
    backgroundColor: LANDING.border.default,
    marginHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    fontFamily: LANDING.fonts.sans,
    fontSize: 14,
    color: LANDING.text.primary,
    paddingVertical: 10,
  },
  phoneSubmit: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spots: {
    fontFamily: LANDING.fonts.sans,
    fontSize: 12,
    color: LANDING.text.dim,
    marginBottom: 24,
  },
  spotsHighlight: {
    fontFamily: LANDING.fonts.sansBold,
    color: LANDING.gradient.gold,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: LANDING.border.default,
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  chipText: {
    fontFamily: LANDING.fonts.sans,
    fontSize: 11,
    color: LANDING.text.dim,
  },
});
