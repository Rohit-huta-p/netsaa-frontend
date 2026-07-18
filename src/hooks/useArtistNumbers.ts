/**
 * useArtistNumbers — aggregation hook for the artist-home "By the Numbers" grid.
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
 *   applicationsTotal, applicationsActive       ← useApplications
 *     (computeApplications over the gig-applications feed)
 *   delivered                                    ← useDeliveredCount
 *     (countDeliveredContracts over the contracts feed)
 *   rating, reviewCount                          ← useHeroData
 *     (user.cached.averageRating / totalReviews)
 *   profileViews, profileViewsDelta              ← useProfileViews
 *     (lifetime total / views in the last 7 days)
 *
 * ISLOADING
 * ---------
 * Tracks ONLY the primary fetches (useApplications + useHeroData) — those
 * back the KPIs considered essential to the first paint. useDeliveredCount
 * and useArtistEarnings are secondary: while they're still in flight their
 * fields simply hold their zero/empty defaults and the consuming tiles
 * render "—" individually, rather than blocking the whole grid's loading
 * state on every sub-fetch.
 */

import { useMemo } from 'react';
import useApplications from './useApplications';
import useHeroData from './useHeroData';
import useDeliveredCount from './useDeliveredCount';
import useArtistEarnings from './useArtistEarnings';
import useProfileViews from './useProfileViews';
import { computeApplications } from './artistNumbers.helpers';

export interface ArtistNumbers {
  earnedThisMonth: number;
  profileViews: number;
  profileViewsDelta: number;
  applicationsTotal: number;
  applicationsActive: number;
  delivered: number;
  rating: number;
  reviewCount: number;
  pendingPayouts: number;
  sparkline: number[];
}

export function useArtistNumbers(): { data: ArtistNumbers; isLoading: boolean } {
  const appsQ = useApplications();
  const heroQ = useHeroData();
  const deliveredQ = useDeliveredCount();
  const earningsQ = useArtistEarnings();
  const viewsQ = useProfileViews();

  const data = useMemo<ArtistNumbers>(() => {
    const { applicationsTotal, applicationsActive } = computeApplications(appsQ.data);
    const user: any = heroQ.data ?? {};
    const earnings = earningsQ.data ?? { earnedThisMonth: 0, pendingPayouts: 0, sparkline: [] };
    const views = viewsQ.data ?? { total: 0, last7: 0 };

    return {
      earnedThisMonth: earnings.earnedThisMonth,
      profileViews: views.total,
      profileViewsDelta: views.last7,
      applicationsTotal,
      applicationsActive,
      delivered: deliveredQ.data ?? 0,
      rating: user?.cached?.averageRating ?? 0,
      reviewCount: user?.cached?.totalReviews ?? 0,
      pendingPayouts: earnings.pendingPayouts,
      sparkline: earnings.sparkline,
    };
  }, [appsQ.data, heroQ.data, deliveredQ.data, earningsQ.data, viewsQ.data]);

  // isLoading tracks the primary fetches; secondary tiles degrade to "—" individually.
  return { data, isLoading: appsQ.isLoading || heroQ.isLoading };
}

export default useArtistNumbers;
