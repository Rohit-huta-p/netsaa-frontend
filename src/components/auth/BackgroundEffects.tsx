// src/components/auth/BackgroundEffects.tsx
import React from "react";
import { View, Dimensions, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Music, Star, Sparkles, Zap } from "lucide-react-native";
import { THEME_COLORS } from "@/hooks/useThemeColors";
import { FloatingNote } from "./FloatingNote";
import { GlowOrb } from "./GlowOrb";

const { width } = Dimensions.get("window");

interface BackgroundEffectsProps {
    primaryAccent: string;
    spotlightColors: readonly [string, string, string];
    screenHeight: number;
}

/** All background decorations: gradient, orbs, spotlights, floating notes */
export const BackgroundEffects = ({
    primaryAccent,
    spotlightColors,
    screenHeight
}: BackgroundEffectsProps) => (
    <>
        {/* Deep dark gradient background */}
        <LinearGradient
            colors={['#0a0510', '#1a0b2e', '#0f0a1a', '#0a0a0f'] as const}
            locations={[0, 0.3, 0.7, 1]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {/* Floating musical elements */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
            <FloatingNote delay={0} icon={Music} color={THEME_COLORS.artist.secondary.colors[1]} />
            <FloatingNote delay={2000} icon={Star} color={THEME_COLORS.cta.colors[1]} />
            <FloatingNote delay={4000} icon={Sparkles} color={THEME_COLORS.artist.primary.colors[1]} />
            <FloatingNote delay={6000} icon={Zap} color={THEME_COLORS.organizer.primary.colors[1]} />
            <FloatingNote delay={8000} icon={Music} color={THEME_COLORS.artist.secondary.colors[0]} />
        </View>

        {/* Spotlight Effect from top */}
        <View
            style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                marginLeft: -width * 0.75,
                width: width * 1.5,
                height: screenHeight * 0.5,
            }}
        >
            <LinearGradient
                colors={spotlightColors}
                locations={[0, 0.4, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{
                    width: '100%',
                    height: '100%',
                    borderBottomLeftRadius: width,
                    borderBottomRightRadius: width,
                }}
            />
        </View>

        {/* Glow Orbs */}
        <GlowOrb color={primaryAccent} size={280} top={-70} left={-70} blur={80} />
        <GlowOrb color={THEME_COLORS.artist.primary.colors[1]} size={220} top={screenHeight * 0.35} left="right" blur={60} />
        <GlowOrb color={THEME_COLORS.artist.primary.colors[0]} size={160} top={screenHeight * 0.65} left={-30} blur={50} />

        {/* Stage light beams */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: screenHeight * 0.35 }} pointerEvents="none">
            {[...Array(5)].map((_, i) => (
                <View
                    key={i}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: `${15 + i * 18}%`,
                        width: 1,
                        height: '60%',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        transform: [{ rotate: `${-15 + i * 8}deg` }],
                    }}
                />
            ))}
        </View>

        {/* Decorative rings */}
        <View
            style={{
                position: 'absolute',
                top: screenHeight * 0.08,
                right: -50,
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 1,
                borderColor: `${primaryAccent}33`,
            }}
        />
        <View
            style={{
                position: 'absolute',
                bottom: screenHeight * 0.12,
                left: -35,
                width: 90,
                height: 90,
                borderRadius: 45,
                borderWidth: 1,
                borderColor: `${THEME_COLORS.artist.primary.colors[1]}33`,
            }}
        />
    </>
);
