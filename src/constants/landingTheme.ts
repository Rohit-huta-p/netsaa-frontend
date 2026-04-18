/**
 * NETSA Landing Page Theme — Palette 18: Sunset Gradient + Cool Accents
 *
 * Brand gradient: Pink (#EC4899) > Orange (#F97316) > Gold (#EAB308)
 * System accents: Cyan (#06B6D4) for info/badges, Green (#34D399) for trust
 * Canvas: Deep dark (#0A0A10) with elevated (#121018)
 */

export const LANDING = {
  // Brand gradient colors
  gradient: {
    pink: '#EC4899',
    orange: '#F97316',
    gold: '#EAB308',
    colors: ['#EC4899', '#F97316'] as const,
    colorsFull: ['#EC4899', '#F97316', '#EAB308'] as const,
  },

  // System accent colors
  accent: {
    cyan: '#06B6D4',
    green: '#34D399',
    purple: '#8B5CF6',
  },

  // Backgrounds
  bg: {
    primary: '#0A0A10',
    elevated: '#121018',
    white: '#FFFFFF',
  },

  // Text
  text: {
    primary: '#F0ECE6',
    mid: '#6B6878',
    dim: '#4A4656',
    black: '#000000',
  },

  // Borders
  border: {
    default: 'rgba(255,255,255,0.06)',
    strong: 'rgba(255,255,255,0.1)',
  },

  // Trust tiers
  trust: {
    new: '#6B7280',
    rising: '#3B82F6',
    trusted: '#34D399',
    verified: '#EAB308',
  },

  // WhatsApp mockup colors
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

  // Glow/shadow
  glow: {
    orange: 'rgba(249,115,22,0.25)',
    pink: 'rgba(236,72,153,0.2)',
  },

  // Fonts
  fonts: {
    serif: 'DMSerifDisplay_400Regular',
    sans: 'Outfit-Regular',
    sansBold: 'Outfit-Bold',
    sansExtraBold: 'Outfit-ExtraBold',
    sansSemiBold: 'Outfit-SemiBold',
    sansMedium: 'Outfit-Medium',
    sansLight: 'Outfit-Light',
    mono: 'Outfit-Medium', // Using Outfit-Medium for label/mono role since Space Grotesk isn't loaded
  },

  // Spacing
  spacing: {
    px: 20, // Side padding on mobile
    sectionVertical: 80,
    sectionVerticalLarge: 120,
  },
} as const;

export type LandingTheme = typeof LANDING;
