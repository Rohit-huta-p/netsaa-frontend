// src/components/auth/RegistrationHeader.tsx
import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Users, Sparkles } from "lucide-react-native";
import { THEME_COLORS } from "@/hooks/useThemeColors";

interface RegistrationHeaderProps {
    selectedRole: 'artist' | 'organizer';
    primaryAccent: string;
}

/** Header with live badge and headline */
export const RegistrationHeader = ({ selectedRole, primaryAccent }: RegistrationHeaderProps) => {
    const gradientColors = (selectedRole === 'artist'
        ? THEME_COLORS.artist.secondary.colors
        : [THEME_COLORS.organizer.primary.colors[0], THEME_COLORS.organizer.primary.colors[2]]) as readonly [string, string, ...string[]];

    return (
        <>
            {/* Live indicator badge */}
            <View className="flex-row items-center justify-center mb-4">
                <LinearGradient
                    colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="flex-row items-center px-4 py-2 rounded-full"
                    style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                >
                    <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#22c55e' }} />
                    <Users size={14} color={primaryAccent} style={{ marginRight: 6 }} />
                    <Text className="text-xs font-medium text-netsa-text-muted">
                        10K+ artists already here
                    </Text>
                </LinearGradient>
            </View>

            {/* Headline */}
            <View className="mb-6 items-center">
                <Text className="text-4xl font-black text-white tracking-tight leading-tight text-center">
                    Join the
                </Text>
                <View className="flex-row items-center mt-1">
                    <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="px-5 py-2 rounded-2xl"
                        style={{
                            shadowColor: primaryAccent,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.4,
                            shadowRadius: 12,
                            elevation: 8,
                        }}
                    >
                        <Text className="text-4xl font-black text-white">
                            {selectedRole === 'artist' ? "Stage" : "Scene"}
                        </Text>
                    </LinearGradient>
                    <Sparkles size={28} color="#fbbf24" style={{ marginLeft: 10 }} />
                </View>
                <Text className="text-gray-400 text-base mt-4 font-medium text-center px-4">
                    Create your profile and get discovered by top venues
                </Text>
            </View>
        </>
    );
};
