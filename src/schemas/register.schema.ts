// src/schemas/register.schema.ts
// Per-step types and validation for multi-step registration

/* ── Enums ── */
export type Role = 'artist' | 'organizer';
export type Intent = 'find_gigs' | 'hire_artists' | 'learn_workshops' | 'host_events';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'professional';

/* ── Final API payload ── */
export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
    location: string;
    userType: Role;
    intent?: Intent[]; // Multi-select
    experienceLevel?: ExperienceLevel;
    instagramHandle?: string;
    artistType?: string[]; // Multi-select
    organizationType?: string[]; // Multi-select
}
