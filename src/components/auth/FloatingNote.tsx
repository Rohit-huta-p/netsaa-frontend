// src/components/auth/FloatingNote.tsx
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, Platform } from "react-native";

const isWeb = Platform.OS === "web";
const { width } = Dimensions.get("window");

interface FloatingNoteProps {
    delay: number;
    icon: any;
    color: string;
}

/** Floating music notes that drift across the screen (mobile only) */
export const FloatingNote = ({ delay, icon: Icon, color }: FloatingNoteProps) => {
    const translateY = useRef(new Animated.Value(0)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;
    const screenHeight = Dimensions.get('window').height;

    useEffect(() => {
        if (isWeb) return;

        const startX = Math.random() * width;
        translateX.setValue(startX);

        const animate = () => {
            translateY.setValue(screenHeight + 50);
            opacity.setValue(0);
            rotate.setValue(0);

            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: -100,
                    duration: 12000 + Math.random() * 5000,
                    delay,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.timing(opacity, {
                        toValue: 0.6,
                        duration: 2000,
                        delay,
                        useNativeDriver: true,
                    }),
                    Animated.delay(6000),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.timing(rotate, {
                    toValue: 1,
                    duration: 8000,
                    delay,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(translateX, {
                            toValue: startX + 30,
                            duration: 2000,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                        Animated.timing(translateX, {
                            toValue: startX - 30,
                            duration: 2000,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                    ])
                ),
            ]).start(() => animate());
        };
        animate();
    }, []);

    if (isWeb) return null;

    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                transform: [{ translateY }, { translateX }, { rotate: spin }],
                opacity,
            }}
        >
            <Icon size={20} color={color} />
        </Animated.View>
    );
};
