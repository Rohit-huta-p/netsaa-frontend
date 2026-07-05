# NetsaVideoPlayer — Design Spec (branded playback for events + reels)

- **Date:** 2026-07-04
- **Status:** Approved (design + scope), pending spec review
- **Scope:** A reusable, brand-styled video player for the event hero + composer preview + (Phase-2) artist reels. Replaces the current `EventVideo` (OS-native controls). The profile `MediaViewerModal` (`react-native-video`) is **left as-is** and converged in a later pass.
- **Depends on:** the Mux video pipeline (Phase 1) — playback is Mux HLS via `playbackId`.

---

## 1. Problem

Today's `EventVideo` is a thin `expo-video` wrapper rendering OS `nativeControls` — zero brand, inconsistent look across iOS/Android, and a muted autoplay loop that doesn't fit a poster-first experience. NETSA's brand is editorial, near-black, warm-cream, with orange held back and glass controls floating on media. The player should feel hand-crafted and unmistakably NETSA, and behave deliberately (poster → tap → watch), which is also kind to Indian mobile data.

## 2. Decisions (locked with the founder, 2026-07-04)

1. **Default = poster + play button.** Nothing streams until tap (data-friendly, editorial). Uses the free Mux poster (`image.mux.com/{playbackId}/thumbnail.jpg`).
2. **On tap = inline playback with a branded control bar**, plus a fullscreen expand.
3. **Personality = "quiet glass"** — translucent glass controls, orange held back to *only* the scrubber. Fully restrained.
4. **Sound on when tapped** (deliberate playback; no muted autoplay).
5. **Scope = events/reels now; profile viewer migrated later.**

## 3. Component

```tsx
<NetsaVideoPlayer
  playbackId={string}          // Mux playback id (from event media entry)
  poster?={string}             // defaults to image.mux.com/{playbackId}/thumbnail.jpg?time=1
  aspectRatio?={number}        // default 16/9; reels pass 9/16
  autoFullscreenOnTap?={boolean} // default false (inline); reels may pass true later
  style?={ViewStyle}
/>
```
One component, built on `expo-video` (`useVideoPlayer` + `<VideoView nativeControls={false} />` + a custom overlay). Replaces `EventVideo` at its two call sites: `components/events/detail/EventHeroGallery.tsx` and `components/events/manage/PosterHero.tsx`. The composer (`Step6Media`) is unaffected — its grid keeps showing Mux poster *thumbnails*, not a live player.

## 4. States (all honest — never fake a number or progress)

