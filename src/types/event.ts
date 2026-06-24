export type EventType = 'workshop' | 'competition' | 'meetup' | 'showcase' | 'battle';
export type EventSkillLevel = 'all' | 'beginner' | 'intermediate' | 'advanced';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type LocationType = 'physical' | 'online' | 'hybrid';

export interface EventSchedule {
    startDate: string; // ISO Date string
    endDate: string;   // ISO Date string
    totalDurationMinutes: number;
    dayBreakdown: {
        date: string;
        durationMinutes: number;
        notes?: string;
    }[];
}

export interface EventLocation {
    type: LocationType;
    venueName?: string;
    address?: string;
    city: string;
    state: string;
    country: string;
    meetingLink?: string;
}

export interface EventConfig {
    materialsProvided?: boolean;
    preparationRequired?: boolean;
    preparationNotes?: string;
    competitionFormat?: string;
    judgingCriteria?: string[];
    prizes?: { position: string; reward: string }[];
}

export interface IEvent {
    _id: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    coverImage?: string;
    image?: string; // Legacy support
    isOnline?: boolean;
    duration?: number;

    eventType: EventType;
    category: string;
    tags: string[];

    organizerId: string;
    organizerName?: string;
    organizer: {
        name: string;
        organizationName: string;
        profileImageUrl?: string;
        rating?: number;
    };

    hostId?: string;
    hostSnapshot?: {
        name: string;
        bio: string;
        profileImageUrl?: string;
        rating?: number;
    };

    skillLevel: EventSkillLevel;
    eligibleArtistTypes: string[];
    pricingMode: 'fixed' | 'ticketed';
    ticketPrice: number;

    schedule: EventSchedule;
    location: EventLocation;
    registered: number;
    registrationDeadline?: string;
    maxParticipants: number;
    allowWaitlist: boolean;

    eventConfig?: EventConfig;

    status: EventStatus;
    isFeatured: boolean;
    date?: string;
    time?: string;
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateEventDTO extends Omit<IEvent, '_id' | 'organizerId' | 'organizer' | 'hostId' | 'hostSnapshot' | 'status' | 'createdAt' | 'updatedAt' | 'publishedAt'> {
    // These might be handled by backend or optional during creation
    organizerId?: string;
    organizer?: {
        name: string;
        organizationName: string;
        profileImageUrl?: string;
        rating?: number;
    };
    ticketTypes?: IEventTicketType[];
}

export interface IEventRegistration {
    _id: string;
    eventId: string;
    userId: {
        _id: string;
        displayName: string;
        email: string;
        phoneNumber?: string;
        profileImageUrl?: string;
    } | string;
    ticketTypeId?: {
        _id: string;
        name: string;
        price: number;
    } | string;
    status: 'registered' | 'approved' | 'rejected' | 'checked-in' | 'cancelled';
    paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded';
    createdAt: string;
    updatedAt: string;
}

export interface IEventTicketType {
    _id?: string; // Optional for new ones
    eventId?: string;
    name: string;
    basePrice: number;              // Final/base price
    currentPrice?: number;          // Computed active price
    currency: 'INR';
    salesStartAt: string;
    salesEndAt: string;
    isRefundable: boolean;
    refundPolicyNotes?: string;

    // Tiered pricing configuration
    pricingTiers?: PricingTier[];

    // Computed at runtime
    activeTier?: ActiveTier;
    nextTier?: ActiveTier;
    tierEvaluation?: ActiveTier[];
}

export interface PricingTier {
    name: string;
    price: number;
    conditionType: 'capacity' | 'date';
    maxRegistrations?: number;
    salesStartAt?: string;
    validUntil?: string;
    priority: number;
}

export interface ActiveTier {
    name: string;
    price: number;
    expiresAt?: string;
    remainingSlots?: number;
    isBasePrice?: boolean;
}
