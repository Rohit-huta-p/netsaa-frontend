import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { ProfileScreen } from '@/features/profile/ProfileScreen';

export default function ProfilePage() {
    const { user } = useAuthStore();
    const userId = (user as any)?._id || (user as any)?.id || '';

    console.log('[ProfileRoute /profile] userId:', userId);

    return <ProfileScreen userId={userId} isOwner={true} />;
}