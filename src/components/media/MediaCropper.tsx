/**
 * MediaCropper — the in-app pan/zoom "crop to a fixed frame" modal.
 *
 * A source photo sits inside a fixed-aspect frame; drag to reposition, pinch to
 * zoom, and whatever lands inside the frame is what gets saved. On confirm it
 * crops + resizes the source on-device (expo-image-manipulator) and returns a
 * JPEG asset for uploadMediaFlow — bytes never leave the phone un-cropped.
 *
 * Driven by usePickAndCrop(); the frame shape / ratio / output come from
 * MEDIA_SPEC. Phase 0 foundation — see memory: netsa-media-cropper-plan.
 *
 * NOTE: importing this module requires `expo-image-manipulator` to be installed
 * (`npx expo install expo-image-manipulator`).
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Modal, View, Text, StyleSheet, Image, ActivityIndicator, Alert, useWindowDimensions, Platform, StatusBar } from 'react-native';
import { Pressable } from '@/components/ui/Pressable';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import { SaveFormat } from 'expo-image-manipulator';
import type { CroppedAsset, MediaSpec } from '@/constants/mediaSpec';

const C = {
  backdrop: '#09090b',
  dim: 'rgba(9,9,11,0.66)',
  frame: 'rgba(255,255,255,0.92)',
  orange: '#FF6B35',
  t1: '#FFFFFF',
  t2: 'rgba(243,239,232,0.72)',
};
const F = {
  body: 'Outfit-Regular',
  semibold: 'Outfit-SemiBold',
  bold: 'Outfit-Bold',
  mono: 'SpaceMono-Bold',
};

const MAX_SCALE = 4;

// Web: a native <Modal> renders into the page flow, so a tall / scrolled-down
// background page can leave the pinned top bar (with "Use") above the fold. Pin
// the whole surface to the visible viewport so there is no fold to scroll past.
const WEB_LOCK = Platform.OS === 'web'
  ? ({ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh', maxHeight: '100dvh', overflow: 'hidden' } as any)
  : undefined;

const SCRIM_TOP = ['rgba(9,9,11,0.66)', 'rgba(9,9,11,0.28)', 'transparent'] as const;
const SCRIM_BOT = ['transparent', 'rgba(9,9,11,0.6)'] as const;

function clampW(v: number, lo: number, hi: number) {
  'worklet';
  return Math.min(Math.max(v, lo), hi);
}

export interface MediaCropperProps {
  visible: boolean;
  uri: string | null;
  sourceWidth?: number;
  sourceHeight?: number;
  spec: MediaSpec;
  onCancel: () => void;
  onDone: (asset: CroppedAsset) => void;
}

export default function MediaCropper({
  visible, uri, sourceWidth = 0, sourceHeight = 0, spec, onCancel, onDone,
}: MediaCropperProps) {
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [measured, setMeasured] = useState<{ w: number; h: number } | null>(null);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const srcW = sourceWidth || measured?.w || 0;
  const srcH = sourceHeight || measured?.h || 0;

  // Measure the source if the picker didn't report dimensions.
  useEffect(() => {
    if (!uri) { setMeasured(null); return; }
    if (sourceWidth && sourceHeight) return;
    let alive = true;
    Image.getSize(uri, (w, h) => { if (alive) setMeasured({ w, h }); }, () => {});
    return () => { alive = false; };
  }, [uri, sourceWidth, sourceHeight]);

  // Reset the transform whenever a new source loads.
  useEffect(() => {
    scale.value = 1; savedScale.value = 1;
    tx.value = 0; ty.value = 0; savedTx.value = 0; savedTy.value = 0;
    setBusy(false);
  }, [uri]); // eslint-disable-line react-hooks/exhaustive-deps

  // Web only: freeze the underlying page scroll while the cropper is open so the
  // viewport-locked surface is the only thing that can move.
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const doc: any = (globalThis as any).document;
    if (!doc?.documentElement || !doc?.body) return;
    const prevHtml = doc.documentElement.style.overflow;
    const prevBody = doc.body.style.overflow;
    doc.documentElement.style.overflow = 'hidden';
    doc.body.style.overflow = 'hidden';
    return () => {
      doc.documentElement.style.overflow = prevHtml;
      doc.body.style.overflow = prevBody;
    };
  }, [visible]);

  // insets.top reads 0 inside a <Modal> on Android — floor it so the top bar
  // (and "Use") always clears the status bar / notch. Web has no status bar.
  const safeTop = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0);

  const geo = useMemo(() => {
    const HEADER = 64;
    const FOOTER = 128;
    const topGap = insets.top + HEADER;
    const bottomGap = insets.bottom + FOOTER;
    const availW = Math.max(1, winW - 48);
    const availH = Math.max(1, winH - topGap - bottomGap);
    let frameW = availW;
    let frameH = frameW / spec.aspect;
    if (frameH > availH) { frameH = availH; frameW = frameH * spec.aspect; }
    const cx = winW / 2;
    const cy = topGap + availH / 2;
    const coverScale = srcW && srcH ? Math.max(frameW / srcW, frameH / srcH) : 1;
    const baseW = srcW * coverScale;
    const baseH = srcH * coverScale;
    return {
      frameW, frameH, cx, cy, coverScale, baseW, baseH,
      frameLeft: cx - frameW / 2, frameTop: cy - frameH / 2,
      imgLeft: cx - baseW / 2, imgTop: cy - baseH / 2,
    };
  }, [winW, winH, insets.top, insets.bottom, spec.aspect, srcW, srcH]);

  const ready = srcW > 0 && srcH > 0;

  const gesture = useMemo(() => {
    const { frameW, frameH, baseW, baseH } = geo;
    const clampTranslate = () => {
      'worklet';
      const maxTx = Math.max(0, (baseW * scale.value - frameW) / 2);
      const maxTy = Math.max(0, (baseH * scale.value - frameH) / 2);
      const cx = clampW(tx.value, -maxTx, maxTx);
      const cy = clampW(ty.value, -maxTy, maxTy);
      tx.value = withTiming(cx, { duration: 140 });
      ty.value = withTiming(cy, { duration: 140 });
      savedTx.value = cx;
      savedTy.value = cy;
    };
    const pan = Gesture.Pan()
      .onStart(() => { savedTx.value = tx.value; savedTy.value = ty.value; })
      .onUpdate((e) => { tx.value = savedTx.value + e.translationX; ty.value = savedTy.value + e.translationY; })
      .onEnd(() => { clampTranslate(); });
    const pinch = Gesture.Pinch()
      .onStart(() => { savedScale.value = scale.value; })
      .onUpdate((e) => { scale.value = clampW(savedScale.value * e.scale, 0.6, MAX_SCALE + 1); })
      .onEnd(() => {
        const next = clampW(scale.value, 1, MAX_SCALE);
        if (next !== scale.value) runOnJS(Haptics.selectionAsync)();
        scale.value = withTiming(next, { duration: 140 });
        savedScale.value = next;
        clampTranslate();
      });
    return Gesture.Simultaneous(pan, pinch);
  }, [geo]); // shared values are stable refs

  const imgStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const holePath = useMemo(() => {
    const { cx, cy, frameW, frameH, frameLeft, frameTop } = geo;
    const outer = `M0 0 H${winW} V${winH} H0 Z`;
    if (spec.shape === 'circle') {
      const r = frameW / 2;
      return `${outer} M${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
    }
    return `${outer} M${frameLeft} ${frameTop} H${frameLeft + frameW} V${frameTop + frameH} H${frameLeft} Z`;
  }, [geo, winW, winH, spec.shape]);

  async function confirm() {
    if (!uri || !ready || busy) return;
    setBusy(true);
    try {
      const { frameW, frameH, baseW, baseH, coverScale } = geo;
      const s = scale.value;
      const totalScale = coverScale * s;
      let originX = ((baseW * s) / 2 - tx.value - frameW / 2) / totalScale;
      let originY = ((baseH * s) / 2 - ty.value - frameH / 2) / totalScale;
      let cropW = frameW / totalScale;
      let cropH = frameH / totalScale;
      originX = Math.min(Math.max(0, originX), Math.max(0, srcW - cropW));
      originY = Math.min(Math.max(0, originY), Math.max(0, srcH - cropH));
      cropW = Math.min(cropW, srcW - originX);
      cropH = Math.min(cropH, srcH - originY);
      const outW = Math.max(1, Math.min(spec.outputWidth, Math.round(cropW)));
      const saved = await runManipulate(
        uri,
        { originX: Math.round(originX), originY: Math.round(originY), width: Math.round(cropW), height: Math.round(cropH) },
        outW,
        spec.compress,
      );
      let fileSize = 0;
      try { const r = await fetch(saved.uri); const b = await r.blob(); fileSize = b.size; } catch { /* non-fatal */ }
      onDone({ uri: saved.uri, width: saved.width, height: saved.height, mimeType: 'image/jpeg', fileSize });
    } catch {
      Alert.alert('Could not crop', 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent={false} statusBarTranslucent onRequestClose={onCancel}>
      <GestureHandlerRootView style={[styles.root, WEB_LOCK]}>
        {ready && uri ? (
          <GestureDetector gesture={gesture}>
            <View style={StyleSheet.absoluteFill}>
              <Animated.View
                style={[
                  { position: 'absolute', left: geo.imgLeft, top: geo.imgTop, width: geo.baseW, height: geo.baseH },
                  imgStyle,
                ]}
              >
                <Image source={{ uri }} style={styles.fill} resizeMode="cover" />
              </Animated.View>
              <Svg width={winW} height={winH} style={StyleSheet.absoluteFill} pointerEvents="none">
                <Path d={holePath} fill={C.dim} fillRule="evenodd" />
                {spec.shape === 'circle' ? (
                  <Circle cx={geo.cx} cy={geo.cy} r={geo.frameW / 2} stroke={C.frame} strokeWidth={2} fill="none" />
                ) : (
                  <Rect x={geo.frameLeft} y={geo.frameTop} width={geo.frameW} height={geo.frameH} rx={2} stroke={C.frame} strokeWidth={2} fill="none" />
                )}
              </Svg>
            </View>
          </GestureDetector>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <ActivityIndicator color={C.orange} />
          </View>
        )}

        <LinearGradient colors={SCRIM_TOP} style={[styles.scrimTop, { height: safeTop + 88 }]} pointerEvents="none" />
        <LinearGradient colors={SCRIM_BOT} style={[styles.scrimBot, { height: insets.bottom + 108 }]} pointerEvents="none" />

        <View style={[styles.header, { paddingTop: safeTop + 10 }]} pointerEvents="box-none">
          <Pressable onPress={onCancel} hitSlop={10} style={styles.hBtn} accessibilityRole="button" accessibilityLabel="Cancel">
            <Text style={styles.hCancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.hTitle} numberOfLines={1}>{spec.title}</Text>
          <Pressable
            onPress={confirm}
            hitSlop={10}
            disabled={busy || !ready}
            style={({ pressed }) => [styles.usePill, (busy || !ready) && styles.usePillOff, pressed && styles.usePillPressed]}
            accessibilityRole="button"
            accessibilityLabel="Use photo"
          >
            {busy ? <ActivityIndicator color="#1a0d05" size="small" /> : <Text style={styles.useLabel}>Use</Text>}
          </Pressable>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 18 }]} pointerEvents="box-none">
          <View style={styles.pill}>
            <Text style={styles.pillRatio}>{spec.ratioLabel}</Text>
            <Text style={styles.pillHint}>Drag to move · pinch to zoom</Text>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

