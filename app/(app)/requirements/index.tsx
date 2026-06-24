// app/(app)/requirements/index.tsx
// CL "Apply" feed — lists open client requirements for Creative Leads to browse.
// Gated server-side (403 for non-CL), but the entry card in artist-home also
// hides it from pure Artists so they never see a dead door.
//
// The feed body lives in <RequirementsFeedList /> so the agency-supplier
// "Find work" face on the client home can reuse the exact same list (Part C).

import { Stack } from 'expo-router';
import RequirementsFeedList from '@/components/requirements/RequirementsFeedList';

export default function RequirementsFeed() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <RequirementsFeedList />
        </>
    );
}
