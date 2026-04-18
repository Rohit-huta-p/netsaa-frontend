import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { LANDING } from '@/constants/landingTheme';

const STEPS = [
  {
    num: '01',
    accent: LANDING.gradient.pink,
    title: 'Show Up As You Are',
    desc: 'Your art forms, your videos, your rate. One profile that finally represents the real you. Not a WhatsApp bio \u2014 a professional presence.',
  },
  {
    num: '02',
    accent: LANDING.accent.cyan,
    title: 'The Right Gigs Find You',
    desc: 'Stop messaging 40 people for one booking. Hirers in your city search by skill, budget, and trust. Your reputation does the outreach.',
  },
  {
    num: '03',
    accent: LANDING.accent.green,
    title: 'Perform. Get Paid. Build Your Record.',
    desc: 'Money in your bank the moment the show ends. Every gig adds to your verified career record. No more invisible work.',
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

export default function HowItWorksSection() {
  return (
    <>
      <Ornament />
      <View style={styles.section}>
        {/* Label */}
        <MaskedView maskElement={<Text style={styles.label}>SIMPLE</Text>}>
          <LinearGradient colors={[...LANDING.gradient.colors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={[styles.label, { opacity: 0 }]}>SIMPLE</Text>
          </LinearGradient>
        </MaskedView>

        {/* Heading */}
        <Text style={styles.heading}>
          Three steps to{' '}
          <MaskedView maskElement={<Text style={styles.headingAccent}>your stage.</Text>}>
            <LinearGradient colors={[...LANDING.gradient.colors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[styles.headingAccent, { opacity: 0 }]}>your stage.</Text>
            </LinearGradient>
          </MaskedView>
        </Text>

        {/* Gradient line */}
        <LinearGradient
          colors={[...LANDING.gradient.colors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.lineGrow}
        />

        {/* Steps */}
        <View style={styles.steps}>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.step}>
              {/* Faded number behind */}
              <Text style={styles.stepNumBg}>{step.num}</Text>
              <View style={[styles.stepAccent, { backgroundColor: step.accent }]} />
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
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
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  heading: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 28,
    lineHeight: 34,
    color: LANDING.text.primary,
    marginBottom: 24,
  },
  headingAccent: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 28,
    lineHeight: 34,
  },
  lineGrow: {
    width: 80,
    height: 2,
    borderRadius: 1,
    marginBottom: 48,
  },
  steps: {
    gap: 32,
  },
  step: {
    position: 'relative',
    paddingTop: 32,
  },
  stepNumBg: {
    position: 'absolute',
    top: -4,
    left: 0,
    fontFamily: LANDING.fonts.serif,
    fontSize: 56,
    color: 'rgba(255,255,255,0.03)',
  },
  stepAccent: {
    width: 32,
    height: 3,
    borderRadius: 2,
    marginBottom: 16,
  },
  stepTitle: {
    fontFamily: LANDING.fonts.sansBold,
    fontSize: 20,
    color: LANDING.text.primary,
    marginBottom: 8,
  },
  stepDesc: {
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
});
