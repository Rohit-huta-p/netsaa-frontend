// app/(app)/gigs/[id]/team.tsx
//
// TEAM-PAGE-DROPPED (Apr 30): the dedicated team page was folded back
// into HirerGigHub as a section. This route now redirects to the gig
// hub. TeamPage component preserved at src/features/team/TeamPage.tsx
// for revert (and reuse when sub-gig ships needs a lead-artist view).
import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function GigTeamScreen() {
    const params = useLocalSearchParams<{ id?: string | string[] }>();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    return <Redirect href={id ? `/(app)/gigs/${id}` as any : '/(app)/dashboard'} />;
}
