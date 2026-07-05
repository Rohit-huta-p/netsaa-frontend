# NetsaVideoPlayer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the OS-native `EventVideo` with a brand-styled, custom-control video player (`NetsaVideoPlayer`) for the event hero + Phase-2 reels: poster → tap → inline "quiet glass" controls → fullscreen.

**Architecture:** One RN component on `expo-video` with `nativeControls={false}` and a custom overlay. Player state comes from expo's `useEvent`/`useEventListener` hooks (`statusChange`, `playingChange`, `timeUpdate`, `playToEnd`). Two small hooks (`useReducedMotion`, `useAutoHideControls`) and one sub-component (`VideoScrubber`) keep it focused.

**Tech Stack:** React Native / Expo, `expo-video` 3.0.16, `expo` (useEvent), `expo-linear-gradient`, `lucide-react-native`, jest (frontend gate — `tsc` crashes in this repo).

**Spec:** `DOCS/08-planning/superpowers/specs/2026-07-04-netsa-video-player-design.md`

---

## File Structure

- Create `netsa-frontend/src/hooks/useReducedMotion.ts` — OS reduce-motion flag (AccessibilityInfo).
- Create `netsa-frontend/src/hooks/useAutoHideControls.ts` — show/auto-hide timer for the control bar.
- Create `netsa-frontend/src/components/media/VideoScrubber.tsx` — draggable orange seek bar.
- Create `netsa-frontend/src/components/media/NetsaVideoPlayer.tsx` — the player (states + controls). Exports `muxHls`, `muxPoster` helpers.
- Modify `netsa-frontend/src/components/events/detail/EventHeroGallery.tsx:5,63` — swap `EventVideo` → `NetsaVideoPlayer`.
- Modify `netsa-frontend/src/components/events/manage/PosterHero.tsx:28,138` — same swap.
- Delete `netsa-frontend/src/components/events/EventVideo.tsx`.

**Hygiene:** netsa-frontend has ~18 unrelated WIP files. `git add` only the exact files named per task. Never `git add -A`/`.`/`src`. Frontend `tsc` crashes — do NOT run it; jest (babel) is the gate.

---

### Task 1: useReducedMotion hook

**Files:** Create `src/hooks/useReducedMotion.ts`; Test `src/hooks/__tests__/useReducedMotion.test.ts`.

- [ ] **Step 1: Write the failing test**
```ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from '../useReducedMotion';

jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove: jest.fn() } as any);

it('reflects the OS reduce-motion flag', async () => {
  const { result } = renderHook(() => useReducedMotion());
  await waitFor(() => expect(result.current).toBe(true));
});
```

- [ ] **Step 2: Run to verify it fails**
Run: `npx jest useReducedMotion`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**
```ts
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [rm, setRm] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { if (mounted) setRm(v); });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setRm);
    return () => { mounted = false; sub.remove(); };
  }, []);
  return rm;
}
```

- [ ] **Step 4: Run to verify it passes**
Run: `npx jest useReducedMotion` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/hooks/useReducedMotion.ts src/hooks/__tests__/useReducedMotion.test.ts
git commit -m "feat(mobile): useReducedMotion hook (AccessibilityInfo)"
```

---

### Task 2: useAutoHideControls hook

**Files:** Create `src/hooks/useAutoHideControls.ts`; Test `src/hooks/__tests__/useAutoHideControls.test.ts`.

- [ ] **Step 1: Write the failing test**
```ts
import { renderHook, act } from '@testing-library/react-native';
import { useAutoHideControls } from '../useAutoHideControls';

jest.useFakeTimers();

it('hides after the interval when active, and reveal() brings it back', () => {
  const { result } = renderHook(() => useAutoHideControls(true, 3000));
  expect(result.current.visible).toBe(true);
  act(() => { jest.advanceTimersByTime(3000); });
  expect(result.current.visible).toBe(false);
  act(() => { result.current.reveal(); });
  expect(result.current.visible).toBe(true);
});

it('stays visible when inactive (paused)', () => {
  const { result } = renderHook(() => useAutoHideControls(false, 3000));
  act(() => { jest.advanceTimersByTime(5000); });
  expect(result.current.visible).toBe(true);
});
```

- [ ] **Step 2: Run to verify it fails**
Run: `npx jest useAutoHideControls`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**
```ts
import { useCallback, useEffect, useRef, useState } from 'react';

