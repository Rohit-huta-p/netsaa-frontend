// netsa-mobile/src/components/dashboard/PlaceholderCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';

/**
 * Coming-soon placeholder card. Used for dashboard sections whose backend
 * isn't yet built (Plan 4 sub-artist offers, reviews, profile views).
 *
 * Visually muted variant of SectionCard chrome: lower opacity, dimmer border,
 * centered icon + copy. Presentational only — no data, no hooks.
 */

export interface PlaceholderCardProps {
  title: string;
  subtitle: string;
  /** Defaults to a Lucide Lock icon. */
  icon?: React.ReactNode;
  accessibilityLabel?: string;
}

export default function PlaceholderCard({
  title,
  subtitle,
  icon,
  accessibilityLabel,
}: PlaceholderCardProps) {
  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel ?? `${title}. Coming soon.`}
    >
      <View style={styles.iconWrap}>
        {icon ?? <Lock size={24} color="#52525B" />}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F0F12',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#18181C',
    marginHorizontal: 16,
    marginVertical: 8,
    opacity: 0.7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 15,
    color: '#A1A1AA',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    lineHeight: 19.5, // 1.5x 13pt
    color: '#71717A',
    textAlign: 'center',
  },
});
