// src/components/dashboard/artist/home/useArtistInvolvement.ts
//
// "What you're in" data for the artist home — the six buckets behind the
// Gigs (Applied / Hired / Saved) and Events (Registered / Saved / Past) tabs.
// Extracted from YourStageArtist so the simplified home and anything else can
// share one source of truth over useUpcoming / useApplications / useSavedItems.

import { useMemo } from 'react';
import useUpcoming, { UpcomingItem } from '@/hooks/useUpcoming';
import useApplications from '@/hooks/useApplications';
import { useSavedItems } from '@/hooks/useSavedItems';

// Applications still "in flight" — everything before a terminal hired/closed.
const ACTIVE_APP_STATUSES = new Set(['applied', 'shortlisted', 'reviewed', 'offered', 'pending']);

function safeArr(x: any): any[] {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  if (Array.isArray(x.data)) return x.data;
  if (Array.isArray(x.items)) return x.items;
  return [];
}

export interface ArtistInvolvement {
  applied: any[]; // active applications
  hired: UpcomingItem[]; // confirmed/booked gigs
  savedGigs: any[];
  registered: UpcomingItem[]; // events the artist RSVP'd to
  savedEvents: any[];
  past: any[]; // attended events (history)
  isLoading: boolean;
}

export function useArtistInvolvement(): ArtistInvolvement {
  const upcomingQ = useUpcoming();
  const appsQ = useApplications();
  const savedQ = useSavedItems();

  return useMemo(() => {
    const upcomingArr = safeArr((upcomingQ as any)?.data);
    const hired = upcomingArr.filter((u: any) => u?.type === 'gig') as UpcomingItem[];
    const registered = upcomingArr.filter((u: any) => u?.type === 'event') as UpcomingItem[];

    const apps = safeArr((appsQ as any)?.data);
    const applied = apps.filter((a: any) => ACTIVE_APP_STATUSES.has(String(a?.status ?? '').toLowerCase()));

    // useSavedItems returns combined `savedItems` (gigs + events, each tagged
    // with `type`) plus `historyItems` (past registrations).
    const saved = savedQ as any;
    const allSaved = safeArr(saved?.savedItems);
    const savedGigs = allSaved.filter((it: any) => it?.type === 'GIG');
    const savedEvents = allSaved.filter((it: any) => it?.type === 'EVENT');
    const past = safeArr(saved?.historyItems);

    const isLoading = !!(
      (upcomingQ as any)?.isLoading ||
      (appsQ as any)?.isLoading ||
      (savedQ as any)?.isLoading
    );

    return { applied, hired, savedGigs, registered, savedEvents, past, isLoading };
  }, [upcomingQ, appsQ, savedQ]);
}

export default useArtistInvolvement;
