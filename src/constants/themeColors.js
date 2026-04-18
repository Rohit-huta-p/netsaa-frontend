// src/constants/themeColors.js
// Single source of truth for all application colors.
// Palette 18: Sunset Gradient + Cool Accents
// This is a plain CommonJS file so it can be consumed by both tailwind.config.js and Metro/React Native.

module.exports = {
    // NETSA Brand — Sunset Gradient (Pink > Orange > Gold)
    netsa: {
        pink: '#EC4899',
        orange: '#F97316',
        gold: '#EAB308',
        // Gradient shorthand for reference (not usable in Tailwind directly)
        gradientStart: '#EC4899',
        gradientEnd: '#F97316',
    },

    // Accent Colors (Cool tones for system/data/trust)
    accent: {
        cyan: '#06B6D4',
        green: '#34D399',
        purple: '#8B5CF6',
        blue: '#3B82F6',
    },

    // Background colors
    bg: {
        primary: '#0A0A10',
        elevated: '#121018',
        surface: '#1A1820',
        card: '#1E1C26',
        white: '#FFFFFF',
    },

    // Text colors
    text: {
        primary: '#F0ECE6',
        mid: '#6B6878',
        dim: '#4A4656',
        black: '#000000',
    },

    // Border colors
    border: {
        subtle: 'rgba(255, 255, 255, 0.06)',
        hover: 'rgba(255, 255, 255, 0.1)',
        strong: 'rgba(255, 255, 255, 0.15)',
    },

    // Trust Tier Colors (reserved — only for trust-related UI)
    trust: {
        new: '#6B7280',
        newBg: 'rgba(107, 114, 128, 0.1)',
        rising: '#3B82F6',
        risingBg: 'rgba(59, 130, 246, 0.1)',
        trusted: '#34D399',
        trustedBg: 'rgba(52, 211, 153, 0.1)',
        verified: '#EAB308',
        verifiedBg: 'rgba(234, 179, 8, 0.1)',
    },

    // Payment Status Colors (fintech standard — never override for brand)
    payment: {
        created: '#6B7280',
        paid: '#3B82F6',
        confirmed: '#34D399',
        disputed: '#EF4444',
        refunded: '#6B7280',
        offline: '#F59E0B',
    },

    // Feedback Colors (universal)
    feedback: {
        success: '#34D399',
        successBg: 'rgba(52, 211, 153, 0.1)',
        error: '#EF4444',
        errorBg: 'rgba(239, 68, 68, 0.1)',
        errorBorder: 'rgba(239, 68, 68, 0.3)',
        errorText: '#FCA5A5',
        warning: '#F59E0B',
        warningBg: 'rgba(245, 158, 11, 0.1)',
        info: '#3B82F6',
        infoBg: 'rgba(59, 130, 246, 0.1)',
    },

    // Auth UI (aligned to Palette 18)
    auth: {
        primary: '#F97316',
        primaryDim: 'rgba(249, 115, 22, 0.35)',
        primarySoft: 'rgba(249, 115, 22, 0.12)',
        secondary: '#EC4899',
        accent: '#EAB308',
        bg: '#0A0A10',
        sheet: 'rgba(18, 16, 24, 0.97)',
        sheetBorder: 'rgba(249, 115, 22, 0.22)',
        // White opacity scale (keep for form inputs)
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
        w05: 'rgba(255,255,255,0.05)',
        w03: 'rgba(255,255,255,0.03)',
        activeB: 'rgba(249, 115, 22, 0.60)',
        activeBg: 'rgba(249, 115, 22, 0.12)',
        error: 'rgba(239,68,68,0.12)',
        errorBdr: 'rgba(239,68,68,0.30)',
        errorText: '#FCA5A5',
    },

    // Glow/Shadow (for elevated elements)
    glow: {
        orange: 'rgba(249, 115, 22, 0.25)',
        pink: 'rgba(236, 72, 153, 0.2)',
        cyan: 'rgba(6, 182, 212, 0.15)',
    },
};
