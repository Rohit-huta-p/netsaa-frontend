import React from 'react';
import { View, Animated, Platform, useWindowDimensions, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useParallax, SCREEN_HEIGHT } from '@/hooks/useParallax';

const isWeb = Platform.OS === 'web';

interface ParallaxSectionProps {
    scrollY: Animated.Value;
    sectionIndex: number;
    children: React.ReactNode;
    /** Background color for this section */
    bgColor?: string;
    /** Whether to skip the reveal animation (e.g., for hero section) */
    noReveal?: boolean;
    /** Custom section height estimate for parallax calculation */
    sectionHeight?: number;
    /** Whether to add gradient overlaps at edges for blending */
    blendEdges?: boolean;
    /** Color to blend INTO at the top edge */
    blendTopColor?: string;
    /** Color to blend INTO at the bottom edge */
    blendBottomColor?: string;
    /** Additional style for the outer container */
    style?: StyleProp<ViewStyle>;
    /** Additional style for the animated content container */
    contentStyle?: StyleProp<ViewStyle>;
}

/**
 * ParallaxSection - Wrapper that adds scroll-driven reveal animations
 * and gradient edge blending between sections.
 */
export default function ParallaxSection({
    scrollY,
    sectionIndex,
    children,
    bgColor = '#000',
    noReveal = false,
    sectionHeight,
    blendEdges = false,
    blendTopColor = '#000',
    blendBottomColor = '#000',
    style,
    contentStyle,
}: ParallaxSectionProps) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const { contentOpacity, contentTranslateY, contentScale } = useParallax(
        scrollY,
        sectionIndex,
        { sectionHeight }
    );

    const revealStyle = noReveal
        ? {}
        : {
            opacity: contentOpacity,
            transform: [
                { translateY: contentTranslateY },
                { scale: contentScale },
            ],
        };

    return (
        <View
            style={[
                {
                    backgroundColor: bgColor,
                    position: 'relative',
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            {/* Top gradient overlap for smooth blending */}
            {blendEdges && (
                <LinearGradient
                    colors={[blendTopColor, 'transparent'] as const}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: isMobile ? 80 : 160,
                        zIndex: 5,
                    }}
                    pointerEvents="none"
                />
            )}

            {/* Animated content */}
            <Animated.View style={[revealStyle, contentStyle]}>
                {children}
            </Animated.View>

            {/* Bottom gradient overlap for smooth blending */}
            {blendEdges && (
                <LinearGradient
                    colors={['transparent', blendBottomColor] as const}
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: isMobile ? 80 : 160,
                        zIndex: 5,
                    }}
                    pointerEvents="none"
                />
            )}
        </View>
    );
}
