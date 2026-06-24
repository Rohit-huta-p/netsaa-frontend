// src/components/ui/AmbientBackground.tsx
//
// The landing page's atmosphere, distilled for in-app screens:
//   · a faint blueprint grid (SVG pattern)
//   · two slow-breathing gradient glow orbs (pink top-right, orange bottom-left)
//
// Lighter than src/components/ui/BackgroundElements.tsx (which is tuned for the
// full-bleed marketing hero) — opacities are pulled back so foreground content
// stays legible on a utility screen. Render it as the first child of a
// position:relative container, with the real content layered above.
import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
    cancelAnimation,
} from 'react-native-reanimated';
import { LANDING } from '@/constants/landingTheme';

interface AmbientBackgroundProps {
    /** Disable the breathing animation (e.g. for reduced-motion). Grid + orbs stay. */
    static?: boolean;
    /** Grid line opacity. Default 0.04 — just enough to feel like drafting paper. */
    gridOpacity?: number;
}

export function AmbientBackground({ static: isStatic = false, gridOpacity = 0.05 }: AmbientBackgroundProps) {
    const { width, height } = useWindowDimensions();

    const drift1 = useSharedValue(0);
    const drift2 = useSharedValue(0);

    useEffect(() => {
        if (isStatic) return;
        // Two offset breathing loops so the glows never pulse in unison.
        drift1.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 9000, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
            true,
        );
        drift2.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 11000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 11000, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
            true,
        );
        return () => {
            cancelAnimation(drift1);
            cancelAnimation(drift2);
        };
    }, [isStatic]);

    const orb1Style = useAnimatedStyle(() => ({
        transform: [
            { translateY: -28 * drift1.value },
            { scale: 1 + 0.12 * drift1.value },
        ],
    }));
    const orb2Style = useAnimatedStyle(() => ({
        transform: [
            { translateY: 28 * drift2.value },
            { scale: 1 + 0.14 * drift2.value },
        ],
    }));

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={[StyleSheet.absoluteFill, { backgroundColor: LANDING.bg.primary }]} />

            {/* Pink glow — top right */}
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        top: -width * 0.35,
                        right: -width * 0.3,
                        width: width * 0.95,
                        height: width * 0.95,
                        borderRadius: width * 0.5,
                        opacity: 0.12,
                    },
                    orb1Style,
                ]}
            >
                <LinearGradient
                    colors={[LANDING.gradient.pink, 'transparent']}
                    start={{ x: 0.3, y: 0.2 }}
                    end={{ x: 0.8, y: 0.9 }}
                    style={{ flex: 1, borderRadius: width * 0.5 }}
                />
            </Animated.View>

            {/* Orange glow — lower left */}
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        top: height * 0.45,
                        left: -width * 0.4,
                        width: width * 0.9,
                        height: width * 0.9,
                        borderRadius: width * 0.5,
                        opacity: 0.1,
                    },
                    orb2Style,
                ]}
            >
                <LinearGradient
                    colors={[LANDING.gradient.orange, 'transparent']}
                    start={{ x: 0.2, y: 0.8 }}
                    end={{ x: 0.9, y: 0.2 }}
                    style={{ flex: 1, borderRadius: width * 0.5 }}
                />
            </Animated.View>

            {/* Blueprint grid */}
            <Svg height="100%" width="100%" style={{ position: 'absolute' }}>
                <Defs>
                    <Pattern id="ambient-grid" width="52" height="52" patternUnits="userSpaceOnUse">
                        <Path
                            d="M 52 0 L 0 0 0 52"
                            fill="none"
                            stroke="#F5F5F5"
                            strokeWidth="0.5"
                            opacity={gridOpacity}
                        />
                    </Pattern>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#ambient-grid)" />
            </Svg>
        </View>
    );
}
