/**
 * useArtistNumbers — aggregate KPI feed for the artist-home
 * By-the-numbers section (DOCS/designs/artist-home-v1.html).
 *
 * Returns the five metrics shown in the KPI grid plus a 7-point sparkline
 * for the earnings tile. Where real data already exists, it's pulled from
 * existing hooks via the React Query cache. The rest are stubbed at 0 with
 * a clear comment + follow-up note so the assembly compiles today and
 * lights up the moment backend ships.
 *
 * Real wires:
 *   - applications    → useApplications (length of array)
 *   - delivered       → useApplications filtered by status === 'completed'
 *                       OR fall back to backend `cached.totalGigsDelivered` on
 *                       the user profile (whichever the artist hook surfaces)
 *
 * Stubbed (returns 0 + TODO):
 *   - earnedThisMonth — needs payouts endpoint (Plan 8 follow-up)
 *   - profileViews    — needs analytics service (V2)
 *   - endorsements    — needs endorsements aggregator (V2)
 *   - sparkline       — depends on earnedThisMonth time-series
 *
 * The metrics object is always defined; isLoading reflects the underlying
 * application count fetch (the only one that may genuinely be in flight).
 */
import { useMemo } from 'react';
import useApplications from './useApplications';
import useHeroData from './useHeroData';

export interface ArtistNumbers {
    /** ₹ earned this calendar month. Stub: 0 until payouts endpoint ships. */
    earnedThisMonth: number;
    /** Profile page views (last 30d). Stub: 0 until analytics ships. */
    profileViews: number;
    /** Weekly delta on profileViews. Stub: 0. */
    profileViewsDelta: number;
    /** Active + historical application count. Real: useApplications length. */
    applicationsTotal: number;
    /** Active applications (in-flight statuses). Real: derived from useApplications. */
    applicationsActive: number;
    /** Lifetime delivered/completed gigs. Real: profile.cached.totalGigsDelivered fallback. */
    delivered: number;
    /** Endorsement count. Stub: 0. */
    endorsements: number;
    /** Endorsements gained in the last 30d. Stub: 0. */
    endorsementsDelta: number;
    /** Pending payout count. Stub: 0. */
    pendingPayouts: number;
    /**
     * 7-point sparkline (0..1 normalized) for the earnings tile.
     * Empty array when no earnings data yet → component falls back to a
     * "—" placeholder.
     */
    sparkline: number[];
}

const ACTIVE_STATUSES = new Set([
    'applied',
    'shortlisted',
    'reviewed',
    'hired',
    'pending',
]);

export function useArtistNumbers(): { data: ArtistNumbers; isLoading: boolean } {
    const appsQ = useApplications();
    const heroQ = useHeroData();

    const data = useMemo<ArtistNumbers>(() => {
        const apps = Array.isArray(appsQ.data) ? appsQ.data : [];
        const applicationsTotal = apps.length;
        const applicationsActive = apps.filter((a: any) =>
            ACTIVE_STATUSES.has(String(a?.status ?? '').toLowerCase()),
        ).length;

        const user: any = heroQ.data ?? {};
        const deliveredFromProfile =
            user?.cached?.totalGigsDelivered ??
            user?.cached?.gigsDelivered ??
            0;
        const deliveredFromApps = apps.filter(
            (a: any) => String(a?.status ?? '').toLowerCase() === 'completed',
        ).length;
        const delivered = Math.max(deliveredFromProfile, deliveredFromApps);

        // TODO(plan-8-followup): hydrate earnedThisMonth + sparkline from /payouts.
        // TODO(v2-analytics):     hydrate profileViews + profileViewsDelta.
        // TODO(v2-endorsements):  hydrate endorsements + endorsementsDelta.
        return {
            earnedThisMonth: 0,
            profileViews: 0,
            profileViewsDelta: 0,
            applicationsTotal,
            applicationsActive,
            delivered,
            endorsements: user?.cached?.endorsementCount ?? 0,
            endorsementsDelta: 0,
            pendingPayouts: 0,
            sparkline: [],
        };
    }, [appsQ.data, heroQ.data]);

    return {
        data,
        isLoading: appsQ.isLoading || heroQ.isLoading,
    };
}

export default useArtistNumbers;
