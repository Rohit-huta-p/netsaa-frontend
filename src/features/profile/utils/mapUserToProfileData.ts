
import type { ProfileData, ProfileStats } from '@/components/profile/types';
import { User } from '@/types/index';

export const mapUserToProfileData = (
    user: User | null,
    isOrganizer: boolean
): ProfileData => {
    if (!user) {
        return {
            fullName: '',
            location: '',
            age: '',
            gender: '',
            height: '',
            skinTone: '',
            skinToneHex: '',
            artistType: '',
            skills: [],
            bio: '',
            instagramHandle: '',
            experience: [],
            hasPhotos: false,
        };
    }

    return {
        fullName: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || '',
        headline: (user as any)?.headline || '',
        location: user.location || '',
        age: user.age || '',
        gender: user.gender || '',
        height: user.height || '',
        skinTone: user.skinTone || '',
        skinToneHex: user.skinToneHex || '',
        artistType: user.artistType || (isOrganizer ? user.organizerTypeCategory || '' : '') || user.roles?.[0] || '',
        skills: user.skills || [],
        bio: user.bio || '',
        instagramHandle: user.instagramHandle || '',
        youtubeUrl: (user as any)?.youtubeUrl || '',
        spotifyUrl: (user as any)?.spotifyUrl || '',
        soundcloudUrl: (user as any)?.soundcloudUrl || '',
        experience: user.experience || [],
        hasPhotos: user.hasPhotos || false,
        profileImageUrl: user.profileImageUrl,
        galleryUrls: (user as any)?.galleryUrls || [],
        videoUrls: (user as any)?.videoUrls || [],
        videoReels: (user as any)?.videoReels || [],
        testimonials: (user as any)?.testimonials || [],

        // Map from organizerDetails if available
        organizationName: (user as any)?.organizerDetails?.organizationName || user.organizationName || '',
        organizationWebsite: (user as any)?.organizerDetails?.organizationWebsite || user.organizationWebsite || '',
        organizerTypeCategory: (user as any)?.organizerDetails?.organizerTypeCategory || user.organizerTypeCategory || '',

        // Leaving these in for compatibility, though we purged primaryContact earlier
        primaryContactName: user.primaryContactName || '',
        primaryContactPhone: user.primaryContactPhone || '',
        primaryContactEmail: user.primaryContactEmail || '',
    };
};

export const mapUserToStats = (user: User | null): ProfileStats => ({
    connections: user?.connections || 0,
    events: user?.events || 0,
    rating: user?.rating || 0,
});

export const checkIsOrganizer = (user: User | null): boolean =>
    user?.roles?.includes('organizer') || user?.role === 'organizer' || false;
