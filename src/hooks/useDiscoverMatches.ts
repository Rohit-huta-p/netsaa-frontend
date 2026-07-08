/**
 * useDiscoverMatches — broader feed of gigs + events that fit the artist's
 * type and skill set (DOCS/04-design/mockups/artist-home-v1.html §6 Discover, pivot
 * 2026-05-18 from "Hirers who fit you" to gig/event matches).
 *
 * Different lens from useArtistMatches (the "For you" horizontal carousel):
 *
 *   - useArtistMatches    → top 4 best matches, horizontal carousel, glance
 *   - useDiscoverMatches  → wider list (5-8), vertical stack, deeper browse
 *
 * Both ultimately feed off the same matcher service when it ships
 * (gigs-service /matches + events-service topic-filtered list).
 *
 * v1: stubbed feed shaped by artist type + skills pulled from useHeroData.
 * Output is a mix of gigs and events so the UI can render type-tag pills.
 */
import { useMemo } from 'react';
import useHeroData from './useHeroData';

export type DiscoverItemKind = 'gig' | 'event' | 'workshop' | 'audition';

export interface DiscoverMatchItem {
    id: string;
    kind: DiscoverItemKind;
    title: string;
    /** Short context line: "city · date · solo" / "online · Aug 5". */
    meta: string;
    /** Rupees, or null/0 for free items. */
    payRupees: number | null;
    /** Why this surfaces — e.g. "Matches your Kathak skill", "Near Pune". */
    reason: string;
    /** Avatar theme; gradient fill on the row thumb. */
    theme: 'orange' | 'purple' | 'green' | 'pink';
    href: string;
}

export function useDiscoverMatches(): {
    items: DiscoverMatchItem[];
    isLoading: boolean;
} {
    const heroQ = useHeroData();

    const items = useMemo<DiscoverMatchItem[]>(() => {
        const user: any = heroQ.data ?? {};
        const skills: string[] = Array.isArray(user?.skills) ? user.skills : [];
        const primarySkill = skills[0] ?? 'Kathak';
        const city = user?.city ?? 'Pune';

        // TODO(matcher-v1): replace stub with /gigs/matches + /events/recommended
        // ranked by (artistType, skills, city, availability).
        return [
            {
                id: 'd-gig-1',
                kind: 'gig',
                title: `${primarySkill} solo — wedding showcase`,
                meta: `${city} · 12 Jun · solo`,
                payRupees: 18000,
                reason: `Matches your ${primarySkill} skill`,
                theme: 'orange',
                href: '/gigs',
            },
            {
                id: 'd-event-1',
                kind: 'workshop',
                title: `${primarySkill} rhythm intensives`,
                meta: 'Online · 5 Jun · 2hrs',
                payRupees: 0,
                reason: `For ${primarySkill} dancers`,
                theme: 'purple',
                href: '/events',
            },
            {
                id: 'd-gig-2',
                kind: 'gig',
                title: 'Choreographer · classical fusion short film',
                meta: 'Mumbai · 15-17 Jun · 3 days',
                payRupees: 42000,
                reason: 'Matches your choreography experience',
                theme: 'pink',
                href: '/gigs',
            },
            {
                id: 'd-event-2',
                kind: 'audition',
                title: 'Marathi musical · classical lead',
                meta: `${city} · 28 May`,
                payRupees: 500,
                reason: `Near ${city}`,
                theme: 'green',
                href: '/events',
            },
            {
                id: 'd-gig-3',
                kind: 'gig',
                title: 'Weekly Kathak class · children\'s troupe',
                meta: `${city} · weekly · ongoing`,
                payRupees: 4000,
                reason: 'Recurring — fits a weekly schedule',
                theme: 'purple',
                href: '/gigs',
            },
        ];
    }, [heroQ.data]);

    return { items, isLoading: heroQ.isLoading };
}

export default useDiscoverMatches;