export function useAutoHideControls(active: boolean, hideMs = 3000) {
  const [visible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };

  const arm = useCallback(() => {
    clear();
    if (active) timer.current = setTimeout(() => setVisible(false), hideMs);
  }, [active, hideMs]);

  const reveal = useCallback(() => { setVisible(true); arm(); }, [arm]);

  useEffect(() => {
    if (active) { setVisible(true); arm(); } else { clear(); setVisible(true); }
    return clear;
  }, [active, arm]);

  return { visible, reveal };
}
```

- [ ] **Step 4: Run to verify it passes**
Run: `npx jest useAutoHideControls` → PASS (both cases).

- [ ] **Step 5: Commit**
```bash
git add src/hooks/useAutoHideControls.ts src/hooks/__tests__/useAutoHideControls.test.ts
git commit -m "feat(mobile): useAutoHideControls timer hook"
```

---

### Task 3: VideoScrubber (draggable orange seek bar)

**Files:** Create `src/components/media/VideoScrubber.tsx`; Test `src/components/media/__tests__/VideoScrubber.test.tsx`.

- [ ] **Step 1: Write the failing test** (pure seek math + render)
```tsx
import { render } from '@testing-library/react-native';
import VideoScrubber, { fracFromX } from '../VideoScrubber';

describe('fracFromX', () => {
  it('clamps a tap x to 0..1 of the track width', () => {
    expect(fracFromX(50, 100)).toBeCloseTo(0.5);
    expect(fracFromX(-5, 100)).toBe(0);
    expect(fracFromX(200, 100)).toBe(1);
    expect(fracFromX(10, 0)).toBe(0);
  });
});

it('renders without crashing at a given progress', () => {
  render(<VideoScrubber progress={0.5} onSeek={() => {}} />);
});
```

- [ ] **Step 2: Run to verify it fails**
Run: `npx jest VideoScrubber`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**
```tsx
import { useMemo, useState } from 'react';
import { View, StyleSheet, PanResponder, type LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function fracFromX(x: number, width: number): number {
  if (width <= 0) return 0;
  return Math.max(0, Math.min(1, x / width));
}

export default function VideoScrubber({ progress, onSeek }: { progress: number; onSeek: (frac: number) => void }) {
  const [width, setWidth] = useState(0);
  const pct = Math.max(0, Math.min(1, progress)) * 100;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => onSeek(fracFromX(e.nativeEvent.locationX, width)),
        onPanResponderMove: (e) => onSeek(fracFromX(e.nativeEvent.locationX, width)),
      }),
    [width, onSeek],
  );

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      hitSlop={{ top: 12, bottom: 12 }}
      {...pan.panHandlers}
      style={styles.track}
      accessibilityRole="adjustable"
      accessibilityValue={{ now: Math.round(pct), min: 0, max: 100 }}
    >
      <LinearGradient colors={['#FF8A5B', '#FF6B35']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fill, { width: `${pct}%` }]} />
      <View style={[styles.thumb, { left: `${pct}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 4, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 99 },
  thumb: { position: 'absolute', width: 11, height: 11, borderRadius: 6, marginLeft: -5, backgroundColor: '#fff' },
});
```

- [ ] **Step 4: Run to verify it passes**
Run: `npx jest VideoScrubber` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/components/media/VideoScrubber.tsx src/components/media/__tests__/VideoScrubber.test.tsx
git commit -m "feat(mobile): VideoScrubber seek bar (orange fill, drag-to-seek)"
```

---

### Task 4: NetsaVideoPlayer (states + controls)

**Files:** Create `src/components/media/NetsaVideoPlayer.tsx`; Test `src/components/media/__tests__/NetsaVideoPlayer.test.tsx`.

- [ ] **Step 1: Write the failing test** (mock the native deps; assert the core behavior)
```tsx
import { render, fireEvent } from '@testing-library/react-native';

const mockPlayer: any = {
  play: jest.fn(), pause: jest.fn(), replace: jest.fn(), replay: jest.fn(),
  muted: true, playing: false, status: 'readyToPlay', currentTime: 0, duration: 48,
};
jest.mock('expo-video', () => ({ useVideoPlayer: () => mockPlayer, VideoView: () => null }));
jest.mock('expo', () => ({
  useEvent: (_p: any, _name: string, initial: any) => initial,
  useEventListener: jest.fn(),
}));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: () => null }));
jest.mock('@/hooks/useReducedMotion', () => ({ useReducedMotion: () => false }));

