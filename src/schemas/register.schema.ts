// src/schemas/register.schema.ts
// Per-step types and validation for multi-step registration

/* ── Role card colors (used by RoleCard component) ── */
export interface RoleCardColors {
    bg: string;
    border: string;
    iconBg: string;
}

/* ── Enums ── */
export type Role = 'artist' | 'organizer';
export type Intent = 'find_gigs' | 'hire_artists' | 'learn_workshops' | 'host_events';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'professional';

export type OrganizerTypeCategory =
    | 'individual'
    | 'academy'
    | 'registered_business'
    | 'agency'
    | 'venue'
    | 'brand'
    | 'corporate';

/* ── Organizer sub-types ── */
export interface PrimaryContact {
    fullName: string;
    designation?: string;
    phone: string;
    email: string;
}

export interface BillingDetails {
    legalBusinessName?: string;
    gstNumber?: string;
    billingAddress?: string;
    state?: string;
    pincode?: string;
    country?: string;
}

export interface OrganizerProfile {
    organizerTypeCategory: OrganizerTypeCategory;
    organizationName: string;
    organizationType?: string[];
    bio?: string;
    organizationWebsite?: string;
    logoUrl?: string;
    primaryContact: PrimaryContact;
    billingDetails?: BillingDetails;
    intent?: Intent[];
}

/* ── Final API payload (matches backend register.dto.ts) ── */
export interface RegisterPayload {
    user: {
        displayName: string;
        email: string;
        password: string;
        phoneNumber?: string;
        role: Role;
    };
    organizerProfile?: OrganizerProfile;
}
