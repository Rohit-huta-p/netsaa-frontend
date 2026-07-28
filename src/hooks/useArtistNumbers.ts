/**
 * useArtistNumbers — aggregation hook for the artist-home "By the Numbers"
 * Diptych (DOCS/04-design/mockups/by-the-numbers-redesign.html, V2).
 *
 * RETURN SHAPE
 * ------------
 * `data: ArtistNumbers`, always populated (defaults to 0 / [] per field until
 * its source query resolves — never undefined), plus `isLoading`.
 *
 * FIELD SOURCES
 * -------------
 *   earnedThisMonth, pendingPayouts, sparkline  ← useArtistEarnings
 *     (aggregateEarnings over the transactions feed)
 *   profileViews, profileViewsDelta              ← useProfileViews
 *     (lifetime total / views in the last 7 days)
 *
 * Applications / Delivered / Rating were removed from the section in the
 * Diptych redesign, so their source hooks are no longer composed here.
 */

import { useMemo } from 'react';
import useArtistEarnings from './useArtistEarnings';
import useProfileViews from './useProfileViews';

export interface ArtistNumbers {
  earnedThisMonth: number;
  profileViews: number;
  profileViewsDelta: number;
  pendingPayouts: number;
  sparkline: number[];
}

export function useArtistNumbers(): { data: ArtistNumbers; isLoading: boolean } {
  const earningsQ = useArtistEarnings();
  const viewsQ = useProfileViews();

  const data = useMemo<ArtistNumbers>(() => {
    const earnings = earningsQ.data ?? { earnedThisMonth: 0, pendingPayouts: 0, sparkline: [] };
    const views = viewsQ.data ?? { total: 0, last7: 0 };

    return {
      earnedThisMonth: earnings.earnedThisMonth,
      profileViews: views.total,
      profileViewsDelta: views.last7,
      pendingPayouts: earnings.pendingPayouts,
      sparkline: earnings.sparkline,
    };
  }, [earningsQ.data, viewsQ.data]);

  return { data, isLoading: earningsQ.isLoading || viewsQ.isLoading };
}

export default useArtistNumbers;