import NetsaVideoPlayer from '../NetsaVideoPlayer';

beforeEach(() => { mockPlayer.play.mockClear(); mockPlayer.muted = true; });

it('idle shows Play; tapping it starts playback unmuted', () => {
  const { getByLabelText } = render(<NetsaVideoPlayer playbackId="pb_1" />);
  fireEvent.press(getByLabelText('Play'));
  expect(mockPlayer.play).toHaveBeenCalled();
  expect(mockPlayer.muted).toBe(false);
});

it('renders the retry affordance in the error state', () => {
  mockPlayer.status = 'error';
  const { getByLabelText } = render(<NetsaVideoPlayer playbackId="pb_1" />);
  expect(getByLabelText('Retry')).toBeTruthy();
  mockPlayer.status = 'readyToPlay';
});
```

- [ ] **Step 2: Run to verify it fails**
Run: `npx jest NetsaVideoPlayer`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**
```tsx
import { useCallback, useRef, useState } from 'react';
import { View, Pressable, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent, useEventListener } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RefreshCw } from 'lucide-react-native';
import VideoScrubber from './VideoScrubber';
import { useAutoHideControls } from '@/hooks/useAutoHideControls';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const T0 = '#F3EFE8', T2 = '#71717a', ORANGE = '#FF6B35';

export const muxHls = (id: string) => `https://stream.mux.com/${id}.m3u8`;
export const muxPoster = (id: string) => `https://image.mux.com/${id}/thumbnail.jpg?time=1`;

