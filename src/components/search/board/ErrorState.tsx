// src/components/search/board/ErrorState.tsx
//
// Error state for the active search body: an alert halo + a Try-again button.
// A·Minimal (search mockup, frame 07).

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { C, F, INK } from './theme';

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={s.center}>
      <View style={s.halo}>
        <AlertTriangle size={30} color={C.t3} strokeWidth={1.7} />
      </View>
      <Text style={s.h3}>Couldn’t load results</Text>
      <Text style={s.p}>Something went wrong on our side.{'\n'}Check your connection and try again.</Text>
      <Pressable onPress={onRetry} style={s.retry} hitSlop={6}>
        <RefreshCw size={15} color={INK} strokeWidth={2.2} />
        <Text style={s.retryTxt}>Try again</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  center: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 20 },
  halo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: C.hair,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  h3: { fontFamily: F.serif, fontSize: 21, color: C.cream, textAlign: 'center' },
  p: { fontFamily: F.body, fontSize: 13.5, color: C.t3, marginTop: 9, lineHeight: 21, textAlign: 'center' },
  retry: {
    marginTop: 20,
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 12,
    backgroundColor: C.orange,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  retryTxt: { fontFamily: F.bold, fontSize: 13.5, color: INK },
});
