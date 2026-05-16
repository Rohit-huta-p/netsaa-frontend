/**
 * EditorialHeroHirer — replaces HeroGreetingHirer with editorial layout.
 *
 * Design source: DOCS/designs/hirer-home-v1.html (Hero section).
 * Plan: DOCS/NETSA_Hirer_Home_RN_Translation.md §6.1.
 *
 * Layout:
 *   - "नमस्ते," 24pt Noto Sans Devanagari, orange #FF6B35
 *   - "{firstName}." 44pt DM Serif Display, letter-spacing -1.5, leading 0.95
 *   - Intro paragraph 15pt Outfit Light, color #B8B1A6, line-height 1.55, max-width 320
 *
 * Animation:
 *   - Reanimated FadeInUp on mount, staggered 120 / 280 / 460 ms.
 *   - Respect AccessibilityInfo.isReduceMotionEnabled().
 *
 * Data: useHeroDataHirer (existing hook). Intro paragraph adapts to action queue
 * counts and active post counts via additional hook(s) — TODO §5.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// TODO §3: import Devanagari font (Noto Sans Devanagari) once added to app/_layout.tsx useFonts.
// TODO §4: import Animated, FadeInUp from 'react-native-reanimated'.
import useHeroDataHirer from '@/hooks/useHeroDataHirer';

interface Props {
  /** Active count of unresolved actions (drives intro paragraph copy). */
  pendingActionCount?: number;
  /** Active post count (drives intro paragraph copy). */
  activePostCount?: number;
}

export default function EditorialHeroHirer({
  pendingActionCount,
  activePostCount,
}: Props) {
  const { user, isLoading } = useHeroDataHirer();

  if (isLoading || !user) {
    // TODO §8: skeleton loader matching final hero proportions.
    return <View style={styles.skeleton} />;
  }

  const displayName = (user as any).displayName ?? '';
  const firstName = displayName.split(' ')[0] ?? '';

  // TODO §6.1: derive copy from counts.
  // Example phrasing:
  //   pendingActionCount > 0 && activePostCount > 0
  //     → `${spell(pendingActionCount)} artists wait on a decision. ${spell(activePostCount)} posts are gathering interest. The stage is set for a working morning.`
  //   pendingActionCount === 0 && activePostCount === 0
  //     → `Welcome to NETSA. The stage is empty for now. Post your first gig and the artists will arrive.`
  const intro = 'Four artists are waiting on you. Three posts are quietly gathering interest. The stage is set for a working morning.';

  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel={`Welcome, ${firstName}`}
    >
      {/* TODO §4: wrap each in Animated.View with FadeInUp({ delay: 120 | 280 | 460 }) */}
      <Text style={styles.greet} allowFontScaling={false}>नमस्ते,</Text>
      <Text style={styles.name} numberOfLines={1}>{firstName ? `${firstName}.` : 'Welcome.'}</Text>
      <Text style={styles.intro}>{intro}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  greet: {
    fontSize: 24,
    fontWeight: '500',
    color: '#FF6B35',
    // TODO §3: fontFamily: 'NotoSansDevanagari_500Medium'
    marginBottom: 12,
  },
  name: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 44,
    lineHeight: 42, // 0.95 of fontSize
    letterSpacing: -1.5,
    color: '#F3EFE8',
  },
  intro: {
    fontFamily: 'Outfit_300Light',
    fontSize: 15,
    lineHeight: 23, // 1.55
    color: '#B8B1A6',
    marginTop: 16,
    maxWidth: 320,
    letterSpacing: -0.075,
  },
  skeleton: {
    height: 180,
    marginHorizontal: 24,
    marginTop: 28,
    marginBottom: 32,
    borderRadius: 18,
    backgroundColor: '#0D0B12',
  },
});
