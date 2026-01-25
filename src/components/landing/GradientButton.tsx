import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientButtonProps extends TouchableOpacityProps {
    title: string;
    colors?: readonly [string, string, ...string[]];
    textClassName?: string;
    gradientClassName?: string;
}

export default function GradientButton({
    title,
    colors = ['#ff006e', '#ff4d94'],
    textClassName = 'text-white font-semibold text-center',
    gradientClassName = 'px-8 py-3 rounded-full',
    ...props
}: GradientButtonProps) {
    return (
        <TouchableOpacity {...props}>
            <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className={gradientClassName}
            >
                <Text className={textClassName}>{title}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );
}