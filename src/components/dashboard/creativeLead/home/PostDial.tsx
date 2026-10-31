// src/components/dashboard/creativeLead/home/PostDial.tsx
//
// The CL's single create affordance — a "＋ Post" pill that lives in the
// "Your work" header and blooms DOWNWARD, right-aligned, into two circles:
//   • Post a gig   (orange, megaphone)  → /create?initialTab=gig
//   • Create event (purple, calendar)   → /create?initialTab=event
// (DOCS/04-design/mockups/creative-lead-home-post-dial.html, locked 2026-10-29).
// Replaces the center PostFAB for creative_lead — create is now home-only.
//
// Motion: one shared `progress` (0→1) drives the scrim fade + a staggered drop
// of the two items (translateY -14→0 + opacity), so open AND close are fully
// controllable/interruptible and run on the UI thread. Only opacity/transform
// animate. The whole overlay rides a transparent Modal so the scrim covers the
// nav; the trigger is measured on open so the dial drops from under it.

import React, { useCallback, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
  useReducedMotion,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Plus, X, Megaphone, CalendarPlus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { HC, HF } from '@/components/dashboard/artist/home/ui';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1); // strong ease-out for UI
const OPEN_MS = 200;
const CLOSE_MS = 150;

export default function PostDial() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const triggerRef = useRef<View>(null);
  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState({ top: 140, right: 20 });
  const progress = useSharedValue(0);

  const open = useCallback(() => {
    const show = (top: number, right: number) => {
      setAnchor({ top, right });
      setMounted(true);
      progress.set(withTiming(1, { duration: OPEN_MS, easing: EASE_OUT }));
    };
    const { width } = Dimensions.get('window');
    const fn = triggerRef.current?.measureInWindow;
    if (fn) {
      triggerRef.current!.measureInWindow((x, y, w, h) => {
        show(y, Math.max(width - (x + w), 12));
      });
    } else {
      show(140, 20);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [progress]);

  const close = useCallback(() => {
    progress.set(
      withTiming(0, { duration: CLOSE_MS, easing: EASE_OUT }, (finished) => {
        'worklet';
        if (finished) runOnJS(setMounted)(false);
      }),
    );
  }, [progress]);

  const go = useCallback(
    (tab: 'gig' | 'event') => {
      router.push(`/(app)/create?initialTab=${tab}` as any);
      close();
    },
    [router, close],
  );

  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.get() * 0.52 }));
  const closeStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scale: reduced ? 1 : interpolate(progress.get(), [0, 1], [0.9, 1], Extrapolation.CLAMP) }],
  }));
  // Staggered drop: gig leads (0→0.8), event trails (0.2→1).
  const gigStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 0.8], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: reduced ? 0 : interpolate(progress.get(), [0, 0.8], [-14, 0], Extrapolation.CLAMP) }],
  }));
  const evStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0.2, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: reduced ? 0 : interpolate(progress.get(), [0.2, 1], [-14, 0], Extrapolation.CLAMP) }],
  }));

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={open}
        hitSlop={8}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed, mounted && styles.triggerHidden]}
        accessibilityRole="button"
        accessibilityLabel="Post a gig or event"
      >
        <Plus size={15} color="#190B05" strokeWidth={2.6} />
        <Text style={styles.triggerTxt}>Post</Text>
      </Pressable>

      <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
        <Animated.View style={[styles.scrim, scrimStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close create menu" />
        </Animated.View>

        <View style={[styles.dial, { top: anchor.top, right: anchor.right }]} pointerEvents="box-none">
          <Animated.View style={closeStyle}>
            <Pressable onPress={close} hitSlop={8} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
              <X size={17} color={HC.t1} strokeWidth={2} />
            </Pressable>
          </Animated.View>

          <Animated.View style={[styles.itemRow, gigStyle]}>
            <Pressable style={styles.labelCard} onPress={() => go('gig')} accessibilityRole="button" accessibilityLabel="Post a gig">
              <Text style={styles.labelMain}>Post a gig</Text>
              <Text style={styles.labelSub}>HIRE ARTISTS</Text>
            </Pressable>
            <Pressable onPress={() => go('gig')} style={[styles.circle, styles.circleGig]} accessibilityRole="button" accessibilityLabel="Post a gig">
              <Megaphone size={22} color="#FFFFFF" strokeWidth={1.9} />
            </Pressable>
          </Animated.View>

          <Animated.View style={[styles.itemRow, evStyle]}>
            <Pressable style={styles.labelCard} onPress={() => go('event')} accessibilityRole="button" accessibilityLabel="Create event">
              <Text style={styles.labelMain}>Create event</Text>
              <Text style={styles.labelSub}>WORKSHOP · AUDITION</Text>
            </Pressable>
            <Pressable onPress={() => go('event')} style={[styles.circle, styles.circleEv]} accessibilityRole="button" accessibilityLabel="Create event">
              <CalendarPlus size={22} color="#FFFFFF" strokeWidth={1.9} />
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.42,
  shadowRadius: 16,
  elevation: 8,
};

const styles = StyleSheet.create({
  // Trigger pill (resting)
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: HC.orange,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 999,
    shadowColor: HC.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  triggerPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  triggerHidden: { opacity: 0 },
  triggerTxt: { fontFamily: HF.bold, fontSize: 12.5, color: '#190B05' },

  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },

  dial: { position: 'absolute', alignItems: 'flex-end', gap: 13 },

  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: HC.card,
    borderWidth: 1,
    borderColor: HC.hair,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    ...SHADOW,
  },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  labelCard: {
    backgroundColor: '#1A1A20',
    borderWidth: 1,
    borderColor: HC.hair,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    ...SHADOW,
  },
  labelMain: { fontFamily: HF.bold, fontSize: 13, color: HC.cream },
  labelSub: { fontFamily: HF.mono, fontSize: 8.5, letterSpacing: 0.4, color: HC.t2, textTransform: 'uppercase', marginTop: 2 },

  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW,
  },
  circleGig: { backgroundColor: HC.orange, shadowColor: HC.orange, shadowOpacity: 0.4 },
  circleEv: { backgroundColor: HC.purple, shadowColor: HC.purple, shadowOpacity: 0.4 },
});
