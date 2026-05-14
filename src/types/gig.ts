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
        /**
         * Plan 5 — gig detail redesign. Count of non-draft gigs this
         * organizer has hosted (excludes the current gig). Refreshed by
         * the backend on every getGigById read so it never goes stale.
         */
        gigsHosted?: number;
        /**
         * Plan 5 — average minutes between an applicant's first message
         * and the organizer's first reply. Optional — undefined when the
         * organizer has no message history yet.
         */
        avgReplyMinutes?: number;
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
    heightRequirements?: {
        male?: { min?: string | number; max?: string | number };
        female?: { min?: string | number; max?: string | number };
    };

    location: {
        city: string;
        state?: string;
        country?: string;
        venueName?: string;
        address?: string;
        isRemote?: boolean;
        /**
         * Plan 5 — geocoded venue coordinates, populated server-side by a
         * Mongoose pre-save hook. Used to compute distance from the artist
         * for the "1.4 km" line on the gig detail page. Optional because
         * geocoding can fail (offline / unparseable address) and we render
         * a city-only fallback in that case.
         */
        geo?: {
            lat: number;
            lng: number;
        };
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
        // 'per-track' + 'per-shoot' added in Plan 5 Wave 6 to match Plan 4
        // backend Zod schema (widened from fixed/hourly/per-day only).
        model: 'fixed' | 'hourly' | 'per-day' | 'per-track' | 'per-shoot';
        amount?: number;
        minAmount?: number;
        maxAmount?: number;
        currency: string;
        negotiable?: boolean;
        perks?: string[];
    };

    applicationDeadline: string | Date;
    maxApplications?: number;

    /**
     * Plan 5 — short list of gig-specific responsibilities the hirer
     * writes when posting. Rendered as the "What you'll do" bullet
     * list on the artist-side detail page. Optional — UI auto-hides
     * when empty.
     */
    responsibilities?: string[];

    mediaRequirements?: {
        headshots?: boolean;
        fullBody?: boolean;
        videoReel?: boolean;
        audioSample?: boolean;
        notes?: string;
    };

    // ── Plan 4 backend sub-documents (added Plan 5 Wave 6) ──
    // Conditional blocks the new GigFormV2 writes based on the artistTypes
    // selected on Page 1. Each block maps to its Page 3 block value. All
    // fields are optional since any single gig exercises only one or two
    // of these groups.
    eventFunction?: string;
    languagePreferences?: string[];
    musicDetails?: {
        genres?: string[];
        equipmentProvided?: boolean;
        // Backend accepts number; the form block currently stores strings
        // for text-input ergonomics, so allow both until we normalize.
        bpm?: number | string;
        musicalKey?: string;
        deliverableFormats?: string[];
        referenceTracks?: string[];
        turnaroundDays?: number | string;
        revisionsIncluded?: number | string;
        setLengthHours?: number | string;
        bandSize?: number | string;
        attirePreference?: 'formal' | 'casual' | 'themed' | 'open';
    };
    modelDetails?: {
        shootType?: 'Editorial' | 'Commercial' | 'Fashion' | 'Fitness' | 'Lifestyle' | 'Art';
        nudityLevel?: 'None' | 'Implied' | 'Partial' | 'Artistic' | 'Nude';
        wardrobeNotes?: string;
        usageRights?: string[];
        releaseRequired?: boolean;
        measurements?: {
            height?: string;
            bust?: string;
            waist?: string;
            hips?: string;
            hair?: string;
            eyes?: string;
        };
    };
    visualDetails?: {
        roleType?: 'lead' | 'supporting' | 'extra' | 'background';
        bodyType?: ('slim' | 'athletic' | 'average' | 'plus' | 'any')[];
    };
    crewDetails?: {
        deliverables?: string;
        styleReferences?: string[];
        equipmentProvided?: boolean;
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
