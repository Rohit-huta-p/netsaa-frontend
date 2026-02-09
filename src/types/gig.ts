export interface Gig {
    _id: string;
    title: string;
    description: string;
    type: 'one-time' | 'recurring' | 'contract';
    category: string;
    tags?: string[];

    organizerId: string;
    organizerSnapshot?: {
        displayName: string;
        organizationName: string;
        profileImageUrl: string;
        rating: number;
    };

    artistTypes: string[];
    requiredSkills?: string[];
    experienceLevel: 'beginner' | 'intermediate' | 'professional';

    ageRange?: {
        min?: number;
        max?: number;
    };

    genderPreference?: 'any' | 'male' | 'female' | 'other';
    physicalRequirements?: string;

    location: {
        city: string;
        state?: string;
        country?: string;
        venueName?: string;
        address?: string;
        isRemote?: boolean;
    };

    schedule: {
        startDate: string | Date; // Frontend might receive string from JSON
        endDate: string | Date;
        durationLabel?: string;
        timeCommitment?: string;
        practiceDays?: {
            count: number;
            isPaid: boolean;
            mayExtend: boolean;
            notes?: string;
        };
    };

    compensation: {
        model: 'fixed' | 'hourly' | 'per-day';
        amount?: number;
        minAmount?: number;
        maxAmount?: number;
        currency: string;
        negotiable?: boolean;
        perks?: string[];
    };

    applicationDeadline: string | Date;
    maxApplications?: number;

    mediaRequirements?: {
        headshots?: boolean;
        fullBody?: boolean;
        videoReel?: boolean;
        audioSample?: boolean;
        notes?: string;
    };

    status: 'draft' | 'published' | 'paused' | 'closed' | 'expired';
    isUrgent?: boolean;
    isFeatured?: boolean;

    stats?: {
        views: number;
        applications: number;
        saves: number;
    };

    createdAt: string;
    updatedAt: string;
    viewerContext?: {
        hasApplied: boolean;
    };
    termsAndConditions?: string;
}

export interface GigResponse {
    meta: {
        status: number;
        message: string;
    };
    data: Gig | Gig[] | any;
    errors?: any[];
}

export interface GigsListResponse {
    meta: {
        status: number;
        message: string;
    };
    data: {
        gigs: Gig[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            pages: number;
        }
    };
}
