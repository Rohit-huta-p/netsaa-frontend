// register-kit/theme.ts
// A·Minimal dark design tokens + per-role accent, shared by every register/onboarding step.
// Accents are carried from the welcome screen: Artist = indigo, Creative Lead = orange.

export const RK = {
    bg: '#121216',
    surface: '#1b1b21',
    surface2: '#26262c',
    hair: 'rgba(255,255,255,0.08)',
    hair2: 'rgba(255,255,255,0.14)',
    cream: '#F3EFE8',
    cream2: '#D9D4CC',
    muted: '#71717a',
    dim: '#52525b',
    danger: '#FCA5A5',
    dangerBg: 'rgba(239,68,68,0.08)',
    dangerBd: 'rgba(239,68,68,0.25)',
} as const;

export const RK_FONT = {
    serif: 'DMSerifDisplay_400Regular',
    mono: 'SpaceMono-Regular',
    monoBold: 'SpaceMono-Bold',
    light: 'Outfit-Light',
    body: 'Outfit-Regular',
    med: 'Outfit-Medium',
    semi: 'Outfit-SemiBold',
    bold: 'Outfit-Bold',
} as const;

export type RoleKey = 'artist' | 'creative_lead';

export interface Accent {
    base: string;    // fills: active pill, CTA, selected chip, links
    border: string;  // lightened edge for accent-tinted surfaces
    on: string;      // text/icon on top of `base`
    soft: string;    // low-alpha wash of the accent (focus ring tint, selected bg)
}

export const ROLE_ACCENT: Record<RoleKey, Accent> = {
    artist: { base: '#362A93', border: '#6A61AF', on: '#FDF6EE', soft: 'rgba(54,42,147,0.18)' },
    creative_lead: { base: '#9E4C15', border: '#BD7838', on: '#FDF6EE', soft: 'rgba(158,76,21,0.18)' },
};

export const roleKeyFromParam = (role?: string): RoleKey =>
    role === 'creative_lead' ? 'creative_lead' : 'artist';
