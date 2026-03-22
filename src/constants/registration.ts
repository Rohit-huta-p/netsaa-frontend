// src/constants/registration.ts
// Registration flow constants — colors, data arrays, step sequences

import {
    Target, Users, BookOpen, Calendar, User, Building2,
    Briefcase, MapPin, Sparkles,
} from 'lucide-react-native';
import type {
    Intent, ExperienceLevel, OrganizerTypeCategory,
} from '@/schemas/register.schema';

/* ── Intent options ── */
export const INTENT_OPTIONS: { id: Intent; label: string; icon: React.ElementType }[] = [
    { id: 'find_gigs', label: 'Find Gigs', icon: Target },
    { id: 'hire_artists', label: 'Hire Artists', icon: Users },
    { id: 'learn_workshops', label: 'Learn & Grow', icon: BookOpen },
    { id: 'host_events', label: 'Host Events', icon: Calendar },
];

/* ── Artist types ── */
export const ARTIST_TYPES = [
    'Singer', 'Dancer', 'Musician', 'DJ', 'Actor', 'Band', 'Model', 'Anchor', 'Other',
] as const;

/* ── Experience levels ── */
export const EXP_LEVELS: { id: ExperienceLevel; label: string; sub: string }[] = [
    { id: 'beginner', label: 'Beginner', sub: 'Just starting out' },
    { id: 'intermediate', label: 'Intermediate', sub: 'Some experience' },
    { id: 'professional', label: 'Professional', sub: 'Industry veteran' },
];

/* ── Organizer type categories ── */
export const ORG_TYPE_CATEGORIES: { id: OrganizerTypeCategory; label: string; sub: string; icon: React.ElementType }[] = [
    { id: 'individual', label: 'Individual', sub: 'Freelance organizer', icon: User },
    { id: 'academy', label: 'Academy / Studio', sub: 'Conduct classes, workshops & hire instructors', icon: BookOpen },
    { id: 'registered_business', label: 'Registered Business', sub: 'Pvt Ltd / LLP / Proprietorship', icon: Building2 },
    { id: 'agency', label: 'Agency', sub: 'Talent or event agency', icon: Briefcase },
    { id: 'venue', label: 'Venue', sub: 'Hotels, clubs, halls', icon: MapPin },
    { id: 'brand', label: 'Brand', sub: 'Campaigns, activations & branded events', icon: Sparkles },
    { id: 'corporate', label: 'Corporate', sub: 'Internal corporate events team', icon: Building2 },
];

/* ── Step ID sequences ── */
export const ARTIST_STEPS = [
    'role', 'identity', 'credentials', 'intent', 'artistCategory', 'experience', 'social',
] as const;

export const ORGANIZER_STEPS = [
    'role', 'identity', 'credentials', 'orgTypeCategory', 'orgProfile', 'billing', 'intent', 'social',
] as const;

export type StepId = (typeof ARTIST_STEPS)[number] | (typeof ORGANIZER_STEPS)[number] | 'completion';
