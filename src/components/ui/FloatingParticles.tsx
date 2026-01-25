import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
}

export default function FloatingParticles() {
    const particles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 10000 + 15000,
        delay: Math.random() * 5000,
    }));

    return (
        <View className="absolute inset-0 pointer-events-none">
            {particles.map((particle) => (
                <FloatingParticle key={particle.id} particle={particle} />
            ))}
        </View>
    );
}

const FloatingParticle = ({ particle }: { particle: Particle }) => {
    const translateY = useRef(new Animated.Value(0)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Fade in
        Animated.timing(opacity, {
            toValue: 0.6,
            duration: 1000,
            delay: particle.delay,
            useNativeDriver: true,
        }).start();

        Animated.timing(scale, {
            toValue: 1,
            duration: 1000,
            delay: particle.delay,
            useNativeDriver: true,
        }).start();

        // Float animation
        Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(translateY, {
                        toValue: -100,
                        duration: particle.duration,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateY, {
                        toValue: 100,
                        duration: particle.duration,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(translateX, {
                        toValue: 50,
                        duration: particle.duration * 0.7,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateX, {
                        toValue: -50,
                        duration: particle.duration * 0.7,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            className="absolute"
            style={{
                left: particle.x,
                top: particle.y,
                width: particle.size,
                height: particle.size,
                opacity,
                transform: [
                    { translateY },
                    { translateX },
                    { scale },
                ],
            }}
        >
            <View className="w-full h-full rounded-full bg-white/40" />
        </Animated.View>
    );
};