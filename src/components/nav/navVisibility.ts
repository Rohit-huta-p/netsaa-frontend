// src/components/nav/navVisibility.ts
//
// Scroll-direction auto-hide for the single global BottomNav.
//
// There is exactly ONE bottom nav (mounted in app/(app)/_layout.tsx), so its
// visibility is modelled as ONE module-level shared value — no context, no
// prop-drilling. Any scroll surface writes to it from a UI-thread worklet; the
// nav reads it in useAnimatedStyle. React never re-renders on scroll.
//
// Behaviour (the "most apps" pattern):
//   • scrolling toward the content bottom  → hide  (nav slides down + fades)
//   • scrolling back up                    → show
//   • within TOP_LOCK px of the top        → always shown
//
// Producers: spread {...useBottomNavScroll()} onto a Reanimated Animated.*
// scroll component (Animated.ScrollView / Animated.FlatList). The two shared
// wrappers (AppScrollView / AppFlatList) already do this, so most screens get
// it for free; raw-list screens opt in with the same one-liner.
//
// Consumer: BottomNav spreads useBottomNavVisibilityStyle() onto its container.
import {
  Easing,
  makeMutable,
  ReduceMotion,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
} from 'react-native-reanimated';

// 1 = fully shown, 0 = hidden. Single global nav → single global signal.
export const navShown = makeMutable(1);
// Last vertical offset seen by any scroller, tracked on the UI thread so the
// direction delta survives across handler invocations without a React render.
const lastScrollY = makeMutable(0);

// How far down to slide the nav when hiding. Must fully clear the bar (~64 +
// bottom padding) AND the Post FAB overhanging above it, plus its shadow. There
// is no opacity fade to mask a leftover sliver (see below), so err generous.
const HIDE_DISTANCE = 160;

// Tuning. DIR_DELTA swallows sub-pixel jitter and momentum wobble; TOP_LOCK
// keeps the nav pinned near the top (so a tiny scroll never hides it); the nav
// only starts hiding once the user is past HIDE_AFTER into the content.
const DIR_DELTA = 6;
const TOP_LOCK = 24;
const HIDE_AFTER = 90;

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1); // strong ease-out for UI

// scrollEventThrottle to pair with the handler (16ms ≈ one frame on the JS
// side; the handler itself runs on the UI thread regardless).
export const NAV_SCROLL_EVENT_THROTTLE = 16;

/**
 * Producer hook — returns a Reanimated scroll handler. Spread the result onto
 * a VERTICAL Animated.ScrollView / Animated.FlatList together with
 * `scrollEventThrottle={NAV_SCROLL_EVENT_THROTTLE}`. Do NOT attach it to
 * horizontal rails (filter chips, carousels) — only the page's main scroller.
 */
export function useBottomNavScroll() {
  return useAnimatedScrollHandler({
    onScroll: (e) => {
      'worklet';
      const y = e.contentOffset.y;
      const dy = y - lastScrollY.get();

      if (y <= TOP_LOCK) {
        navShown.set(1); // pinned near the top
      } else if (dy > DIR_DELTA && y > HIDE_AFTER) {
        navShown.set(0); // moving toward content bottom → hide
      } else if (dy < -DIR_DELTA) {
        navShown.set(1); // moving back up → show
      }

      lastScrollY.set(y);
    },
  });
}

/**
 * Consumer hook — animated style for the nav container. We animate ONLY
 * translateY (slide the nav off the bottom edge), never opacity.
 *
 * Why no opacity: the nav's bar is an expo-blur BlurView. Alpha-compositing a
 * BlurView (any opacity < 1 on it or an ancestor) forces iOS to rasterize the
 * live blur to a weaker static tint, and it does NOT fully restore when opacity
 * returns to 1 — so the glass came back looking flatter after each hide/show.
 * A transform never touches the blur's compositing, so the glass stays byte-for-
 * byte identical to the initial render. Timing with ease-out (no finger is on
 * the nav; it's derived from scroll). Reduce Motion pins it visible.
 */
export function useBottomNavVisibilityStyle() {
  const reduced = useReducedMotion();
  return useAnimatedStyle(() => {
    if (reduced) {
      return { transform: [{ translateY: 0 }] };
    }
    const shown = navShown.get() === 1;
    return {
      transform: [
        {
          translateY: withTiming(shown ? 0 : HIDE_DISTANCE, {
            duration: 240,
            easing: EASE_OUT,
            reduceMotion: ReduceMotion.System,
          }),
        },
      ],
    };
  }, [reduced]);
}

/**
 * Reset the nav to visible. Call on route change so every new screen starts
 * with the nav shown, regardless of where the previous screen left it. Safe to
 * call from the RN runtime (an effect) — the write is marshalled to the UI thread.
 */
export function resetBottomNavVisibility() {
  navShown.set(1);
  lastScrollY.set(0);
}
