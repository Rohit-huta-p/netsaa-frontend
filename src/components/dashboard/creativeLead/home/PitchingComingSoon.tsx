// src/components/dashboard/creativeLead/home/PitchingComingSoon.tsx
//
// "Pitching, coming soon" — shown for the Pitching face on BOTH the CL home's
// Your work section and the full See-all page (dashboard/cl-work). Pitching bids
// on CLIENT briefs, and the client side is deferred, so there's nothing to pitch
// on yet. One component so both surfaces read identically; when the client side
// ships, drop its usages and restore the Sent/Won/Closed rows (clWorkRows.pitchRow).

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HC, HF } from '@/components/dashboard/artist/home/ui';

export default function PitchingComingSoon() {
  return (
    <View style={styles.soon}>
      <Text style={styles.eyebrow}>PITCHING</Text>
      <Text style={styles.title}>Coming soon</Text>
      <Text style={styles.sub}>
        Pitching for client work opens once clients are posting briefs on NETSA. We’ll switch it on here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  soon: { borderWidth: 1, borderStyle: 'dashed', borderColor: HC.hair, borderRadius: 16, backgroundColor: HC.card, padding: 24, alignItems: 'center', gap: 8, marginTop: 16 },
  eyebrow: { fontFamily: HF.mono, fontSize: 9, letterSpacing: 1.6, color: HC.blue },
  title: { fontFamily: HF.serif, fontSize: 20, color: HC.cream },
  sub: { fontFamily: HF.body, fontSize: 12.5, color: HC.t2, textAlign: 'center', lineHeight: 18, maxWidth: 260 },
});
