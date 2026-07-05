// src/components/profile/types.ts

export type ExperienceEntry = {
    title?: string;
    role?: string;
    projectName?: string;
    organization?: string;
    venue?: string;
    location?: string;
    description?: string;
    date?: string;
    mediaLink?: string;
};

export type AvailabilityStatus = 'available' | 'busy' | 'tentative';

export interface ProfileVideoReel {
    muxPlaybackId: string;
    status: 'processing' | 'ready' | 'errored';
    uploadId?: string;
    thumbnailUrl?: string;
    duration?: number;
    aspectRatio?: string;
}

export type ProfileData = {
    fullName: string;
    headline?: string;
    location: string;
    age: string;
    gender: string;
    height: string;
    skinTone: string;
    skinToneHex: string;
    artistType: string;
    skills: string[];
    bio: string;
    instagramHandle: string;
    youtubeUrl?: string;
    spotifyUrl?: string;
    soundcloudUrl?: string;
    experience: ExperienceEntry[];
    hasPhotos: boolean;
    profileImageUrl?: string;
    galleryUrls?: string[];
    videoUrls?: string[];
    videoReels?: ProfileVideoReel[];
    testimonials?: {
        text: string;
        author: string;
        role: string;
    }[];
    // Organizer-specific fields
    organizationName?: string;
    organizationWebsite?: string;
    organizerTypeCategory?: string;
    primaryContactName?: string;
    primaryContactPhone?: string;
    primaryContactEmail?: string;
    isCustomCategory?: boolean;
    customCategoryLabel?: string;
    availability?: AvailabilityStatus;
};

export type ProfileStats = {
    connections: number;
    events?: number;
    rating?: number;
};

export interface ProfileHeaderProps {
    animatedStyle?: any;
    isOwner: boolean;
    fullName?: string;
    headline?: string;
    artistType?: string;
    location?: string;
    profileImageUrl?: string;
    stats: ProfileStats;
    isDesktop: boolean;
    isEditable?: boolean;
    onEditPress?: () => void;
    onSharePress?: () => void;
    connectionStatus?: 'none' | 'pending' | 'connected' | 'following';
    isConnectionLoading?: boolean;
    onConnectPress?: () => void;
    // Organizer-specific
    isOrganizer?: boolean;
    organizationName?: string;
    organizationWebsite?: string;
}

export interface ProfileSidebarProps {
    profileData: ProfileData;
    isDesktop: boolean;
    isEditable?: boolean;
    isOrganizer?: boolean;
    onEditPress?: (step: number) => void;
}

export interface FeaturedWorksProps {
    galleryUrls: string[];
    videoReels: ProfileVideoReel[];
    hasPhotos: boolean;
    isEditable?: boolean;
    isDesktop: boolean;
    isOrganizer?: boolean;
    onEditPress?: () => void;
}

export interface ProfessionalHistoryProps {
    experience: ExperienceEntry[];
    isEditable?: boolean;
    isOrganizer?: boolean;
    onEditPress?: () => void;
}

export interface TestimonialsProps {
    testimonials?: {
        text: string;
        author: string;
        role: string;
    }[];
}
