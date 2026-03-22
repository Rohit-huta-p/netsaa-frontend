import { Animated, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * useParallax - Scroll-driven interpolations for parallax effects.
 *
 * Each section occupies roughly one screen height. Given a sectionIndex,
 * we compute the scroll range where that section is "entering" the viewport
 * and provide animated values for opacity, translateY, scale, and background movement.
 *
 * @param scrollY - The Animated.Value tracking scroll position
 * @param sectionIndex - 0-based index of the section in the page
 * @param options - Optional overrides for animation behavior
 */
export function useParallax(
    scrollY: Animated.Value,
    sectionIndex: number,
    options: {
        /** Height of this section (defaults to SCREEN_HEIGHT) */
        sectionHeight?: number;
        /** How far content slides up during reveal (default: 80) */
        translateDistance?: number;
        /** Parallax speed for background elements, 0–1 (default: 0.4) */
        backgroundSpeed?: number;
        /** Range before section top where animation begins (default: SCREEN_HEIGHT * 0.7) */
        triggerOffset?: number;
    } = {}
) {
    const {
        sectionHeight = SCREEN_HEIGHT,
        translateDistance = 80,
        backgroundSpeed = 0.4,
        triggerOffset = SCREEN_HEIGHT * 0.7,
    } = options;

    // The scroll position where this section's top edge appears at the viewport bottom
    const sectionStart = sectionIndex * sectionHeight;

    // Animation starts when section is triggerOffset away from entering viewport
    const animStart = Math.max(0, sectionStart - triggerOffset);
    // Animation completes when section is fully in view
    const animEnd = sectionStart;

    // Content reveal: opacity 0→1
    const contentOpacity = scrollY.interpolate({
        inputRange: [animStart, animEnd],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    // Content reveal: slide up from translateDistance→0
    const contentTranslateY = scrollY.interpolate({
        inputRange: [animStart, animEnd],
        outputRange: [translateDistance, 0],
        extrapolate: 'clamp',
    });

    // Content reveal: subtle scale 0.92→1
    const contentScale = scrollY.interpolate({
        inputRange: [animStart, animEnd],
        outputRange: [0.92, 1],
        extrapolate: 'clamp',
    });

    // Background parallax: moves slower than scroll
    const backgroundTranslateY = scrollY.interpolate({
        inputRange: [sectionStart - sectionHeight, sectionStart + sectionHeight],
        outputRange: [sectionHeight * backgroundSpeed, -sectionHeight * backgroundSpeed],
        extrapolate: 'clamp',
    });

    // Exit parallax for hero/first sections: content fades out as you scroll past
    const exitOpacity = scrollY.interpolate({
        inputRange: [sectionStart, sectionStart + sectionHeight * 0.6],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const exitTranslateY = scrollY.interpolate({
        inputRange: [sectionStart, sectionStart + sectionHeight * 0.6],
        outputRange: [0, -translateDistance * 0.5],
        extrapolate: 'clamp',
    });

    // Staggered reveals: returns interpolations with increasing delays
    const staggered = (index: number, total: number = 3) => {
        const staggerRange = triggerOffset * 0.4; // portion used for stagger
        const itemStart = animStart + (staggerRange * index) / total;
        const itemEnd = Math.min(itemStart + triggerOffset * 0.6, animEnd);

        return {
            opacity: scrollY.interpolate({
                inputRange: [itemStart, itemEnd],
                outputRange: [0, 1],
                extrapolate: 'clamp',
            }),
            translateY: scrollY.interpolate({
                inputRange: [itemStart, itemEnd],
                outputRange: [translateDistance * 0.6, 0],
                extrapolate: 'clamp',
            }),
            scale: scrollY.interpolate({
                inputRange: [itemStart, itemEnd],
                outputRange: [0.95, 1],
                extrapolate: 'clamp',
            }),
        };
    };

    return {
        contentOpacity,
        contentTranslateY,
        contentScale,
        backgroundTranslateY,
        exitOpacity,
        exitTranslateY,
        staggered,
        // Raw values for custom interpolations
        sectionStart,
        animStart,
        animEnd,
    };
}

export { SCREEN_HEIGHT };
