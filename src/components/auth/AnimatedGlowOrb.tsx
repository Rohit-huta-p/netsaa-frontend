import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

export const AnimatedGlowOrb = ({
    size, color, style,
}: { size: number; color: string; style?: any }) => {
    const pulse = useRef(new Animated.Value(0.4)).current;
    
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 0.9, duration: 3000, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0.4, duration: 3000, useNativeDriver: true }),
            ])
        ).start();
    }, [pulse]);

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                {
                    position: "absolute", width: size, height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                    opacity: pulse,
                },
                style,
            ]}
        />
    );
};
