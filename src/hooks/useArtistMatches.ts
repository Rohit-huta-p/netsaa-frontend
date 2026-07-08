/**
 * useArtistMatches — feed of personalized matches for the artist home
 * "For you" rail (DOCS/04-design/mockups/artist-home-v1.html §5).
 *
 * v1: stubbed feed. Returns a small mix of gig + event matches with
 * placeholder match-percentages. Lights up real data when the matcher
 * service ships:
 *
 *   - Gigs:   gigs-service /matches?userId=… (skills + city + availability)
 *   - Events: events-service /events?topicTag=… (topic + city + skill overlap)
 *
 * The returned shape keeps a single discriminated union so the UI can
 * render gigs and events through one card component. `matchPct` only
 * applies to gigs — events use a category-tag instead (WORKSHOP /
 * AUDITION / etc).
 */
import { useMemo } from 'react';
import useHeroData from './useHeroData';

export type MatchKind = 'gig' | 'workshop' | 'audition' | 'event';

export interface ArtistMatchItem {
    id: string;
    kind: MatchKind;
    title: string;
    meta: string;
    /** Rupees, or null/0 for free. */
    payRupees: number | null;
    /** 0-100 match percentage. Only for kind='gig'. */
    matchPct?: number;
    href: string;
}

export function useArtistMatches(): { items: ArtistMatchItem[]; isLoading: boolean } {
    const heroQ = useHeroData();
    const city = (heroQ.data as any)?.city ?? 'your city';

    const items = useMemo<ArtistMatchItem[]>(
        () => [
            // TODO(matcher-v1): replace with real feed from gigs-service /matches.
            // Stub mirrors the locked mockup so the layout is testable today.
            {
                id: 'stub-gig-1',
                kind: 'gig',
                title: 'Lead Kathak — wedding sangeet',
                meta: `${city} · 12 Jun · solo`,
                payRupees: 18000,
                matchPct: 92,
                href: '/gigs',
            },
            {
                id: 'stub-event-1',
                kind: 'workshop',
                title: 'Kathak rhythm intensives',
                meta: 'Online · 5 Jun · 2hrs',
                payRupees: 0,
                href: '/events',
            },
            {
                id: 'stub-gig-2',
                kind: 'gig',
                title: 'Choreographer — short film',
                meta: 'Mumbai · 15-17 Jun',
                payRupees: 42000,
                matchPct: 88,
                href: '/gigs',
            },
            {
                id: 'stub-event-2',
                kind: 'audition',
                title: 'Marathi musical · classical lead',
                meta: `${city} · 28 May`,
                payRupees: 500,
                href: '/events',
            },
        ],
        [city],
    );

    return { items, isLoading: heroQ.isLoading };
}

export default useArtistMatches;
