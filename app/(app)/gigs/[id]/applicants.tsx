// app/(app)/gigs/[id]/applicants.tsx
//
// "See all" — the full paginated applicant list for a gig, pushed from the
// owner hub's capped stage preview. Reads ?stage to land on the stage the
// owner tapped "See all" from. The (app) Stack is headerless, so the screen
// renders its own back affordance.
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { GigApplicantsAllScreen } from '@/features/hirer-hub/GigApplicantsAllScreen';
import type { HubStage } from '@/features/hirer-hub/hooks/useGigHubData';

const STAGES: string[] = ['applied', 'shortlisted', 'hired'];

export default function GigApplicantsRoute() {
    const params = useLocalSearchParams<{ id?: string | string[]; stage?: string | string[]; q?: string | string[] }>();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const rawStage = Array.isArray(params.stage) ? params.stage[0] : params.stage;
    const stage = (STAGES.includes(rawStage ?? '') ? rawStage : 'applied') as HubStage;
    // ?q carries an active hub search into See-all's name filter, so tapping
    // "See all" from a search lands on the same results.
    const rawQ = Array.isArray(params.q) ? params.q[0] : params.q;
    if (!id) return null;
    return <GigApplicantsAllScreen gigId={id} initialStage={stage} initialName={rawQ ?? ''} />;
}
