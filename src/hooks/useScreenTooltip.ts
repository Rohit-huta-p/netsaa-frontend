// netsa-mobile/src/hooks/useScreenTooltip.ts
import { useCallback } from 'react';
import { useModeStore } from '../stores/modeStore';

/**
 * Returns per-screen tooltip state. Screen IDs are arbitrary stable strings
 * (e.g., 'home-toggle', 'gigs-filters'). Tooltip shows once per screen, ever.
 * (spec §11)
 */
export function useScreenTooltip(screenId: string) {
  const hasSeenScreen = useModeStore((s) => s.hasSeenScreen);
  const markScreenSeen = useModeStore((s) => s.markScreenSeen);

  const shouldShow = !hasSeenScreen(screenId);

  const dismiss = useCallback(() => {
    markScreenSeen(screenId);
  }, [screenId, markScreenSeen]);

  return { shouldShow, dismiss };
}
