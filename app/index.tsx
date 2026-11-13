import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Redirect } from 'expo-router';

import useAuthStore from '@/stores/authStore';
import AppLoadingScreen from '@/components/ui/AppLoadingScreen';
import HeroSection from '@/components/landing/HeroSection';
import RoleSpotlightSection from '@/components/landing/RoleSpotlightSection';
import CreativeCommunitySection from '@/components/landing/CreativeCommunitySection';
import DiscoverSection from '@/components/landing/DiscoverSection';
import EventsScrollSection from '@/components/landing/EventsScrollSection';
import QuoteSection from '@/components/landing/QuoteSection';
import VoicesSection from '@/components/landing/VoicesSection';
import FinaleSection, { FooterSection } from '@/components/landing/FinaleSection';
import { LANDING } from '@/constants/landingTheme';

/**
 * Root route `/` — auth gate.
 *
 *   logged OUT → public landing page
 *   logged IN  → role-dispatched home (/(app)/dashboard)
 */
export default function Index() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!isHydrated) return <AppLoadingScreen />;

  if (accessToken) return <Redirect href="/(app)/dashboard" />;

  return <LandingScreen />;
}

/**
 * NETSA Landing Page — Figma clone v2 design
 *
 * Section flow:
 *   1. HERO — Centered "THE STAGE IS / REVOLUTIONIZED", LOG IN nav, proof avatars
 *   2. ROLE SPOTLIGHT — 3 expandable role panels (Client / CL / Artist)
 *   3. CREATIVE COMMUNITY — 4 tilted artist cards with discipline accents
 *   4. DISCOVER — Right-aligned heading + 2-col opportunity grid
 *   5. EVENTS SCROLL — Horizontal FlatList of event cards
 *   6. QUOTE — White bg, staggered "PERFORMING ART IS NOT JUST A HOBBY." serif
 *   7. VOICES — Testimonial cards from the community
 *   8. FINALE — "Ready to take center stage?" + 2 CTAs
 *   9. FOOTER
 */
function LandingScreen() {
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
        <RoleSpotlightSection />
        <CreativeCommunitySection />
        <DiscoverSection />
        <EventsScrollSection />
        <QuoteSection />
        <VoicesSection />
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