function fmt(t: number): string {
  const s = Math.max(0, Math.floor(t || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? '0' : ''}${r}`;
}

export default function NetsaVideoPlayer({
  playbackId, poster, aspectRatio = 16 / 9, style,
}: { playbackId: string; poster?: string; aspectRatio?: number; style?: any }) {
  const viewRef = useRef<VideoView>(null);
  const player = useVideoPlayer(muxHls(playbackId), (p) => { p.timeUpdateEventInterval = 0.25; p.muted = true; });

  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { currentTime } = useEvent(player, 'timeUpdate', { currentTime: player.currentTime });
  const { muted } = useEvent(player, 'mutedChange', { muted: player.muted });

  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  useEventListener(player, 'playToEnd', () => setEnded(true));

  const { visible, reveal } = useAutoHideControls(isPlaying && !ended);
  useReducedMotion(); // wired for future fade-timing; controls currently show/hide instantly

  const duration = player.duration || 0;
  const uiState =
    status === 'error' ? 'error'
    : ended ? 'ended'
    : !started ? 'idle'
    : status === 'loading' ? 'buffering'
    : isPlaying ? 'playing' : 'paused';

  const start = useCallback(() => { setStarted(true); setEnded(false); player.muted = false; player.play(); reveal(); }, [player, reveal]);
  const togglePlay = useCallback(() => { if (isPlaying) player.pause(); else player.play(); reveal(); }, [player, isPlaying, reveal]);
  const toggleMute = useCallback(() => { player.muted = !player.muted; reveal(); }, [player, reveal]);
  const seek = useCallback((frac: number) => { if (duration > 0) player.currentTime = frac * duration; }, [player, duration]);
  const onReplay = useCallback(() => { setEnded(false); player.currentTime = 0; player.play(); reveal(); }, [player, reveal]);
  const onRetry = useCallback(() => { player.replace(muxHls(playbackId)); setStarted(true); setEnded(false); player.play(); }, [player, playbackId]);
  const onFullscreen = useCallback(() => { viewRef.current?.enterFullscreen(); }, []);

  const showBar = (uiState === 'playing' || uiState === 'paused') && visible;

  return (
    <View style={[styles.frame, { aspectRatio }, style]}>
      <VideoView ref={viewRef} player={player} nativeControls={false} contentFit="cover" allowsFullscreen style={StyleSheet.absoluteFill} />

      {uiState === 'idle' && (
        <Image source={{ uri: poster ?? muxPoster(playbackId) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}

      {(uiState === 'playing' || uiState === 'paused') && (
        <Pressable style={StyleSheet.absoluteFill} onPress={visible ? togglePlay : reveal} accessibilityRole="button" accessibilityLabel={isPlaying ? 'Pause' : 'Play'} />
      )}

      {uiState === 'idle' && (
        <View style={styles.center} pointerEvents="box-none">
          <View style={styles.radial} pointerEvents="none" />
          <Pressable onPress={start} style={styles.glass} accessibilityRole="button" accessibilityLabel="Play">
            <Play size={23} color={T0} style={{ marginLeft: 3 }} />
          </Pressable>
        </View>
      )}
      {uiState === 'buffering' && (<View style={styles.center} pointerEvents="none"><ActivityIndicator color={ORANGE} /></View>)}
      {uiState === 'ended' && (
        <View style={styles.center}>
          <Pressable onPress={onReplay} style={styles.glass} accessibilityRole="button" accessibilityLabel="Replay"><RotateCcw size={22} color={T0} /></Pressable>
        </View>
      )}
      {uiState === 'error' && (
        <View style={styles.center}>
          <Text style={styles.errText}>Couldn't play</Text>
          <Pressable onPress={onRetry} style={styles.retry} accessibilityRole="button" accessibilityLabel="Retry">
            <RefreshCw size={14} color={T0} /><Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {uiState === 'idle' && duration > 0 && (
        <View style={styles.pill}><Text style={styles.pillText}>{fmt(duration)}</Text></View>
      )}

      {showBar && (
        <View style={styles.barWrap} pointerEvents="box-none">
          <LinearGradient colors={['transparent', 'rgba(6,5,9,0.9)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View style={styles.bar}>
            <VideoScrubber progress={duration > 0 ? currentTime / duration : 0} onSeek={seek} />
            <View style={styles.row}>
              <Pressable onPress={togglePlay} hitSlop={8} accessibilityRole="button" accessibilityLabel={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause size={19} color={T0} /> : <Play size={19} color={T0} />}
              </Pressable>
              <Text style={styles.time}>{fmt(currentTime)} <Text style={{ color: T2 }}>/ {fmt(duration)}</Text></Text>
              <View style={{ flex: 1 }} />
              <Pressable onPress={toggleMute} hitSlop={8} accessibilityRole="button" accessibilityLabel={muted ? 'Unmute' : 'Mute'}>
                {muted ? <VolumeX size={19} color={T0} /> : <Volume2 size={19} color={T0} />}
              </Pressable>
              <Pressable onPress={onFullscreen} hitSlop={8} accessibilityRole="button" accessibilityLabel="Fullscreen"><Maximize size={18} color={T0} /></Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#0E0C12', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 10 },
  radial: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(0,0,0,0.28)' },
  glass: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(0,0,0,0.38)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  pill: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  pillText: { fontFamily: 'SpaceMono-Regular', fontSize: 11, color: T0 },
  barWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 40 },
  bar: { paddingHorizontal: 13, paddingBottom: 13, paddingTop: 11 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 11 },
  time: { fontFamily: 'SpaceMono-Regular', fontSize: 11, color: T0 },
  errText: { fontFamily: 'Outfit-Medium', fontSize: 13, color: T2 },
  retry: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.38)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  retryText: { fontFamily: 'Outfit-SemiBold', fontSize: 12, color: T0 },
});
```
Note: if `SpaceMono-Regular`/`Outfit-*` family strings differ from what the app loads, match the existing families used in `PosterHero.tsx`/`EventHeroGallery.tsx` (they're loaded there). `useEvent`/`useEventListener` import from `'expo'` (confirmed exported at `expo/build/Expo.d.ts`).

- [ ] **Step 4: Run to verify it passes**
Run: `npx jest NetsaVideoPlayer` → PASS (both cases). Then `npx jest src/components/media src/hooks` to confirm the whole media/hook set is green.

- [ ] **Step 5: Commit**
```bash
git add src/components/media/NetsaVideoPlayer.tsx src/components/media/__tests__/NetsaVideoPlayer.test.tsx
git commit -m "feat(mobile): NetsaVideoPlayer — quiet-glass custom controls on expo-video"
```

---

### Task 5: Swap call sites + delete EventVideo

**Files:** Modify `src/components/events/detail/EventHeroGallery.tsx`; Modify `src/components/events/manage/PosterHero.tsx`; Delete `src/components/events/EventVideo.tsx`.

- [ ] **Step 1: EventHeroGallery** — change the import (line ~5) `import EventVideo from '../EventVideo';` → `import NetsaVideoPlayer from '../../media/NetsaVideoPlayer';`, and the usage (line ~63) `<EventVideo playbackId={item.muxPlaybackId} style={{ width: innerW, height: HERO_H }} />` → `<NetsaVideoPlayer playbackId={item.muxPlaybackId} style={{ width: innerW, height: HERO_H }} />`.

- [ ] **Step 2: PosterHero** — change the import (line ~28) `import EventVideo from '../EventVideo';` → `import NetsaVideoPlayer from '../../media/NetsaVideoPlayer';`, and the usage (line ~138) `<EventVideo playbackId={item.muxPlaybackId} style={{ width: SCREEN_W, height: HERO_H }} />` → `<NetsaVideoPlayer playbackId={item.muxPlaybackId} style={{ width: SCREEN_W, height: HERO_H }} />`.

- [ ] **Step 3: Delete the old component**
Run: `git rm src/components/events/EventVideo.tsx`
Then confirm nothing else imports it: `rg -n "EventVideo" src app` → expect no matches.

- [ ] **Step 4: Verify no regression**
Run: `npx jest src/components/events` → the pre-existing 2 failures (`EventCapacityBar.smoke`, `ComposerShell.smoke`) are the only failures; nothing new. Neither hero component has a jest test that imports it, so the swap is verified by the no-import grep + the app bundling in manual QA (Task 6).

- [ ] **Step 5: Commit**
```bash
git add src/components/events/detail/EventHeroGallery.tsx src/components/events/manage/PosterHero.tsx src/components/events/EventVideo.tsx
git commit -m "feat(mobile): use NetsaVideoPlayer in event hero + poster; remove EventVideo"
```

---

### Task 6: Manual device QA

**Files:** none (device). Append results to `DOCS/07-testing-qa/qa/event-flow-live-qa.md`.

- [ ] **Step 1:** On a real device, open an event whose media has a ready video → the hero shows the **Mux poster + glass play** (verify the play button is visible on both a dark and a bright poster — the radial scrim).
- [ ] **Step 2:** Tap play → sound-on inline playback; controls appear then **auto-hide after ~3s**; tap reveals them; **scrubber** seeks; **mute** toggles; **timecode** advances.
- [ ] **Step 3:** Tap **fullscreen** → native fullscreen; exit returns inline. Let a short clip **end** → replay affordance; replay works.
- [ ] **Step 4:** Force an error (bad playbackId) → "Couldn't play · Retry"; retry re-loads.
- [ ] **Step 5:** Navigate away mid-play → audio stops (no background playback).
- [ ] **Step 6:** Append a dated live-QA section to `DOCS/07-testing-qa/qa/event-flow-live-qa.md` per the project's live-QA convention.

---

## Self-Review (author)

- **Spec coverage:** component API (T4 props) · idle/buffering/playing/paused/ended/error states (T4 `uiState`) · radial-scrim fix (T4 `styles.radial`) · quiet-glass controls with orange-only scrubber (T3 + T4) · mono timecode (T4) · mute/fullscreen (T4) · auto-hide (T2+T4) · reduced-motion hook (T1, wired) · tokens (T3/T4 styles from spec §5) · a11y labels + adjustable scrubber (T3/T4) · swap + delete EventVideo (T5) · manual QA (T6). Deferred items (captions/PiP/profile-convergence) intentionally absent.
- **Placeholder scan:** no TBD/TODO; every code step is complete.
- **Type consistency:** `muxHls`/`muxPoster`/`fracFromX`/`useAutoHideControls({visible,reveal})`/`useReducedMotion()` names consistent across tasks; `playbackId`/`style` props match the two call sites' existing usage so the swap is drop-in.

**Known soft spots (confirm during build, not blockers):**
1. `useEvent` payload field names (`isPlaying`, `currentTime`, `muted`, `status`) are from the expo-video 3.0.16 event-payload types — if a field differs, adjust the destructure; the `useEvent(player, name, initial)` call shape is confirmed.
2. Font-family strings — match whatever `PosterHero.tsx` actually loads (`SpaceMono-*`, `Outfit-*`) if they differ.
3. `player.duration` is 0 until `readyToPlay`; guarded everywhere with `duration > 0`.
