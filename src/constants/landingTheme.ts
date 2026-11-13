/**
 * NETSA Landing Page Theme — v2 Figma Clone
 *
 * Matches the web landing (index.web.tsx / NETSA_figma_clone_v2photos.html):
 * Rose (#ff4d88) → Orange (#ff822e) → Peach (#ff976b) on near-black (#09090b)
 */

export const LANDING = {
  gradient: {
    rose: '#ff4d88',
    orange: '#ff822e',
    peach: '#ff976b',
    colors: ['#ff4d88', '#ff822e'] as const,
    colorsFull: ['#ff4d88', '#ff822e', '#ff976b'] as const,
    // kept for legacy refs in existing components
    pink: '#ff4d88',
    gold: '#ff976b',
  },

  accent: {
    cyan: '#06B6D4',
    green: '#34D399',
    purple: '#8B5CF6',
  },

  bg: {
    primary: '#09090b',
    elevated: '#111113',
    card: '#111113',
    white: '#FFFFFF',
  },

  text: {
    primary: '#f5f5f5',
    mid: '#a7a7ae',
    dim: '#6b6b72',
    black: '#000000',
  },

  border: {
    default: 'rgba(255,255,255,0.06)',
    strong: 'rgba(255,255,255,0.10)',
    card: 'rgba(39,39,42,0.45)',
  },

  trust: {
    new: '#6B7280',
    rising: '#3B82F6',
    trusted: '#34D399',
    verified: '#f59e0b',
  },

  wa: {
    bg: '#0B141A',
    header: '#1F2C34',
    msgIn: '#1F2C34',
    msgOut: '#005C4B',
    text: '#E9EDEF',
    textDim: 'rgba(255,255,255,0.35)',
    ticks: '#53BDEB',
    dateBg: '#1B2831',
  },

  glow: {
    orange: 'rgba(255,130,46,0.25)',
    pink: 'rgba(255,77,136,0.20)',
  },

  fonts: {
    serif: 'DMSerifDisplay_400Regular',
    sans: 'Outfit-Regular',
    sansBold: 'Outfit-Bold',
    sansExtraBold: 'Outfit-ExtraBold',
    sansSemiBold: 'Outfit-SemiBold',
    sansMedium: 'Outfit-Medium',
    sansLight: 'Outfit-Light',
    mono: 'Outfit-Medium',
  },

  spacing: {
    px: 24,
    sectionVertical: 80,
    sectionVerticalLarge: 120,
  },
} as const;

export type LandingTheme = typeof LANDING;