async function runManipulate(
  uri: string,
  crop: { originX: number; originY: number; width: number; height: number },
  outputWidth: number,
  compress: number,
): Promise<{ uri: string; width: number; height: number }> {
  const IM = ImageManipulator as any;
  // SDK 52+ context API.
  if (typeof IM.manipulate === 'function') {
    const ctx = IM.manipulate(uri);
    ctx.crop(crop);
    ctx.resize({ width: outputWidth });
    const ref = await ctx.renderAsync();
    const out = await ref.saveAsync({ compress, format: SaveFormat.JPEG });
    return { uri: out.uri, width: out.width, height: out.height };
  }
  // Legacy API fallback.
  const out = await IM.manipulateAsync(
    uri,
    [{ crop }, { resize: { width: outputWidth } }],
    { compress, format: SaveFormat.JPEG },
  );
  return { uri: out.uri, width: out.width, height: out.height };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.backdrop },
  fill: { width: '100%', height: '100%' },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  hBtn: { minWidth: 56, minHeight: 32, alignItems: 'center', justifyContent: 'center' },
  hCancel: { fontFamily: F.body, fontSize: 15, color: C.t2 },
  usePill: {
    minWidth: 56, minHeight: 36, paddingHorizontal: 18, borderRadius: 999,
    backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center',
  },
  usePillOff: { opacity: 0.45 },
  usePillPressed: { opacity: 0.82 },
  useLabel: { fontFamily: F.bold, fontSize: 15, color: '#1a0d05' },
  hTitle: { flex: 1, textAlign: 'center', fontFamily: F.semibold, fontSize: 14, color: C.t1, marginHorizontal: 8 },
  scrimTop: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 4 },
  scrimBot: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 4 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 5, alignItems: 'center' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  pillRatio: { fontFamily: F.mono, fontSize: 11, letterSpacing: 1, color: C.orange },
  pillHint: { fontFamily: F.body, fontSize: 12.5, color: C.t2 },
});
