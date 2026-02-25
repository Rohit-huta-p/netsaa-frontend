// src/types/registration.type.ts
// Types for authentication and registration flows

export type User = {
    id: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    roles?: string[];
    phoneNumber?: string;
    location?: string;
    instagramHandle?: string;
    youtubeUrl?: string;
    spotifyUrl?: string;
    soundcloudUrl?: string;
};

export type AuthResponse = {
    accessToken: string;
    refreshToken?: string | null;
    user?: User;
    expiresAt?: number | null;
};
