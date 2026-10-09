// src/components/gigs/detail/StickyApply.tsx
// Sticky footer — the Apply CTA only (no amount / percent / secure text, §7).
// Always rendered (never hidden when a deadline is missing). Three states.

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Check, Clock } from 'lucide-react-native';
import { C, F } from './ui';

export function StickyApply({
  hasApplied,
  deadlinePassed,
  onApply,
  bottomInset = 16,
}: {
  hasApplied: boolean;
  deadlinePassed: boolean;
  onApply: () => void;
  bottomInset?: number;
}) {
  const disabled = hasApplied || deadlinePassed;
  return (
    <View pointerEvents="box-none">
      <LinearGradient colors={['transparent', C.canvas]} locations={[0, 0.5]} style={[s.wrap, { paddingBottom: bottomInset }]}>
        <Pressable
          onPress={() => !disabled && onApply()}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={deadlinePassed ? 'Applications closed' : hasApplied ? 'Already applied' : 'Apply now'}
          accessibilityState={{ disabled }}
          style={({ pressed }) => [s.btn, disabled ? s.btnOff : null, pressed && !disabled && { opacity: 0.9 }]}
        >
          {deadlinePassed ? (
            <>
              <Clock size={16} color={C.t5} />
              <Text style={[s.txt, s.txtOff]}>Applications closed</Text>
            </>
          ) : hasApplied ? (
            <>
              <Check size={16} color={C.green} />
              <Text style={[s.txt, { color: C.t2 }]}>Applied</Text>
            </>
          ) : (
            <>
              <Text style={s.txt}>Apply now</Text>
              <ArrowRight size={16} color="#fff" />
            </>
          )}
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingTop: 20 },
  btn: { height: 54, borderRadius: 16, backgroundColor: C.orange, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, shadowColor: C.orange, shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  btnOff: { backgroundColor: '#1a1a20', shadowOpacity: 0, elevation: 0 },
  txt: { fontFamily: F.bold, fontSize: 15.5, letterSpacing: 0.3, color: '#fff' },
  txtOff: { color: C.t5 },
});
