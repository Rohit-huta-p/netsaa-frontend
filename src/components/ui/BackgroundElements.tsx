import React, { useEffect } from 'react';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Path } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing
} from 'react-native-reanimated';

export const BackgroundElements = () => {
    const { width, height } = useWindowDimensions();

    // Orb animations
    const orb1Scale = useSharedValue(1);
    const orb2Scale = useSharedValue(1);
    const orb1TranslateY = useSharedValue(0);
    const orb2TranslateY = useSharedValue(0);

    useEffect(() => {
        // Orb 1 breathing animation
        orb1Scale.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        orb1TranslateY.value = withRepeat(
            withSequence(
                withTiming(-50, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 10000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        // Orb 2 breathing animation (offset)
        orb2Scale.value = withRepeat(
            withSequence(
                withTiming(1.3, { duration: 9000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        orb2TranslateY.value = withRepeat(
            withSequence(
                withTiming(50, { duration: 11000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 11000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const animatedOrb1Style = useAnimatedStyle(() => ({
        transform: [
            { scale: orb1Scale.value },
            { translateY: orb1TranslateY.value }
        ]
    }));

    const animatedOrb2Style = useAnimatedStyle(() => ({
        transform: [
            { scale: orb2Scale.value },
            { translateY: orb2TranslateY.value }
        ]
    }));

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Background Base */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />

            {/* Gradient Orb 1 - Top Left */}
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        top: -width * 0.2,
                        left: -width * 0.1,
                        width: width * 0.8,
                        height: width * 0.8,
                        borderRadius: width * 0.4,
                        opacity: 0.15, // Subtle
                    },
                    animatedOrb1Style
                ]}
            >
                <LinearGradient
                    colors={['#8B5CF6', '#3B82F6', 'transparent']}
                    start={{ x: 0.2, y: 0.2 }}
                    end={{ x: 0.8, y: 0.8 }}
                    style={{ flex: 1, borderRadius: width * 0.4 }}
                />
            </Animated.View>

            {/* Gradient Orb 2 - Bottom Right */}
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        top: height * 0.4,
                        right: -width * 0.2,
                        width: width * 0.9,
                        height: width * 0.9,
                        borderRadius: width * 0.45,
                        opacity: 0.15, // Subtle
                    },
                    animatedOrb2Style
                ]}
            >
                <LinearGradient
                    colors={['#EC4899', '#8B5CF6', 'transparent']}
                    start={{ x: 0.8, y: 0.8 }}
                    end={{ x: 0.2, y: 0.2 }}
                    style={{ flex: 1, borderRadius: width * 0.45 }}
                />
            </Animated.View>

            {/* Gradient Orb 3 - Center (Very subtle) */}
            <View
                style={{
                    position: 'absolute',
                    top: height * 0.1,
                    left: width * 0.1,
                    width: width * 0.8,
                    height: height * 0.5,
                    opacity: 0.05,
                }}
            >
                <LinearGradient
                    colors={['transparent', '#6D28D9', 'transparent']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={{ flex: 1 }}
                />
            </View>

            {/* Grid Pattern Overlay */}
            <Svg height="100%" width="100%" style={{ position: 'absolute', opacity: 0.25 }}>
                <Defs>
                    <Pattern
                        id="grid-pattern"
                        width="40"
                        height="40"
                        patternUnits="userSpaceOnUse"
                    >
                        <Path
                            d="M 40 0 L 0 0 0 40"
                            fill="none"
                            stroke="white"
                            strokeWidth="0.5"
                            opacity="0.3"
                        />
                    </Pattern>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#grid-pattern)" />
            </Svg>

            {/* Vignette effect */}
            <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.5)']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />
        </View>
    );
};
