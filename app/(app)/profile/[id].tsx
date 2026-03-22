import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { ProfileScreen } from '@/features/profile/ProfileScreen';

export default function UserProfile() {
    const { user } = useAuthStore();
    const { id, gigId, applicationId, fromGig } = useLocalSearchParams<{
        id: string;
        gigId?: string;
        applicationId?: string;
        fromGig?: string;
    }>();

    const resolvedId = Array.isArray(id) ? id[0] : id;
    const isOwner = resolvedId === user?._id;

    console.log('[ProfileRoute /profile/:id] id:', resolvedId, '| isOwner:', isOwner);

    return (
        <ProfileScreen
            userId={resolvedId || ''}
            isOwner={isOwner}
            gigContext={{ gigId, applicationId, fromGig }}
        />
    );
}
