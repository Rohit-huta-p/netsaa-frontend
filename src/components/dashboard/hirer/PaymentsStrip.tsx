/**
 * PaymentsStrip — hirer spend overview. Scaffold only per Plan 3 scope:
 * full SectionCard chrome with "coming soon" copy. Payment-service spend
 * aggregation is not yet built; this shell ensures layout is finalized so
 * the real data can drop in during Plan 5/6 without dashboard reshuffling.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SectionCard from '../SectionCard';

export default function PaymentsStrip() {
  return (
    <SectionCard title="Spend overview">
      <View style={styles.body} accessibilityLabel="Spend analytics coming soon">
        <Text style={styles.headline}>Spend analytics</Text>
        <Text style={styles.sub}>Totals + per-gig breakdown land with payment tooling</Text>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  body: { paddingVertical: 16, alignItems: 'center' },
  headline: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#A1A1AA' },
  sub: { marginTop: 6, fontFamily: 'Outfit-Regular', fontSize: 13, color: '#71717A', textAlign: 'center' },
});
