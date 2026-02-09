/**
 * useThemeColors - Theme hook for NETSA matching final-landing.tsx design
 * 
 * Color palette based on the NETSA design system:
 * - netsa-1 through netsa-10: Purple to pink gradient palette
 * - Backgrounds: Pure black, zinc-900, zinc-950
 * - Accents: Pink/coral accent colors
 */

import { useMemo } from 'react';
import { usePathname } from 'expo-router';
import useAuthStore from '@/stores/authStore';

// ═══════════════════════════════════════════════════════════════════════════
// NETSA COLOR PALETTE (matching final-landing.tsx)
// ═══════════════════════════════════════════════════════════════════════════

export const NETSA_COLORS = {
    // Main gradient palette (purple to pink)
    netsa: {
        1: '#6D23B6',   // Deep purple
        2: '#7B2CBF',   // Purple
        3: '#9D4EDD',   // Medium purple
        5: '#C77DFF',   // Light purple
        8: '#E0AAFF',   // Very light purple/pink
        10: '#EA698B',  // Coral/Pink accent (primary accent)
    },

    // Background colors
    bg: {
        black: '#000000',
        dark: '#09090b',      // zinc-950
        surface: '#18181b',   // zinc-900
        card: '#27272a',      // zinc-800
    },

    // Text colors
    text: {
        primary: '#FFFFFF',
        secondary: '#a1a1aa',  // zinc-400
        muted: '#71717a',      // zinc-500
    },

    // Gradient presets
    gradients: {
        // Primary brand gradient
        primary: ['#C77DFF', '#9D4EDD', '#EA698B'] as const,
        // Hero accent gradient
        hero: ['#6D23B6', '#9D4EDD'] as const,
        // CTA gradient
        cta: ['#EA698B', '#C77DFF'] as const,
        // Feature card accent
        feature: ['#C77DFF', '#EA698B'] as const,
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// THEME TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ThemeRole = 'artist' | 'organizer';

export interface ThemeColors {
    role: ThemeRole;
    // Primary gradient
    primary: {
        colors: readonly string[];
        locations?: readonly number[];
    };
    // Secondary gradient
    secondary: {
        colors: readonly string[];
        locations?: readonly number[];
    };
    // Button gradient
    button: {
        colors: readonly string[];
        locations?: readonly number[];
    };
    // CTA gradient
    cta: {
        colors: readonly string[];
        locations: readonly number[];
    };
    // Direct color access
    accent: string;
    background: string;
}

// Theme definitions
export const THEME_COLORS = {
    // CTA (Apply, Register) - Always coral/pink
    cta: {
        colors: ['#EA698B', '#C77DFF', '#9D4EDD'] as const,
        locations: [0, 0.5, 1] as const,
    },

    // Artist Theme (default)
    artist: {
        primary: {
            colors: ['#6D23B6', '#9D4EDD'] as const,
        },
        secondary: {
            colors: ['#9D4EDD', '#EA698B'] as const,
        },
        button: {
            colors: ['#C77DFF', '#EA698B'] as const,
        },
        accent: '#EA698B',
    },

    // Organizer Theme (Orange)
    organizer: {
        primary: {
            colors: ['#FF6B35', '#FF8C42'] as const,
        },
        secondary: {
            colors: ['#FF8C42', '#FFB27F'] as const,
        },
        button: {
            colors: ['#FF6B35', '#FF8C42'] as const,
        },
        accent: '#FF6B35',
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE-BASED THEME DETECTION
// ═══════════════════════════════════════════════════════════════════════════

function getThemeFromRoute(pathname: string): ThemeRole | null {
    // Organizer-specific routes
    if (
        pathname.includes('/organizer') ||
        pathname.includes('/dashboard') ||
        pathname.includes('/post-gig') ||
        pathname.includes('/my-gigs') ||
        pathname.includes('/applicants')
    ) {
        return 'organizer';
    }

    // Artist-facing routes (default)
    if (
        pathname.includes('/gigs') ||
        pathname.includes('/events') ||
        pathname.includes('/profile') ||
        pathname.includes('/artist') ||
        pathname.includes('/search') ||
        pathname === '/' ||
        pathname.includes('/auth')
    ) {
        return 'artist';
    }

    // Connections page → based on user role
    if (pathname.includes('/connections')) {
        return null;
    }

    return 'artist';
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useThemeColors(): ThemeColors {
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);

    const themeColors = useMemo(() => {
        const routeTheme = getThemeFromRoute(pathname);

        let role: ThemeRole;
        if (routeTheme) {
            role = routeTheme;
        } else {
            role = user?.roles?.includes('organizer') ? 'organizer' : 'artist';
        }

        const theme = THEME_COLORS[role];

        return {
            role,
            primary: theme.primary,
            secondary: theme.secondary,
            button: theme.button,
            cta: THEME_COLORS.cta,
            accent: theme.accent,
            background: NETSA_COLORS.bg.black,
        };
    }, [pathname, user?.roles]);

    return themeColors;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get gradient props ready for LinearGradient component
 */
export function getGradientProps(gradient: { colors: readonly string[]; locations?: readonly number[] }) {
    return {
        colors: gradient.colors as [string, ...string[]],
        locations: gradient.locations as number[] | undefined,
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
    };
}

/**
 * Get button gradient colors for a specific role
 */
export function getButtonGradient(role: ThemeRole) {
    return THEME_COLORS[role].button;
}

/**
 * Get CTA gradient (always the same)
 */
export function getCtaGradient() {
    return THEME_COLORS.cta;
}

/**
 * Get direct access to NETSA colors
 */
export function getNetsaColors() {
    return NETSA_COLORS;
}

export default useThemeColors;
