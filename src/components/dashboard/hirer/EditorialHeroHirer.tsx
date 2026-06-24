/**
 * EditorialHeroHirer — replaces HeroGreetingHirer with editorial layout.
 *
 * Design source: DOCS/designs/hirer-home-v1.html (Hero section).
 * Plan: DOCS/NETSA_Hirer_Home_RN_Translation.md §6.1.
 *
 * Layout:
 *   - "Welcome back," 16pt Outfit Medium, orange #FF6B35
 *   - "{firstName}." 44pt DM Serif Display, letter-spacing -1.5, leading 0.95
 *   - Intro paragraph 15pt Outfit Light, color #B8B1A6, line-height 1.55, max-width 320
 *
 * Animation:
 *   - Reanimated FadeInUp on mount, staggered 120 / 280 / 460 ms.
 *   - Bypassed when AccessibilityInfo.isReduceMotionEnabled().
 *
 * Data: useHeroDataHirer (existing hook). Intro copy adapts to optional
 * pendingActionCount + activePostCount props so the assembly site can wire
 * the real counts when the matching aggregator hooks land.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import useHeroDataHirer from '@/hooks/useHeroDataHirer';

interface Props {
  /** Active count of unresolved actions (drives intro paragraph copy). */
  pendingActionCount?: number;
  /** Active post count (drives intro paragraph copy). */
  activePostCount?: number;
}

const WORDS_0_TO_12 = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six',
  'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
];

function spellCount(n: number, plural: string, singular: string): string {
  if (n <= 0) return '';
  if (n < WORDS_0_TO_12.length) return `${WORDS_0_TO_12[n]} ${n === 1 ? singular : plural}`;
  return `${n} ${plural}`;
}

function deriveIntro(actions?: number, posts?: number): string {
  if (actions === 0 && posts === 0) {
    return 'Welcome to NETSA. The stage is empty for now. Post your first gig and the artists will arrive.';
  }
  const actionsClause =
    actions != null && actions > 0
      ? `${spellCount(actions, 'artists wait', 'artist waits')} on a decision.`
      : '';
  const postsClause =
    posts != null && posts > 0
      ? `${spellCount(posts, 'posts are', 'post is')} quietly gathering interest.`
      : '';
  const tail = 'The stage is set for a working morning.';
  return [actionsClause, postsClause, tail].filter(Boolean).join(' ');
}

export default function EditorialHeroHirer({
  pendingActionCount,
  activePostCount,
}: Props) {
  const { user, isLoading } = useHeroDataHirer();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  if (isLoading || !user) {
    return <View style={styles.skeleton} accessibilityElementsHidden />;
  }

  const displayName = (user as any).displayName ?? '';
  const firstName = displayName.split(' ')[0] ?? '';
  const intro = deriveIntro(pendingActionCount, activePostCount);

  // Reanimated entry transitions. When reduceMotion is on, render plain View/Text.
  const Greet = reduceMotion ? View : Animated.View;
  const Name = reduceMotion ? View : Animated.View;
  const Intro = reduceMotion ? View : Animated.View;

  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel={`Welcome back, ${firstName || 'guest'}. ${intro}`}
    >
      <Greet entering={reduceMotion ? undefined : FadeInUp.delay(120).duration(700)}>
        <Text style={styles.greet} allowFontScaling={false}>Welcome back,</Text>
      </Greet>
      <Name entering={reduceMotion ? undefined : FadeInUp.delay(280).duration(700)}>
        <Text style={styles.name} numberOfLines={1}>
          {firstName ? `${firstName}.` : 'Friend.'}
        </Text>
      </Name>
      <Intro entering={reduceMotion ? undefined : FadeInUp.delay(460).duration(700)}>
        <Text style={styles.intro}>{intro}</Text>
      </Intro>
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
    fontFamily: 'Outfit-Medium',
    fontSize: 16,
    color: '#FF6B35',
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  name: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 44,
    lineHeight: 44,
    letterSpacing: -1.5,
    color: '#F3EFE8',
  },
  intro: {
    fontFamily: 'Outfit-Light',
    fontSize: 15,
    lineHeight: 23,
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
