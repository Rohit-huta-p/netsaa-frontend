import React, { useEffect, useRef } from 'react';
import { View, ScrollView, Animated, Dimensions } from 'react-native';

import { StatusBar } from 'expo-status-bar';
import Footer from '@/components/Footer';
import FloatingParticles from '@/components/ui/FloatingParticles';
import HeroSection from '@/components/landing/HeroSection';
import EventsSection from '@/components/landing/EventsSection';
import CommunitySection from '@/components/landing/CommunitySection';

const { height } = Dimensions.get('window');

export default function LiveLandingPage() {
    const scrollY = useRef(new Animated.Value(0)).current;

    return (
        <>
            <StatusBar style="light" />
            <View className="flex-1 bg-[#0a0a0f]">
                {/* Animated Background Particles */}
                <FloatingParticles />

                <Animated.ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )}
                    scrollEventThrottle={16}
                >
                    <HeroSection scrollY={scrollY} />
                    <EventsSection scrollY={scrollY} />
                    <CommunitySection scrollY={scrollY} />
                    <Footer />
                </Animated.ScrollView>
            </View>
        </>
    );
}