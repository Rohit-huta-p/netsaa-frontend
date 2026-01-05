import React from "react";
import { View, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HeroSection } from "@/components/landing/HeroSection";
import { EventsSection } from "@/components/landing/EventsSection";
import { CommunitySection } from "@/components/landing/CommunitySection";
import { StatsSection } from "@/components/landing/StatsSection";
import AppScrollView from "@/components/AppScrollView";
import useAuthStore from "@/stores/authStore";
import { Redirect } from "expo-router";

export default function LandingScreen() {
    const { accessToken, isHydrated, user } = useAuthStore();

    // 1. Wait for hydration
    if (!isHydrated) {
        return null; // Or a splash screen component
    }

    // 2. If Logged In -> Redirect based on Role
    if (accessToken) {
        if (user?.roles?.includes("organizer")) {
            return <Redirect href="/dashboard" />;
        } else {
            return <Redirect href="/gigs" />;
        }
    }

    // 3. If Not Logged In -> Render Landing Page
    return (
        <View className="flex-1 bg-[#09090b]">
            <StatusBar barStyle="light-content" />
            {/* Ambient Background Glow */}
            <LinearGradient
                colors={["#4c1d95", "#09090b"]} // Deep purple to black
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.4 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%' }}
            />

            <AppScrollView>
                <HeroSection />
                <StatsSection />
                {/* Moved Stats up to be a "ticker" below hero */}
                <EventsSection />
                <CommunitySection />
                <View className="h-24" /> {/* Bottom spacer */}
            </AppScrollView>
        </View>
    );
}