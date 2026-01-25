// src/components/auth/RoleCard.tsx
import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles } from "lucide-react-native";
import { THEME_COLORS } from "@/hooks/useThemeColors";
import { RoleCardColors } from "@/schemas/register.schema";

const isWeb = Platform.OS === "web";

interface RoleCardProps {
    role: string;
    selected: boolean;
    onPress: () => void;
    icon: any;
    title: string;
    subtitle: string;
    colors: RoleCardColors;
}

/** Animated role card with bounce/glow effect */
export const RoleCard = ({
    role,
    selected,
    onPress,
    icon: Icon,
    title,
    subtitle,
    colors,
}: RoleCardProps) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animations = [
            Animated.spring(scaleAnim, {
                toValue: selected ? 1.02 : 1,
                friction: 3,
                tension: 100,
                useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
                toValue: selected ? 1 : 0,
                duration: 300,
                useNativeDriver: false,
            }),
        ];
        Animated.parallel(animations).start();
    }, [selected]);

    const gradientColors = (role === 'artist'
        ? [THEME_COLORS.artist.secondary.colors[0], THEME_COLORS.artist.secondary.colors[1]]
        : [THEME_COLORS.organizer.primary.colors[0], THEME_COLORS.organizer.primary.colors[2]]) as readonly [string, string, ...string[]];

    return (
        <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={{ flex: 1 }}>
            <Animated.View
                style={[
                    {
                        padding: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 24,
                        backgroundColor: selected ? colors.bg : 'rgba(172, 29, 29, 0.05)',
                        borderWidth: 2,
                        borderColor: selected ? colors.border : 'rgba(255,255,255,0.1)',
                        transform: [{ scale: scaleAnim }],
                    },
                    !isWeb && selected && {
                        shadowColor: colors.border,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.5,
                        shadowRadius: 20,
                        // elevation: 10,
                    },
                ]}
            >
                {/* Gradient border glow when selected */}
                {selected && (
                    <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            position: 'absolute',
                            top: -2, left: -2, right: -2, bottom: -2,
                            borderRadius: 26,
                            opacity: 0.3,
                        }}
                    />
                )}

                {/* Icon container */}
                <View
                    style={{
                        width: 46,
                        height: 46,
                        borderRadius: 28,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 12,
                        backgroundColor: selected ? colors.iconBg : 'rgba(255,255,255,0.1)',
                    }}
                >
                    {selected ? (
                        <LinearGradient
                            colors={(role === 'artist' ? THEME_COLORS.artist.secondary.colors : gradientColors) as readonly [string, string, ...string[]]}
                            // start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                                width: 46,
                                height: 46,
                                borderRadius: 28,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon size={24} color="#fff" />
                        </LinearGradient>
                    ) : (
                        <Icon size={24} color="#fff" />
                    )}
                </View>

                <Text className="text-white font-bold text-lg mb-1">{title}</Text>
                <Text className="text-gray-500 text-xs text-center">{subtitle}</Text>

                {/* Selected checkmark
                {selected && (
                    <View
                        style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: colors.iconBg,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Sparkles size={14} color="#fff" />
                    </View>
                )} */}
            </Animated.View>
        </TouchableOpacity>
    );
};
