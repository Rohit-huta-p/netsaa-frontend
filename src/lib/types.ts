export interface Event {
    id: string;
    _id?: string;
    title: string;
    description: string;
    category: string;
    skillLevel?: string;
    hostInfo?: {
        name: string;
        profileImageUrl?: string;
        rating: number;
    };
    organizerId?: string;
    schedule?: {
        startDate: string;
        endDate: string;
    };
    location?: {
        venue?: string;
        address?: string;
        city: string;
        country: string;
    };
    pricing?: {
        amount: number;
        currency?: string;
    };
    tags?: string[];
    currentRegistrations?: number;
    maxParticipants?: number;
    maxRegistrations?: number;
    status?: 'scheduled' | 'cancelled' | 'completed';
    createdAt?: string;
    updatedAt?: string;
}

export interface GetGigsQuery {
    search?: string;
    category?: string;
    location?: string;
}
