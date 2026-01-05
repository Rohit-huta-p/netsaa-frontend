export type EventType = 'workshop' | 'competition' | 'meetup' | 'showcase';
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

    eventType: EventType;
    category: string;
    tags: string[];

    organizerId: string;
    organizerName?: string;
    organizerSnapshot: {
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

export interface CreateEventDTO extends Omit<IEvent, '_id' | 'organizerId' | 'organizerSnapshot' | 'hostId' | 'hostSnapshot' | 'status' | 'createdAt' | 'updatedAt' | 'publishedAt'> {
    // These might be handled by backend or optional during creation
    organizerId?: string;
    organizerSnapshot?: {
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
    price: number;
    currency: 'INR';
    capacity: number;
    salesStartAt: string;
    salesEndAt: string;
    isRefundable: boolean;
    refundPolicyNotes?: string;
}
