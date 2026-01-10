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
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
    Inter_400Regular,
    Inter_500Medium,
} from '@expo-google-fonts/inter';

import Navbar from "../src/components/Navbar";
import Footer from "../src/components/Footer";

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
        // Satoshi (Manrope as alternative)
        'Satoshi-Regular': Manrope_400Regular,
        'Satoshi-Medium': Manrope_500Medium,
        'Satoshi-SemiBold': Manrope_600SemiBold,
        'Satoshi-Bold': Manrope_700Bold,
        'Satoshi-Black': Manrope_800ExtraBold,

        // Inter
        'Inter-Regular': Inter_400Regular,
        'Inter-Medium': Inter_500Medium,
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
                <SafeAreaProvider >

                    {/* Default Navbar (not transparent) - individual screens can render their own or use a nested layout */}
                    <Navbar />

                    {/* App content */}

                    <Slot />


                </SafeAreaProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
