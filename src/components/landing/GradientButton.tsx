// File: netsa-mobile/src/components/landing/GradientButton.tsx
import React from 'react';
import { Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';


type Props = {
    children: React.ReactNode;
    onPress?: () => void;
    style?: any;
};


export default function GradientButton({ children, onPress, style }: Props) {
    return (
        <LinearGradient
            colors={["#FB7185", "#FB923C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[{ borderRadius: 999, overflow: 'hidden' }, style]}
        >
            <Pressable onPress={onPress} android_ripple={{ color: 'rgba(255,255,255,0.1)' }} style={{ paddingVertical: 10, alignItems: 'center' }}>
                {children}
            </Pressable>
        </LinearGradient>
    );
}

