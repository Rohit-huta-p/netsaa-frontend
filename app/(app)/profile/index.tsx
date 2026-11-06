import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { SpotlightProfile } from '@/features/profile/SpotlightProfile';
import { CreativeLeadProfile } from '@/features/profile/CreativeLeadProfile';

export default function ProfilePage() {
    const { user } = useAuthStore();
    const userId = (user as any)?._id || (user as any)?.id || '';
    const role = (user as any)?.role;
    const { highlight } = useLocalSearchParams<{ highlight?: string }>();

    // Creative Lead / organizer self-view → the company/org profile page (owner view).
    // Mirrors the dispatcher in profile/[id].tsx so /profile and /profile/:id
    // agree for a Creative Lead viewing their own page.
    if (role === 'creative_lead' || role === 'organizer') {
        return <CreativeLeadProfile userId={userId} isOwner />;
    }

    // Artist self-view → the redesigned Spotlight profile. ProfileScreen stays
    // the fallback for other roles (e.g. a client viewing their own profile).
    if (role === 'artist') {
        return <SpotlightProfile userId={userId} isOwner highlightMissing={highlight === 'true'} />;
    }

    return (
        <ProfileScreen
            userId={userId}
            isOwner={true}
            highlightMissing={highlight === 'true'}
        />
    );
}
