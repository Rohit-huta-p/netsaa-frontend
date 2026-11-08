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
    dancer: [
        // Indian Classical
        'Bharatanatyam', 'Kathak', 'Odissi', 'Kuchipudi', 'Manipuri',
        'Mohiniyattam', 'Kathakali', 'Sattriya', 'Chhau',
        // Folk
        'Bhangra', 'Lavani', 'Garba', 'Dandiya', 'Ghoomar', 'Bihu', 'Koli', 'Kolattam',
        // Western / Commercial
        'Bollywood', 'Hip-hop', 'Contemporary', 'Freestyle', 'Waacking', 'Locking',
        'Popping', 'Breaking', 'Ballet', 'Jazz', 'Lyrical',
        // Event-specific
        'Sangeet Choreography', 'Wedding Choreography', 'Group Choreography',
        'Item Number', 'Title Track', 'Stage Show',
    ],
    singer: [
        // Indian Classical
        'Hindustani Classical', 'Carnatic', 'Thumri', 'Dadra', 'Bhajan', 'Dhrupad',
        // Light / Semi-classical
        'Ghazal', 'Sufi', 'Qawwali', 'Semi-Classical', 'Devotional', 'Rabindra Sangeet',
        // Film / Commercial
        'Bollywood Playback', 'Punjabi Pop', 'Tamil Film', 'Telugu Film', 'Marathi Film',
        'Pop / Indie', 'Folk', 'Jingle / Commercial',
        // Event-specific
        'Sangeet Performances', 'Wedding Singer', 'Live Band Vocals', 'Corporate Shows',
    ],
    musician: [
        // Percussion
        'Tabla', 'Mridangam', 'Dholak', 'Dhol', 'Pakhawaj', 'Khol', 'Ghatam', 'Kanjira',
        // Strings — Indian
        'Sitar', 'Sarod', 'Sarangi', 'Santoor', 'Tanpura', 'Veena',
        // Strings — Western
        'Violin', 'Guitar', 'Bass Guitar', 'Mandolin',
        // Wind / Keys
        'Bansuri', 'Flute', 'Shehnai', 'Harmonium', 'Piano', 'Keyboard', 'Saxophone',
        // Drums
        'Drums',
    ],
    dj: [
        'Bollywood DJ', 'Retro Bollywood', 'Punjabi / Bhangra DJ', 'Garba DJ',
        'EDM', 'Hip-hop', 'House', 'Techno', 'Club DJ',
        'Wedding DJ', 'Corporate DJ', 'Sufi Sets', 'Commercial', 'Live DJ',
    ],
    actor: [
        // Stage
        'Theatre', 'Street Theatre', 'Physical Theatre', 'Mime', 'Improv',
        // Screen
        'Hindi Film', 'Marathi Film', 'Tamil Film', 'Telugu Film',
        'OTT / Streaming', 'TV / Web Series', 'Ad Film',
        // Voice
        'Voiceover', 'Dubbing', 'Radio Drama',
        // Live
        'Stand-up Comedy', 'Monologue',
    ],
    anchor: [
        'Wedding Anchor', 'Sangeet Ceremonies', 'Corporate Events', 'Award Shows',
        'Entertainment Shows', 'Fashion Shows', 'Sports Events', 'Cultural Festivals',
        'App / Product Launch', 'Political Events', 'News / Radio',
    ],
    folk: [
        'Bhangra', 'Lavani', 'Garba', 'Dandiya', 'Ghoomar', 'Bihu', 'Chholiya',
        'Koli', 'Kolattam', 'Yakshagana', 'Dollu Kunitha', 'Theyyam', 'Poorakkali',
        'Pulikali', 'Chhau', 'Gotipua', 'Dalkhai', 'Cheraw',
    ],
    visual: [
        'Event Photography', 'Portrait Photography', 'Stage Photography',
        'Digital Illustration', 'Illustration', 'Calligraphy',
        'Warli', 'Madhubani', 'Pattachitra', 'Mehndi / Henna',
        'Rangoli', 'Mural', 'Installation', 'Pottery / Ceramics',
        'Sketch Art', 'Digital Art',
    ],
};

export const ARTIST_SKILL_DEFAULTS: Record<string, string[]> = {
    dancer:   ['Bollywood', 'Sangeet Choreography'],
    singer:   ['Bollywood Playback', 'Folk'],
    musician: ['Tabla', 'Guitar'],
    dj:       ['Bollywood DJ', 'Wedding DJ'],
    actor:    ['Theatre', 'Hindi Film'],
    anchor:   ['Wedding Anchor', 'Corporate Events'],
    folk:     ['Bhangra', 'Garba'],
    visual:   ['Event Photography', 'Digital Illustration'],
};

export const ARTIST_SKILL_HINTS: Record<string, string> = {
    dancer:   'Dance styles & specialties',
    singer:   'Vocal styles & genres',
    musician: 'Instruments & styles',
    dj:       'DJ styles & event types',
    actor:    'Acting specialisms',
    anchor:   'Hosting & anchoring types',
    folk:     'Folk forms & traditions',
    visual:   'Visual art mediums',
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
