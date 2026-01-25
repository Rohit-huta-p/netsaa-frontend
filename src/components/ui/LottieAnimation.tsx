import React from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

interface LottieAnimationProps {
    source: any; // Lottie JSON source
    autoPlay?: boolean;
    loop?: boolean;
    speed?: number;
    style?: ViewStyle;
    onAnimationFinish?: () => void;
}

/**
 * Wrapper component for Lottie animations
 * Provides consistent styling and behavior across the app
 */
export default function LottieAnimation({
    source,
    autoPlay = true,
    loop = true,
    speed = 1,
    style,
    onAnimationFinish,
}: LottieAnimationProps) {
    const animationRef = React.useRef<LottieView>(null);

    return (
        <LottieView
            ref={animationRef}
            source={source}
            autoPlay={autoPlay}
            loop={loop}
            speed={speed}
            style={[styles.animation, style]}
            onAnimationFinish={onAnimationFinish}
        />
    );
}

/**
 * Animated Lottie component that can respond to scroll and other triggers
 */
export function AnimatedLottie({
    source,
    animatedValue,
    inputRange = [0, 1],
    outputRange = [0, 1],
    style,
}: {
    source: any;
    animatedValue: Animated.Value;
    inputRange?: number[];
    outputRange?: number[];
    style?: ViewStyle;
}) {
    const progress = animatedValue.interpolate({
        inputRange,
        outputRange,
        extrapolate: 'clamp',
    });

    return (
        <View style={style}>
            <LottieView
                source={source}
                progress={progress as any}
                style={styles.animation}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    animation: {
        width: '100%',
        height: '100%',
    },
});