| State | UI |
|---|---|
| **idle** | Mux poster fills the frame · centered glass play button (see radial-scrim fix) · optional duration pill top-right |
| **buffering** | quiet centered spinner (`ActivityIndicator`, `#FF6B35`) — no fake progress bar |
| **playing** | video · controls visible, then auto-hide after ~3s · tap anywhere toggles controls |
| **paused** | video frozen · controls visible (don't auto-hide while paused) |
| **ended** | dim the last frame · centered glass **replay** button (`RotateCcw`) |
| **errored** | centered honest message "Couldn't play" + **retry** (`RefreshCw`), text `#71717a` — reuses the composer's `processing`/`errored` vocabulary |

State is derived from `expo-video` player status/events (status → idle/buffering/ready/error; playing flag; time updates; a did-just-finish signal). Exact event/property names confirmed against the installed `expo-video` (~3.0.16) during implementation.

## 5. Controls + layout (exact brand tokens)

**Media frame:** `borderRadius: 14`, `borderWidth: 1`, `borderColor: rgba(255,255,255,0.10)`, `overflow: 'hidden'`, `backgroundColor: '#0E0C12'`.

**Glass play/replay button (center):** `54×54`, `borderRadius: 27`, `backgroundColor: rgba(0,0,0,0.38)`, `borderWidth: 1`, `borderColor: rgba(255,255,255,0.14)`; lucide `Play` (idle) / `RotateCcw` (ended) at ~23px, color `#F3EFE8`, `Play` nudged `marginLeft: 3`.
- **Radial-scrim fix (solves quiet-glass's low-contrast-on-bright-frames risk):** behind the button, a soft `~150px` radial wash `rgba(0,0,0,0.28) → transparent`. Invisible on dark frames, just enough lift on bright ones. (Implement as a centered `expo-linear-gradient` radial or a low-opacity blurred circle — no hard edge.)

**Bottom control bar** (visible/​auto-hidden together), over a bottom scrim `LinearGradient(['transparent','rgba(6,5,9,0.9)'])` covering ~45% height, `padding: 11px 13px 13px`:
- **Scrubber** (the *only* orange): track `height: 4`, `borderRadius: 99`, `backgroundColor: rgba(255,255,255,0.15)`; fill `LinearGradient(['#FF8A5B','#FF6B35'])` to `currentTime/duration`; thumb `11×11` white circle. Draggable to seek.
- **Row** (below scrubber, `gap: 13`, color `#F3EFE8`): `Pause`/`Play` (19px) · mono timecode `SpaceMono` 11px, current `#F3EFE8` + ` / total` in `#71717a` · spacer · mute (`Volume2`/`VolumeX`, 19px) · fullscreen (`Maximize`, 18px).

**Duration pill (idle, shown for event clips, top-right, 12px inset):** `rgba(0,0,0,0.55)` bg, `borderRadius: 7`, `borderWidth: 1`, `borderColor: rgba(255,255,255,0.12)`, mono 11px `#F3EFE8`. A `REEL`/category eyebrow (top-left, orange-hairline pill) is **contextual** — passed in by reels later, omitted for event clips in Phase 1.

Icons: `lucide-react-native` (`Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RefreshCw`), 1.5–2px stroke, matching existing event components.

## 6. Behavior

- **Tap zones:** tap the video area → toggle controls (when playing) / play (from idle). Center button is the primary affordance in idle/paused/ended.
- **Auto-hide:** while `playing`, controls fade out after ~3s of no interaction; any tap reveals them and resets the timer. While `paused`/`idle`/`ended`, controls stay.
- **Seek:** drag the scrubber → `player.currentTime = pct * duration` (pause-scrub-resume as expo-video allows).
- **Mute:** toggles `player.muted`; icon reflects state. Default unmuted on tap-to-play.
- **Fullscreen:** `Maximize` → expo-video's native fullscreen (`VideoView` fullscreen API). Returns inline on exit.
- **Lifecycle:** pause + release on unmount; pause when navigated away (screen blur) to avoid background audio.

## 7. Motion

- Controls + poster crossfades: **200ms** fade (matches the app's `expo-image` `transition={200}`).
- Poster → first frame: 200ms crossfade when playback starts.
- **Reduced-motion aware:** when the OS reduce-motion flag is set, fades become instant (mirror `EventCapacityBar`'s `rm` pattern).

## 8. Technical approach

- `useVideoPlayer(`https://stream.mux.com/${playbackId}.m3u8`, setup)` with `player.muted = true` only until first play, then unmute on tap. Source built via a shared `muxHls(playbackId)` helper (reused from `config/mux` conceptually; frontend has its own string).
- `<VideoView player={player} nativeControls={false} contentFit="cover" allowsFullscreen />` filled; custom overlay absolutely positioned above it.
- Drive UI from expo-video events (status, playing, time). Keep all control logic in `NetsaVideoPlayer`; expose nothing but the props above.
- **Files:**
  - Create `netsa-frontend/src/components/media/NetsaVideoPlayer.tsx` (the player).
  - Possibly extract small pieces if the file grows: `NetsaVideoScrubber.tsx` (seek bar), `useAutoHideControls.ts` (timer hook). Split only if `NetsaVideoPlayer` exceeds a comfortable size.
  - Replace `EventVideo` usage in `EventHeroGallery.tsx` + `PosterHero.tsx`; delete `EventVideo.tsx` (or keep as a thin re-export during migration).

## 9. Testing

Frontend gate is **jest** (`tsc` crashes in this repo). `expo-video` is native → mock it in tests.
- Control-logic tests (with a mocked player): idle→play toggles `player.play()`; pause toggles; mute toggles `player.muted`; scrubber sets `currentTime`; auto-hide timer hides controls after the interval and reveals on tap; ended shows replay; error shows retry.
- State-mapping test: expo-video status → our UI state enum.
- Native playback, fullscreen, and real HLS are **manual** (device QA), same as the Mux D1 run.

## 10. Accessibility

- Every control is a `Pressable` with `accessibilityRole="button"` + `accessibilityLabel` ("Play", "Pause", "Mute", "Unmute", "Fullscreen", "Replay", "Retry").
- Scrubber exposes `accessibilityRole="adjustable"` with value.
- Honors reduce-motion (§7). Tap targets ≥ 44px effective (hitSlop on smaller icons).

## 11. Out of scope (fast-follows)

- **Captions (CC):** Mux auto-generates captions for free; a CC toggle is a cheap later add that serves NETSA's low-literacy accessibility goal. Deferred to keep Phase 1 lean.
- **Picture-in-picture.**
- **Converging the profile `MediaViewerModal`** (`react-native-video`) onto `NetsaVideoPlayer` — separate pass; one video stack app-wide is the eventual goal.
- **Reels-specific chrome** (portrait, swipe-between-reels, sound-forward) — arrives with Phase-2 artist reels; `NetsaVideoPlayer` is designed to accept it (aspectRatio, contextual eyebrow, autoFullscreenOnTap) without a rewrite.

## 12. Resolved (were open questions)

1. **Duration pill on idle: shown** for event clips (small, honest, orients the viewer). §5 reflects this.
2. **Fullscreen: expo-video native** for Phase 1 (fastest, consistent). A custom in-app fullscreen modal is a later brand-polish option if native feels off. §6 reflects this.
