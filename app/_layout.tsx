// app/_layout.tsx
import "../global.css";
import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Slot, SplashScreen } from "expo-router";
import { View } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/lib/react-query';
import {
    useFonts,
    Outfit_100Thin,
    Outfit_200ExtraLight,
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
} from '@expo-google-fonts/outfit';
import {
    SourceSans3_200ExtraLight,
    SourceSans3_300Light,
    SourceSans3_400Regular,
    SourceSans3_500Medium,
    SourceSans3_600SemiBold,
    SourceSans3_700Bold,
    SourceSans3_800ExtraBold,
    SourceSans3_900Black,
} from '@expo-google-fonts/source-sans-3';

import Navbar from "../src/components/Navbar";
import Footer from "../src/components/Footer";
import MobileTabBar from "../src/components/MobileTabBar";

import useAuthStore from "@/stores/authStore";
import { socketService } from "../src/services/socketService";
import { deepLinkService } from "../src/services/deepLinkService";
import { notificationService } from "../src/services/notificationService";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

/**
 * Global app layout that shows Navbar + Slot + Footer.
 * To hide the Navbar/Footer for a route, create a nested layout (example below).
 */
export default function RootLayout() {
    const { isHydrated, accessToken } = useAuthStore();
    const [fontsLoaded, fontError] = useFonts({
        // Outfit fonts (primary heading/display font)
        'Outfit-Thin': Outfit_100Thin,
        'Outfit-ExtraLight': Outfit_200ExtraLight,
        'Outfit-Light': Outfit_300Light,
        'Outfit-Regular': Outfit_400Regular,
        'Outfit-Medium': Outfit_500Medium,
        'Outfit-SemiBold': Outfit_600SemiBold,
        'Outfit-Bold': Outfit_700Bold,
        'Outfit-ExtraBold': Outfit_800ExtraBold,
        'Outfit-Black': Outfit_900Black,

        // Source Sans 3 (body/secondary font)
        'SourceSans3-ExtraLight': SourceSans3_200ExtraLight,
        'SourceSans3-Light': SourceSans3_300Light,
        'SourceSans3-Regular': SourceSans3_400Regular,
        'SourceSans3-Medium': SourceSans3_500Medium,
        'SourceSans3-SemiBold': SourceSans3_600SemiBold,
        'SourceSans3-Bold': SourceSans3_700Bold,
        'SourceSans3-ExtraBold': SourceSans3_800ExtraBold,
        'SourceSans3-Black': SourceSans3_900Black,
    });

    useEffect(() => {
        if ((fontsLoaded || fontError) && isHydrated) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError, isHydrated]);

    useEffect(() => {
        if (accessToken) {
            socketService.connect(accessToken);
        } else {
            socketService.disconnect();
        }
    }, [accessToken]);

    // Initialize deep link and notification services
    useEffect(() => {
        deepLinkService.initialize();
        notificationService.initialize();

        return () => {
            notificationService.cleanup();
        };
    }, []);

    // Process pending deep links after auth hydration
    useEffect(() => {
        if (isHydrated) {
            console.log('[RootLayout] Auth hydrated, processing pending navigation');
            deepLinkService.processPendingNavigation();
        }
    }, [isHydrated]);

    if (!fontsLoaded && !fontError) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <SafeAreaProvider>
                    <View style={{ flex: 1 }}>
                        {/* Default Navbar (not transparent) - individual screens can render their own or use a nested layout */}
                        <Navbar />

                        {/* App content */}
                        <Slot />

                        {/* Mobile bottom tab bar - only visible on mobile */}
                        <MobileTabBar />
                    </View>
                </SafeAreaProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
