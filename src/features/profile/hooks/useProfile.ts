import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import authService from '@/services/authService';

import type { ProfileData, ProfileStats } from '@/components/profile/types';
import {
    mapUserToProfileData,
    mapUserToStats,
    checkIsOrganizer,
} from '../utils/mapUserToProfileData';
import { User } from '@/types/index';

type UseProfileReturn = {
    profile: User | null;
    profileData: ProfileData;
    stats: ProfileStats;
    isOrganizer: boolean;
    isOwner: boolean;
    isLoading: boolean;
    isError: boolean;
    error: string;
    refetch: () => void;
};

export const useProfile = (
    userId: string | undefined,
    isOwner: boolean
): UseProfileReturn => {
    const { user: authUser } = useAuthStore();
    const [profile, setProfile] = useState<User | null>(isOwner ? authUser : null);
    const [isLoading, setIsLoading] = useState(!isOwner);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState('');

    console.log('[useProfile] userId:', userId, '| isOwner:', isOwner);

    const fetchProfile = useCallback(async () => {
        if (!userId) return;

        if (isOwner) {
            console.log('[useProfile] Owner profile — using authStore cache');
            setProfile(authUser);
            setIsLoading(false);
            return;
        }

        // If visiting your own profile via /profile/:id
        if (userId === authUser?._id) {
            console.log('[useProfile] Visiting own profile via ID route — using authStore cache');
            setProfile(authUser);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setIsError(false);
            setError('');
            console.log('[useProfile] Fetching profile for:', userId);
            const fetchedUser = await authService.getUserById(
                Array.isArray(userId) ? userId[0] : userId
            );
            setProfile(fetchedUser);
        } catch (err) {
            console.error('[useProfile] Failed to fetch profile:', err);
            setIsError(true);
            setError('Failed to load profile');
        } finally {
            setIsLoading(false);
        }
    }, [userId, isOwner, authUser]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // Keep owner profile in sync with authStore
    useEffect(() => {
        if (isOwner && authUser) {
            setProfile(authUser);
        }
    }, [isOwner, authUser]);

    const isOrganizer = checkIsOrganizer(profile);
    const profileData = mapUserToProfileData(profile, isOrganizer);
    const stats = mapUserToStats(profile);

    return {
        profile,
        profileData,
        stats,
        isOrganizer,
        isOwner,
        isLoading,
        isError,
        error,
        refetch: fetchProfile,
    };
};
