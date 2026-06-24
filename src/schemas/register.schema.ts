// src/schemas/register.schema.ts
//
// PRD v4 — Two-Context Model
//
// No role selection at signup. Every user is both an Artist and a Hirer.
// "Intent" is a soft signal (what brings you to NETSA?) that drives initial
// feed personalization, NOT a role gate.

/* ── Legacy type — kept for RoleCard component backward compat ──
 * The RoleCard component is no longer used in the registration flow
 * (replaced by IntentStep + Hirer cards), but still exported from the
 * component barrel. We keep this type so it compiles; callers should
 * migrate to the new cards defined inline in register.tsx.
 */
export interface RoleCardColors {
    bg: string;
    border: string;
    iconBg: string;
}

/* ── Enums ── */

/**
 * Soft intent signal captured at Step 5 of registration.
 * Multi-select allowed. Empty array = default (artist-primary feed).
 */
export type Intent = 'find_gigs' | 'hire_artists';

/**
 * Optional artist-profile experience level collected in Step 6 (skippable).
 */
export type ExperienceLevel = 'beginner' | 'intermediate' | 'professional';

/**
 * Hirer persona (used only if user signals hire intent).
 * Richer business details are deferred to the first gig post.
 */
export type HirerClientType =
    | 'individual'
    | 'corporate'
    | 'agency'
    | 'college'
    | 'venue'
    | 'brand';

/* ── Optional profile subobjects ──
 * Both are optional at signup — users can skip through to a working account
 * and fill these in later from the profile screen.
 */

export interface ArtistProfileInput {
    artistTypes?: string[];       // Dancer, Singer, DJ, ... (max 3)
    experience?: ExperienceLevel;
    primaryCity?: string;
}

export interface HirerProfileInput {
    clientType?: HirerClientType;
    primaryCity?: string;
}

/**
 * Optional social handles captured on the final step.
 */
export interface SocialLinksInput {
    instagram?: string;
    youtube?: string;
    spotify?: string;
    soundcloud?: string;
}

/* ── API payload ──
 *
 * Matches `netsa-backend/users-service/src/validators/register.dto.ts`.
 * Backend auto-creates both Artist + HirerProfile rows for every user.
 *
 * `artistProfile` and `hirerProfile` here are CLIENT-SIDE staging only —
 * they're patched into the user document post-registration via /users/me.
 */
export interface RegisterPayload {
    user: {
        displayName: string;
        email: string;
        password: string;
        phoneNumber?: string;
        /** ISO 8601 date string. Drives age-gate; optional at signup. */
        dateOfBirth?: string;
        /** Three-role marketplace model — chosen via the signup cards. */
        role?: 'client' | 'creative_lead' | 'artist';
        intent?: Intent[];
        marketingConsent?: boolean;
    };
    artistProfile?: ArtistProfileInput;
    hirerProfile?: HirerProfileInput;
    socials?: SocialLinksInput;
}

/* ── Legacy type alias ──
 * Several older components still import `Role`. Map it to a string alias
 * derived from intent so we don't have to touch every callsite in one diff.
 * Prefer `hasArtistContext()` / `hasHirerContext()` from the auth store.
 */
export type Role = 'artist' | 'organizer';

/**
 * @deprecated — left for backward compatibility with ProfileScreen etc.
 * New code should reference `Intent` or `useAuthStore.hasHirerContext()`.
 */
export type OrganizerTypeCategory = HirerClientType;
