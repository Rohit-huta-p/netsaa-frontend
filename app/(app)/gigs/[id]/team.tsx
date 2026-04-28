// app/(app)/gigs/[id]/team.tsx
//
// Thin route shell that mounts the shared TeamPage component for the
// hirer-side view. The `mode` prop is reserved for the lead-artist
// view that ships with the sub-gig system later.
import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { TeamPage } from '@/features/team/TeamPage';

export default function GigTeamScreen() {
    const params = useLocalSearchParams<{ id?: string | string[] }>();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!id) return null;
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <TeamPage gigId={id} mode="hirer" />
        </>
    );
}
