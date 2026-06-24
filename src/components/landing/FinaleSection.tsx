import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LANDING } from '@/constants/landingTheme';

export default function FinaleSection() {
  return (
    <View style={styles.section}>
      {/* Orb glow */}
      <View style={styles.orb} />

      {/* Heading */}
      <Text style={styles.heading}>
        Your Art{'\n'}Has Value.{'\n'}
        <MaskedView maskElement={<Text style={styles.headingAccent}>Own It.</Text>}>
          <LinearGradient colors={[...LANDING.gradient.colors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={[styles.headingAccent, { opacity: 0 }]}>Own It.</Text>
          </LinearGradient>
        </MaskedView>
      </Text>

      <Text style={styles.sub}>
        Join the first 200 artists shaping the future of performing arts in India.
      </Text>

      {/* CTAs */}
      <View style={styles.actions}>
        <Pressable style={({ pressed }) => [pressed && { transform: [{ scale: 0.97 }] }]}>
          <LinearGradient
            colors={[...LANDING.gradient.colors]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btnPrimary}
          >
            <Text style={styles.btnPrimaryText}>Join NETSA — It's Free</Text>
            <ArrowRight size={18} color="#fff" strokeWidth={2} />
          </LinearGradient>
        </Pressable>

        <Pressable style={styles.btnSecondary}>
          <Text style={styles.btnSecondaryText}>I Need Talent</Text>
        </Pressable>
      </View>

      <Text style={styles.city}>LAUNCHING IN PUNE . EXPANDING TO MUMBAI, BANGALORE, DELHI</Text>
    </View>
  );
}

function FooterSection() {
  return (
    <View style={styles.footer}>
      <MaskedView maskElement={<Text style={styles.footerLogo}>NETSA</Text>}>
        <LinearGradient colors={[...LANDING.gradient.colors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={[styles.footerLogo, { opacity: 0 }]}>NETSA</Text>
        </LinearGradient>
      </MaskedView>
      <Text style={styles.footerText}>{'\u00A9'} 2026 NETSA Technologies Pvt. Ltd.</Text>
    </View>
  );
}

export { FooterSection };

const styles = StyleSheet.create({
  section: {
    paddingTop: 120,
    paddingBottom: 80,
    paddingHorizontal: LANDING.spacing.px,
    alignItems: 'center',
    backgroundColor: LANDING.bg.primary,
    position: 'relative',
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: LANDING.gradient.pink,
    opacity: 0.04,
    top: '30%',
    alignSelf: 'center',
  },
  heading: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 40,
    lineHeight: 44,
    color: LANDING.text.primary,
    textAlign: 'center',
    marginBottom: 20,
    zIndex: 2,
  },
  headingAccent: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 40,
    lineHeight: 44,
  },
  sub: {
    fontFamily: LANDING.fonts.sans,
    fontSize: 15,
    color: LANDING.text.mid,
    textAlign: 'center',
    marginBottom: 40,
    zIndex: 2,
  },
  actions: {
    gap: 12,
    width: '100%',
    maxWidth: 400,
    zIndex: 2,
    marginBottom: 40,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
  },
  btnPrimaryText: {
    fontFamily: LANDING.fonts.sansBold,
    fontSize: 16,
    color: '#fff',
  },
  btnSecondary: {
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(139,92,246,0.25)',
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontFamily: LANDING.fonts.sansSemiBold,
    fontSize: 14,
    color: LANDING.accent.purple,
  },
  city: {
    fontFamily: LANDING.fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: LANDING.text.dim,
    textAlign: 'center',
    zIndex: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: LANDING.spacing.px,
    borderTopWidth: 1,
    borderTopColor: LANDING.border.default,
    backgroundColor: LANDING.bg.primary,
  },
  footerLogo: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 18,
    opacity: 0.3,
    marginBottom: 6,
  },
  footerText: {
    fontFamily: LANDING.fonts.sans,
    fontSize: 11,
    color: LANDING.text.dim,
  },
});
