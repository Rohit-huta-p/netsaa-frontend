// src/constants/registration.ts
//
// PRD v4 — Two-Context Model — Single-flow registration constants.
//
// ONE step sequence for everyone. No artist-vs-organizer fork.
// Intent (Step 5) is a soft signal, not a role lock.

import {
    Sparkles, Target, UserPlus, Music2, Mic2, Radio, Drama,
    Disc3, Palette, HandMetal, Building2, Users, GraduationCap,
    MapPin, Flame,
} from 'lucide-react-native';
import type {
    Intent, ExperienceLevel, HirerClientType,
} from '@/schemas/register.schema';

/* ═════════════════════════════════════════════════════════════
 *  STEP 5 — "What brings you to NETSA?" (the emotional center)
 *
 *  PRD §8.1.1 Step 4: multi-select intent, replaces role selection.
 *  Three options (UX sweet spot). Copy is first-person and goal-oriented
 *  — never role-descriptive, never permanent.
 * ═════════════════════════════════════════════════════════════ */

export const INTENT_OPTIONS: {
    id: Intent | 'both';
    title: string;
    sub: string;
    icon: React.ElementType;
    /** Maps the card choice to the persisted Intent[] sent to the backend */
    toIntents: Intent[];
}[] = [
    {
        id: 'find_gigs',
        title: 'I want to find gigs and perform',
        sub: 'Build a profile, get discovered, get booked.',
        icon: Sparkles,
        toIntents: ['find_gigs'],
    },
    {
        id: 'hire_artists',
        title: 'I want to hire artists for my events',
        sub: 'Post a gig once or build a regular talent pool.',
        icon: UserPlus,
        toIntents: ['hire_artists'],
    },
    {
        id: 'both',
        title: 'I want to do both',
        sub: 'Perform, and also hire artists for your own projects.',
        icon: Target,
        toIntents: ['find_gigs', 'hire_artists'],
    },
];

/* ═════════════════════════════════════════════════════════════
 *  ARTIST TYPE OPTIONS — Step 6 (skippable)
 *  Max 3 selections; icons follow lucide set.
 * ═════════════════════════════════════════════════════════════ */

export const ARTIST_TYPES: { id: string; label: string; icon: React.ElementType }[] = [
    { id: 'dancer', label: 'Dancer', icon: HandMetal },
    { id: 'singer', label: 'Singer', icon: Mic2 },
    { id: 'musician', label: 'Musician', icon: Music2 },
    { id: 'dj', label: 'DJ', icon: Disc3 },
    { id: 'actor', label: 'Actor', icon: Drama },
    { id: 'anchor', label: 'Anchor / MC', icon: Radio },
    { id: 'folk', label: 'Folk Artist', icon: Flame },
    { id: 'visual', label: 'Visual Artist', icon: Palette },
    { id: 'other', label: 'Other', icon: Sparkles },
];

/* ═════════════════════════════════════════════════════════════
 *  EXPERIENCE LEVELS — Step 6 (skippable)
 * ═════════════════════════════════════════════════════════════ */

export const EXP_LEVELS: { id: ExperienceLevel; label: string; sub: string }[] = [
    { id: 'beginner', label: 'Beginner', sub: 'Just starting out' },
    { id: 'intermediate', label: 'Intermediate', sub: 'Some experience' },
    { id: 'professional', label: 'Professional', sub: 'Industry veteran' },
];

/* ═════════════════════════════════════════════════════════════
 *  HIRER CLIENT TYPES — Step 7 (shown only if hire intent)
 *
 *  Deliberately lightweight. No GST, no legal business name,
 *  no billing address — those get collected on first gig post
 *  (PRD §8.1.1 Step 6).
 * ═════════════════════════════════════════════════════════════ */

export const HIRER_CLIENT_TYPES: { id: HirerClientType; label: string; sub: string; icon: React.ElementType }[] = [
    { id: 'individual', label: 'Individual', sub: 'Family, friends, personal event', icon: Sparkles },
    { id: 'corporate', label: 'Corporate', sub: 'Internal event or team offsite', icon: Building2 },
    { id: 'agency', label: 'Agency', sub: 'Event / talent agency', icon: Users },
    { id: 'college', label: 'College / Institution', sub: 'Cultural fests, workshops', icon: GraduationCap },
    { id: 'venue', label: 'Venue', sub: 'Hotel, club, restaurant, hall', icon: MapPin },
    { id: 'brand', label: 'Brand', sub: 'Campaign or branded event', icon: Flame },
];

/* ═════════════════════════════════════════════════════════════
 *  STEP SEQUENCE — single flow for every user
 *
 *  Blocking steps (required):   entry, identity, credentials
 *  Soft steps (skip allowed):   intent, artistProfile, hirerProfile*, social
 *                               * shown only if 'hire_artists' selected
 *
 *  Step 'intent' is what we collect the interest signal on.
 *  No role fork. The sequence is the same for everyone.
 *
 *  NOTE: OTP verification happens in the separate /login flow which deep-links
 *  into /register with phone already confirmed. We do not re-verify here.
 * ═════════════════════════════════════════════════════════════ */

export const STEPS = [
    'entry',         // Step 1: email + phone (both)
    'identity',      // Step 2: fullName, displayName
    'dob',           // Step 3: date of birth (age-gate per Indian Contract Act §11)
    'credentials',   // Step 4: password (Google OAuth deferred)
    'intent',        // Step 5: "What brings you to NETSA?" (emotional center)
    'artistProfile', // Step 6: artist type + experience + city (skippable)
    'hirerProfile',  // Step 7: client type + city (conditional on hire intent)
    'social',        // Step 8: optional social handles
] as const;

export type StepId = (typeof STEPS)[number] | 'completion';

/**
 * Steps that are SOFT — user can tap "Skip" and still end with a working account.
 * The wizard renders "Skip for now" as visually equal to "Continue" on these.
 */
export const SOFT_STEPS: ReadonlySet<StepId> = new Set<StepId>([
    'artistProfile',
    'hirerProfile',
    'social',
]);

/**
 * Blocking steps — required for a usable account.
 * Drives the progress indicator.
 */
export const BLOCKING_STEPS: ReadonlySet<StepId> = new Set<StepId>([
    'entry',
    'identity',
    'dob',
    'credentials',
]);

/**
 * Age thresholds driving the dob step UI + backend age-gate.
 * Under 13: blocked (DPDP Act, COPPA-ish). 13-17: allowed but flagged minor
 * and needs guardian co-sign on contracts (Indian Contract Act §11).
 */
export const MIN_REGISTRATION_AGE = 13;
export const MAJORITY_AGE = 18;

/* ═════════════════════════════════════════════════════════════
 *  Legacy re-exports
 *
 *  A few older components still import ARTIST_STEPS / ORGANIZER_STEPS.
 *  Keep aliases so we don't break them in this diff — but they now both
 *  point to the single canonical STEPS sequence.
 * ═════════════════════════════════════════════════════════════ */

/** @deprecated Use STEPS. Kept for backward compat. */
export const ARTIST_STEPS = STEPS;

/** @deprecated Use STEPS. Kept for backward compat. */
export const ORGANIZER_STEPS = STEPS;

/** @deprecated Use HIRER_CLIENT_TYPES. */
export const ORG_TYPE_CATEGORIES = HIRER_CLIENT_TYPES;
