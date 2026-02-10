// src/components/profile/types.ts

export type ExperienceEntry = {
    title: string;
    role?: string;
    venue?: string;
    date?: string;
};

export type ProfileData = {
    fullName: string;
    location: string;
    age: string;
    gender: string;
    height: string;
    skinTone: string;
    artistType: string;
    skills: string[];
    bio: string;
    instagramHandle: string;
    experience: ExperienceEntry[];
    hasPhotos: boolean;
    profileImageUrl?: string;
    galleryUrls?: string[];
    videoUrls?: string[];
};

export type ProfileStats = {
    connections: number;
    events?: number;
    rating?: number;
};

export interface ProfileHeaderProps {
    fullName: string;
    artistType: string;
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
}

export interface ProfileSidebarProps {
    profileData: ProfileData;
    isDesktop: boolean;
    isEditable?: boolean;
    onEditPress?: (step: number) => void;
}

export interface FeaturedWorksProps {
    galleryUrls: string[];
    videoUrls: string[];
    hasPhotos: boolean;
    isEditable?: boolean;
    isDesktop: boolean;
    onEditPress?: () => void;
}

export interface ProfessionalHistoryProps {
    experience: ExperienceEntry[];
    isEditable?: boolean;
    onEditPress?: () => void;
}

export interface TestimonialsProps {
    testimonial?: {
        text: string;
        author: string;
        role: string;
    };
}
