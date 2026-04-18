import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { ProfileScreen } from '@/features/profile/ProfileScreen';

export default function ProfilePage() {
    const { user } = useAuthStore();
    const userId = (user as any)?._id || (user as any)?.id || '';
    const { highlight } = useLocalSearchParams<{ highlight?: string }>();

    return (
        <ProfileScreen
            userId={userId}
            isOwner={true}
            highlightMissing={highlight === 'true'}
        />
    );
}
