import React, { useRef, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';

// @ts-ignore
const tailwindConfig = require("../../../tailwind.config");
const C = tailwindConfig.theme.extend.colors.auth;

export const ArtistTag = ({
    icon: Icon, label, delay = 0,
}: { icon: any; label: string; delay?: number }) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: 1, duration: 500, delay, useNativeDriver: true,
        }).start();
    }, [anim, delay]);

    return (
        <Animated.View
            style={{
                opacity: anim,
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
            }}
        >
            <View style={{
                flexDirection: "row", alignItems: "center", gap: 5,
                paddingVertical: 8, paddingHorizontal: 16,
                borderRadius: 20, borderWidth: 1,
                borderColor: "rgba(255,255,255,0.18)",
                backgroundColor: "rgba(59, 58, 58, 0.18)",
            }}>
                <Text style={{
                    fontSize: 13, color: "rgba(173, 173, 173, 0.85)",
                    fontWeight: "600", letterSpacing: 0.2,
                }}>{label}</Text>
            </View>
        </Animated.View>
    );
};
