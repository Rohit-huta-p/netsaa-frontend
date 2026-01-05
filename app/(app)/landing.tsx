// Path: app/landing.tsx
// Landing screen — responsive cards: 2 columns on mobile, 3 on tablet
import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, useWindowDimensions, StyleSheet, DimensionValue } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Navbar from "@/components/Navbar"; // make sure this exists as earlier suggested
import { HeroSection } from "@/components/landing/HeroSection";
import { EventsSection } from "@/components/landing/EventsSection";
import { CommunitySection } from "@/components/landing/CommunitySection";
import { StatsSection } from "@/components/landing/StatsSection";
import AppScrollView from "@/components/AppScrollView";

// Reusable GradientButton to avoid using invalid 'background' on View styles
function GradientButton({
    children,
    onPress,
    style,
}: {
    children: React.ReactNode;
    onPress?: () => void;
    style?: any;
}) {
    return (
        <LinearGradient
            colors={["#FB7185", "#FB923C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[{ borderRadius: 999, overflow: "hidden" }, style]}
        >
            <Pressable onPress={onPress} android_ripple={{ color: "rgba(255,255,255,0.1)" }} style={{ paddingVertical: 10, alignItems: "center" }}>
                {children}
            </Pressable>
        </LinearGradient>
    );
}

export default function LandingScreen() {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    // Decide columns: phone -> 2, tablet/large -> 3
    const columns = useMemo(() => (width >= 768 ? 3 : 2), [width]);



    return (
        <View style={{ flex: 1 }}>
            <AppScrollView className="bg-gray-50">
                <HeroSection />
                <EventsSection />
                <CommunitySection />
                <StatsSection />
            </AppScrollView>
        </View>
    );
}
