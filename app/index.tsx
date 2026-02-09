import React, { useRef } from 'react';
import { View, ScrollView, Animated, Dimensions, Platform, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeroSection from '@/components/landing/HeroSection';
import StatsSection from '@/components/landing/StatsSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import ArtistShowcase from '@/components/landing/ArtistShowcase';
import QuoteSection from '@/components/landing/QuoteSection';
import CategoryMarquee from '@/components/landing/CategoryMarquee';
import CTASection from '@/components/landing/CTASection';

import AppScrollView from '@/components/AppScrollView';

// Landing page sections (matching final-landing.tsx)


const isWeb = Platform.OS === 'web';

export default function LandingScreen() {
    const scrollY = useRef(new Animated.Value(0)).current;
    const { height, width } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    // Use regular ScrollView on web for better performance
    const ScrollComponent = isWeb ? ScrollView : Animated.ScrollView;

    return (
        <>
            <StatusBar style="light" />

            <View
                className="flex-1"
                style={{
                    backgroundColor: '#000',
                    overflow: 'hidden',
                }}
            >
                {/* Noise texture overlay (web only) */}
                {isWeb && (
                    <View
                        style={{
                            position: 'fixed' as any,
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            pointerEvents: 'none',
                            opacity: 0.03,
                            zIndex: 100,
                            backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')",
                        } as any}
                    />
                )}

                <AppScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    onScroll={
                        isWeb
                            ? undefined
                            : Animated.event(
                                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                                { useNativeDriver: true }
                            )
                    }
                    scrollEventThrottle={16}
                    // Smooth scrolling props
                    decelerationRate={isWeb ? undefined : 'normal'}
                    snapToAlignment="start"
                    style={isWeb ? { scrollBehavior: 'smooth' } as any : undefined}
                    // iOS-specific smooth scrolling
                    bounces={true}
                    alwaysBounceVertical={true}
                    // Android momentum scrolling
                    overScrollMode="always"
                >
                    {/* Landing Page Navbar */}
                    {/* <LandingNavbar /> */}

                    {/* 1. Hero Section - "THE STAGE IS REVOLUTIONIZED" */}
                    <HeroSection scrollY={scrollY} />

                    {/* 2. Market Stats - $3.8B, $7B, 26M */}
                    <StatsSection />

                    {/* 3. Features - Professionalizing the Passion */}
                    <FeaturesSection />

                    {/* 4. Artist Marquee - Rising Stars Live */}
                    <ArtistShowcase scrollY={scrollY} />

                    {/* 5. Quote Section - The NETSA Manifesto */}
                    <QuoteSection />

                    {/* 6. Category Marquee - DANCE, MUSIC, THEATER, MODELING */}
                    <CategoryMarquee />

                    {/* 7. CTA Section - Ready to take center stage? */}
                    <CTASection />

                    {/* 8. Footer */}
                    {/* <Footer /> */}
                </AppScrollView >
            </View>
        </>
    );
}