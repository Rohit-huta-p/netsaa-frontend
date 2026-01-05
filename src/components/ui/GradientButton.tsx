import React from "react";
import { Text, Pressable, ViewStyle, StyleProp, TextStyle, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { twMerge } from "tailwind-merge";

interface GradientButtonProps {
    children?: React.ReactNode;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    className?: string;
    colors?: readonly [string, string, ...string[]];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    disabled?: boolean;
    loading?: boolean;
    textClassName?: string;
    label?: string;
}

export function GradientButton({
    children,
    onPress,
    style,
    className,
    colors = ["#E63B45", "#FF4E8A", "#FF7A2F"], // Gradient 1: Action (#E63B45 -> #FF4E8A -> #FF7A2F)
    start = { x: 0, y: 0 },
    end = { x: 1, y: 0 },
    disabled = false,
    loading = false,
    textClassName,
    label,
}: GradientButtonProps) {
    return (
        <LinearGradient
            colors={colors}
            start={start}
            end={end}
            style={[
                { borderRadius: 9999, overflow: "hidden", opacity: disabled ? 0.7 : 1 },
                style,
            ]}
            className={twMerge("w-full", className)}
        >
            <Pressable
                onPress={onPress}
                disabled={disabled || loading}
                android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                className="py-4 px-6 items-center justify-center flex-row gap-2"
            >
                {loading ? (
                    <ActivityIndicator color="white" size="small" />
                ) : (
                    <>
                        {label ? (
                            <Text className={twMerge("text-white font-satoshi-semibold text-base text-center", textClassName)}>
                                {label}
                            </Text>
                        ) : (
                            children
                        )}
                    </>
                )}
            </Pressable>
        </LinearGradient>
    );
}
