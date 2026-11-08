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
        title: "I'm an Artist",
        sub: 'Find gigs from Creative Leads — build a profile, get booked.',
        icon: Sparkles,
        toIntents: ['find_gigs'],
    },
    {
        id: 'hire_artists',
        title: "I'm a Client",
        sub: 'Post work and get proposals from trusted Creative Leads.',
        icon: UserPlus,
        toIntents: ['hire_artists'],
    },
    {
        id: 'both',
        title: "I'm a Creative Lead",
        sub: 'Win client work, and hire artists to deliver it.',
        icon: Target,
        toIntents: ['find_gigs', 'hire_artists'],
    },
];

/* Three-role marketplace model: each signup card maps to a stored role.
 * Client posts -> Creative Leads apply; Creative Lead posts -> Artists apply. */
export const INTENT_TO_ROLE = {
    find_gigs: 'artist',
    hire_artists: 'client',
    both: 'creative_lead',
} as const;

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
 *  ARTIST REGISTRATION — 5-step linear wizard (v1, 2026-11)
 *
 *  All steps are blocking (required). Step 5 (media) becomes
 *  skippable only after the minimum photo count is met.
 *
 *  credentials → identity → dob → artistProfile → media
 * ═════════════════════════════════════════════════════════════ */

export const STEPS = [
    'credentials',   // Step 1: email + password
    'identity',      // Step 2: fullName + stageName
    'dob',           // Step 3: date of birth (age-gate per Indian Contract Act §11)
    'artistProfile', // Step 4: artist type + skills + bio (required)
    'media',         // Step 5: profile photo + min 2 photos + optional videos
] as const;

export type StepId = (typeof STEPS)[number] | 'completion';

/** All steps are blocking in the new 5-step artist flow. */
export const SOFT_STEPS: ReadonlySet<StepId> = new Set<StepId>([]);

export const BLOCKING_STEPS: ReadonlySet<StepId> = new Set<StepId>([
    'credentials',
    'identity',
    'dob',
    'artistProfile',
    'media',
]);

/* ═════════════════════════════════════════════════════════════
 *  SKILLS — contextual options per artist type
 * ═════════════════════════════════════════════════════════════ */

export const ARTIST_SKILLS: Record<string, string[]> = {
    dancer:   ['Hip-hop', 'Contemporary', 'Bollywood', 'Classical', 'Folk', 'Western', 'Jazz', 'Ballet'],
    singer:   ['Hindustani Classical', 'Carnatic', 'Bollywood', 'Pop / Indie', 'Ghazal', 'Folk', 'Sufi'],
    musician: ['Guitar', 'Tabla', 'Violin', 'Piano', 'Flute', 'Sitar', 'Mridangam', 'Drums'],
    dj:       ['Bollywood', 'EDM', 'Hip-hop', 'House', 'Techno', 'Commercial', 'Punjabi'],
    actor:    ['Theatre', 'Film', 'TV / Web Series', 'Voiceover', 'Mime', 'Stand-up Comedy'],
    anchor:   ['Corporate Events', 'Weddings', 'Award Shows', 'News', 'Radio'],
    folk:     ['Lavani', 'Bhangra', 'Garba', 'Dandiya', 'Chhau', 'Kuchipudi', 'Mohiniyattam'],
    visual:   ['Photography', 'Illustration', 'Calligraphy', 'Digital Art', 'Mural', 'Installation'],
};

export const ARTIST_SKILL_DEFAULTS: Record<string, string[]> = {
    dancer:   ['Hip-hop', 'Contemporary'],
    singer:   ['Bollywood', 'Folk'],
    musician: ['Guitar'],
    dj:       ['Bollywood', 'EDM'],
    actor:    ['Theatre', 'Film'],
    anchor:   ['Corporate Events', 'Weddings'],
    folk:     ['Bhangra'],
    visual:   ['Photography'],
};

export const ARTIST_SKILL_HINTS: Record<string, string> = {
    dancer: 'Dancer skills',
    singer: 'Singer skills',
    musician: 'Instruments & styles',
    dj: 'DJ styles',
    actor: 'Acting specialisms',
    anchor: 'Hosting types',
    folk: 'Folk forms',
    visual: 'Visual mediums',
};

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
