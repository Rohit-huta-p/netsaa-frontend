import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { SpotlightProfile } from '@/features/profile/SpotlightProfile';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

export default function ProfilePage() {
    const { user } = useAuthStore();
    const userId = (user as any)?._id || (user as any)?.id || '';
    const role = (user as any)?.role;
    const { spotlightProfile } = useFeatureFlags();
    const { highlight } = useLocalSearchParams<{ highlight?: string }>();

    // Spotlight (flagged) replaces the legacy ProfileScreen for the artist self-view.
    if (spotlightProfile && role === 'artist') {
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
