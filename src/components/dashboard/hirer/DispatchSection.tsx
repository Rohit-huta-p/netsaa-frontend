/**
 * DispatchSection — editorial city pulse (3 entries).
 *
 * Design source: DOCS/designs/hirer-home-v1.html (Dispatch section).
 * Plan: DOCS/NETSA_Hirer_Home_RN_Translation.md §6.7.
 *
 * Layout:
 *   - Title "Dispatch" + mono stamp "PUNE · 1H AGO".
 *   - Italic eyebrow line.
 *   - Three editorial entries. Each:
 *       i / ii / iii  (serif italic numeral)
 *       MICRO tag     (uppercase, letter-spaced)
 *       Serif title   (18pt DM Serif Display, -0.3 letter-spacing)
 *       Body          (12pt Outfit, line-height 1.55)
 *
 * Data: useCityPulse(city) once backend ships. Static content for v1.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface DispatchEntry {
  id: string;
  numeral: string;     // 'i.', 'ii.', 'iii.'
  tag: string;         // 'Trending up', 'New verified', 'Audition window'
  title: string;
  body: React.ReactNode;   // allows mono inline ₹ markup, etc.
}

interface Props {
  city?: string;
  ageHint?: string;       // e.g., "1H AGO"
  entries?: DispatchEntry[];
}

const DEFAULT: DispatchEntry[] = [
  {
    id: '1',
    numeral: 'i.',
    tag: 'Trending up',
    title: 'Sangeet ceremony hires up 12%',
    body: 'Average payout now ₹85,000. Consider listing if your roster spans light classical.',
  },
  {
    id: '2',
    numeral: 'ii.',
    tag: 'New verified',
    title: 'Eight verified arrivals this week',
    body: 'Three Bharatanatyam, two Kathak, two Tabla, one Vocal. Worth a browse.',
  },
  {
    id: '3',
    numeral: 'iii.',
    tag: 'Audition window',
    title: 'Pune Jazz Festival opens calls',
    body: 'Vocalists and instrumentalists, two-day festival in February. Closes Jan 12.',
  },
];

export default function DispatchSection({
  city = 'Pune',
  ageHint = '1H AGO',
  entries = DEFAULT,
}: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  return (
    <View style={styles.section}>
      <View style={styles.headRow}>
        <Text style={styles.h2}>Dispatch</Text>
        <Text style={styles.mono}>{city.toUpperCase()} · {ageHint}</Text>
      </View>
      <Text style={styles.eyebrow}>Three things shifting in your city this week.</Text>

      {entries.map((e, i) => {
        const Container = reduceMotion ? View : Animated.View;
        const entering = reduceMotion
          ? undefined
          : FadeInUp.delay(120 + i * 140).duration(700);
        return (
          <Container
            key={e.id}
            style={[styles.entry, i === entries.length - 1 && styles.entryLast]}
            entering={entering as any}
          >
            <Text style={styles.numeral}>{e.numeral}</Text>
            <View style={styles.entryBody}>
              <Text style={styles.tag}>{e.tag.toUpperCase()}</Text>
              <Text style={styles.title}>{e.title}</Text>
              <Text style={styles.body}>{e.body}</Text>
            </View>
          </Container>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  headRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  h2: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, letterSpacing: -0.8, color: '#F3EFE8' },
  mono: { fontSize: 10, color: '#6B6878', fontFamily: 'Outfit-Medium', letterSpacing: 1.5 },
  eyebrow: {
    fontFamily: 'DMSerifDisplay_400Regular', fontStyle: 'italic',
    fontSize: 12, color: '#6B6878', marginTop: 4, marginBottom: 20,
  },

  entry: {
    flexDirection: 'row', gap: 16,
    paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: 'rgba(243,239,232,0.05)',
  },
  entryLast: { borderBottomWidth: 0 },
  numeral: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontStyle: 'italic',
    fontSize: 22, color: '#3F3D4A', lineHeight: 24,
  },
  entryBody: { flex: 1 },
  tag: { fontSize: 9, color: '#6B6878', fontFamily: 'Outfit-Bold', letterSpacing: 2, marginBottom: 8 },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 18, lineHeight: 21, letterSpacing: -0.3,
    color: '#F3EFE8',
    marginBottom: 4,
  },
  body: { fontSize: 12, color: '#B8B1A6', lineHeight: 18 },
});
