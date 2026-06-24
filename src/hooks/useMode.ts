// netsa-mobile/src/hooks/useMode.ts
import { useCallback } from 'react';
import { AccessibilityInfo } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useModeStore } from '../stores/modeStore';
import { syncModeToServer } from '../services/modeService';
import { UserMode } from '../lib/modeInference';

/**
 * Convenience hook around useModeStore. Wraps setMode with:
 *  - haptic feedback
 *  - screen-reader announcement (spec §13.1)
 *  - non-blocking server sync
 */
export function useMode() {
  const mode = useModeStore((s) => s.mode);
  const setModeInStore = useModeStore((s) => s.setMode);

  const switchMode = useCallback(
    async (next: UserMode) => {
      if (next === mode) return; // no-op if already in target mode

      // 1. Update local state immediately (UI re-renders within this frame)
      setModeInStore(next);

      // 2. Haptic (best-effort, don't crash if unavailable)
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}

      // 3. Screen reader announcement
      AccessibilityInfo.announceForAccessibility(
        next === 'hirer'
          ? 'Switched to Hirer mode. Home now shows your posts and team.'
          : 'Switched to Artist mode. Home now shows your upcoming gigs and applications.'
      );

      // 4. Non-blocking server sync (fire and forget)
      void syncModeToServer(next);
    },
    [mode, setModeInStore]
  );

  return { mode, switchMode, isArtist: mode === 'artist', isHirer: mode === 'hirer' };
}
