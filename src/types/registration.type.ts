// src/types/index.ts

export type User = {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    roles?: string[];
    // add other fields your API returns
};

export type AuthResponse = {
    accessToken: string;
    refreshToken?: string | null;
    user?: User;
    expiresAt?: number | null; // epoch ms
};

/**
 * Payload used during artist registration (partial shape for step-by-step forms).
 * Extend with any fields your registration flow requires.
 */
export type ArtistRegistrationPayload = {
    stageName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    bio?: string;
    genres?: string[]; // e.g. ['hip-hop','contemporary']
    skills?: string[]; // e.g. ['popping','choreography']
    portfolioLinks?: string[]; // website / instagram / youtube
    location?: {
        city?: string;
        country?: string;
    };
    // any other onboarding fields (sample: profilePicture, availability, rates)
    profilePictureUrl?: string | null;
    availability?: string[]; // free-text or structured availability blocks
    hourlyRate?: number | null;
};

/**
 * Payload used during organizer / recruiter registration.
 * Extend to match your backend.
 */
export type OrganizerRegistrationPayload = {
    companyName?: string;
    contactFirstName?: string;
    contactLastName?: string;
    email?: string;
    phone?: string;
    website?: string | null;
    address?: {
        line1?: string;
        city?: string;
        postalCode?: string;
        country?: string;
    };
    organizationType?: 'agency' | 'venue' | 'promoter' | 'producer' | string;
    bio?: string;
    logoUrl?: string | null;
    // other fields as needed
};
