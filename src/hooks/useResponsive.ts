// Responsive breakpoint utilities for NETSA
// Provides consistent screen size detection across components

import { useWindowDimensions, Platform } from 'react-native';

export const BREAKPOINTS = {
    sm: 640,   // Small mobile
    md: 768,   // Mobile / Tablet
    lg: 900,   // Tablet / Small desktop
    xl: 1200,  // Desktop
    '2xl': 1536, // Large desktop
} as const;

export const isWeb = Platform.OS === 'web';

/**
 * Hook for responsive screen size detection
 * Returns boolean flags for different screen sizes
 */
export function useResponsive() {
    const { width, height } = useWindowDimensions();

    return {
        width,
        height,

        // Screen size flags
        isSmallScreen: width < BREAKPOINTS.lg,      // < 900px
        isMediumScreen: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl, // 900-1200px
        isLargeScreen: width >= BREAKPOINTS.xl,     // >= 1200px

        // Common breakpoints
        isMobile: width < BREAKPOINTS.md,           // < 768px
        isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg, // 768-900px
        isDesktop: width >= BREAKPOINTS.lg,         // >= 900px

        // Platform helpers
        isWeb,
        isNative: !isWeb,

        // Utility for conditional values
        responsive: <T,>(mobile: T, tablet: T, desktop: T): T => {
            if (width < BREAKPOINTS.md) return mobile;
            if (width < BREAKPOINTS.lg) return tablet;
            return desktop;
        },
    };
}

export default useResponsive;
