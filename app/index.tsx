import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import HeroSection from '@/components/landing/HeroSection';
import MarqueeSection from '@/components/landing/MarqueeSection';
import WhatsAppSection from '@/components/landing/WhatsAppSection';
import SolutionSection from '@/components/landing/SolutionSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import TrustSection from '@/components/landing/TrustSection';
import ManifestoSection from '@/components/landing/ManifestoSection';
import WaitlistSection from '@/components/landing/WaitlistSection';
import FinaleSection, { FooterSection } from '@/components/landing/FinaleSection';
import { LANDING } from '@/constants/landingTheme';

/**
 * NETSA Landing Page — Palette 18: Sunset Gradient + Cool Accents
 *
 * Section flow:
 *   1. HERO — Giant serif headline, performer photo, gradient CTAs
 *   2. MARQUEE — Horizontal scrolling art forms ticker
 *   3. WHATSAPP — "Sound familiar?" conversation mockup + punchlines
 *   4. SOLUTION — 3 pillars + app phone mockup
 *   5. HOW IT WORKS — 3 steps (Show Up, Gigs Find You, Get Paid)
 *   6. TRUST — Before/After comparison + trust tier progression
 *   7. MANIFESTO — White interrupt: "Performing Art Is Not Just a Hobby."
 *   8. WAITLIST — "Be Among the First 200" + phone input
 *   9. FINALE — "Your Art Has Value. Own It."
 *   10. FOOTER
 */
export default function LandingScreen() {
  return (
    <>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <HeroSection />
        <MarqueeSection />
        <WhatsAppSection />
        <SolutionSection />
        <HowItWorksSection />
        <TrustSection />
        <ManifestoSection />
        <WaitlistSection />
        <FinaleSection />
        <FooterSection />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: LANDING.bg.primary,
  },
  content: {
    flexGrow: 1,
  },
});
