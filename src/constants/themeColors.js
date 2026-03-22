// src/constants/themeColors.js
// Single source of truth for all application colors.
// This is a plain CommonJS file so it can be consumed by both tailwind.config.js and Metro/React Native.

module.exports = {
    // NETSA Color Palette (matching final-landing.tsx)
    netsa: {
        1: '#6D23B6',   // Deep purple
        2: '#7B2CBF',   // Purple
        3: '#9D4EDD',   // Medium purple
        5: '#C77DFF',   // Light purple
        8: '#E0AAFF',   // Very light purple/pink
        10: '#EA698B',  // Coral/Pink accent
    },

    // Organizer Theme Colors (Orange/Amber)
    organizer: {
        50: '#FFF8F4',
        100: '#FFEDE4',
        200: '#FFD4BF',
        300: '#FFB27F',
        400: '#FF9D55',
        500: '#FF8C42',   // Secondary
        600: '#ff6b35ff',   // Primary
        700: '#E5572A',
        800: '#CC4A23',
        900: '#A63919',
    },

    // Background colors
    bg: {
        black: '#000000',
        dark: '#09090b',      // zinc-950
        surface: '#18181b',   // zinc-900
        card: '#27272a',      // zinc-800
    },

    // Card system (Phase 1: Gigs UI Enhancement)
    card: {
        bg: 'rgba(18, 18, 18, 1)',
        surface: 'rgba(18, 5, 23, 1)',
        hover: 'rgba(24, 24, 24, 1)',
    },

    // Border colors
    border: {
        subtle: 'rgba(255, 255, 255, 0.08)',
        hover: 'rgba(255, 255, 255, 0.12)',
    },

    buttons: {
        apply: '#045be7ff',
    },

    // Accent colors
    accent: {
        urgent: '#FF6B35',
        verified: '#10B981',
        premium: '#8B5CF6',
    },

    // Auth UI
    auth: {
        primary: "#8B5CF6",
        primaryDim: "rgba(139,92,246,0.35)",
        primarySoft: "rgba(139,92,246,0.12)",
        secondary: "#3B82F6", // from REG_COLORS
        accent: "#A78BFA",
        bg: "#0a0a0f", // from REG_COLORS
        sheet: "rgba(10,7,22,0.97)",
        sheetBorder: "rgba(139,92,246,0.22)",
        w95: "rgba(255,255,255,0.95)",
        w80: "rgba(255,255,255,0.80)",
        w60: "rgba(255,255,255,0.60)",
        w50: "rgba(255,255,255,0.50)", // newly added from REG_COLORS
        w40: "rgba(255,255,255,0.40)",
        w30: "rgba(255,255,255,0.30)",
        w25: "rgba(255,255,255,0.25)",
        w15: "rgba(255,255,255,0.15)",
        w10: "rgba(255,255,255,0.10)",
        w08: "rgba(255,255,255,0.08)",
        w06: "rgba(255,255,255,0.06)",
        w05: "rgba(255,255,255,0.05)",
        w03: "rgba(255,255,255,0.03)",
        activeB: "rgba(139,92,246,0.60)",
        activeBg: "rgba(139,92,246,0.12)", // REG_COLORS has 0.1, tailwind has 0.12. Using 0.12 as it's standard tailwind opacity
        error: "rgba(239,68,68,0.12)",
        errorBdr: "rgba(239,68,68,0.30)",
        errorText: "#FCA5A5",
    },
};
