// src/constants/registration.ts
// Registration flow constants — colors, data arrays, step sequences

import {
    Target, Users, BookOpen, Calendar, User, Building2,
    Briefcase, MapPin, Sparkles,
} from 'lucide-react-native';
import type {
    Intent, ExperienceLevel, OrganizerTypeCategory,
} from '@/schemas/register.schema';

/* ── Color palette ── */
export const REG_COLORS = {
    primary: '#8B5CF6',
    secondary: '#3B82F6',
    bg: '#0a0a0f',
    w95: 'rgba(255,255,255,0.95)',
    w80: 'rgba(255,255,255,0.80)',
    w60: 'rgba(255,255,255,0.60)',
    w50: 'rgba(255,255,255,0.50)',
    w40: 'rgba(255,255,255,0.40)',
    w30: 'rgba(255,255,255,0.30)',
    w25: 'rgba(255,255,255,0.25)',
    w15: 'rgba(255,255,255,0.15)',
    w10: 'rgba(255,255,255,0.10)',
    w08: 'rgba(255,255,255,0.08)',
    w06: 'rgba(255,255,255,0.06)',
    w03: 'rgba(255,255,255,0.03)',
    activeB: 'rgba(139,92,246,0.6)',
    activeBg: 'rgba(139,92,246,0.1)',
} as const;

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
    'role', 'identity', 'credentials', 'orgTypeCategory', 'orgProfile', 'primaryContact', 'billing', 'intent', 'social',
] as const;

export type StepId = (typeof ARTIST_STEPS)[number] | (typeof ORGANIZER_STEPS)[number] | 'completion';
