import React, { useRef, useCallback, useEffect } from 'react';
import { View, Animated, Platform, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Existing sections ──
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import ArtistShowcase from '@/components/landing/ArtistShowcase';
import QuoteSection from '@/components/landing/QuoteSection';
import CategoryMarquee from '@/components/landing/CategoryMarquee';
import CTASection from '@/components/landing/CTASection';
import ParallaxSection from '@/components/landing/ParallaxSection';
import Footer from '@/components/Footer';

// ── New sections (content reference doc) ──
import ProblemSection from '@/components/landing/ProblemSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import OrganizerSection from '@/components/landing/OrganizerSection';
import TrustSection from '@/components/landing/TrustSection';

const isWeb = Platform.OS === 'web';

export default function LandingScreen() {
    const scrollY = useRef(new Animated.Value(0)).current;
    const insets = useSafeAreaInsets();

    // Web: manual scroll handler (useNativeDriver not supported on web)
    const handleWebScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollY.setValue(e.nativeEvent.contentOffset.y);
    }, [scrollY]);

    // Inject smooth scrollbar CSS on web
    useEffect(() => {
        if (isWeb && typeof document !== 'undefined') {
            const styleId = 'landing-global-styles';
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = `
                    * { scroll-behavior: smooth; }
                    ::-webkit-scrollbar { width: 6px; }
                    ::-webkit-scrollbar-track { background: transparent; }
                    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
                    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
                `;
                document.head.appendChild(style);
            }
        }
    }, []);

    return (
        <>
            <StatusBar style="light" />

            <View style={{ flex: 1, backgroundColor: '#000', overflow: 'hidden' }}>

                <Animated.ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    onScroll={
                        isWeb
                            ? handleWebScroll
                            : Animated.event(
                                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                                { useNativeDriver: true }
                            )
                    }
                    scrollEventThrottle={16}
                    bounces={true}
                    alwaysBounceVertical={true}
                    overScrollMode="always"
                    keyboardShouldPersistTaps="handled"
                >

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* SECTION 1 — HERO                                        */}
                    {/* Aspiration + FOMO — "This is MY platform"              */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    <HeroSection scrollY={scrollY} sectionIndex={0} />

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* SECTION 2 — PROBLEM AGITATION                          */}
                    {/* Pain recognition — "They GET my struggle"              */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    <ProblemSection scrollY={scrollY} sectionIndex={1} />

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* SECTION 3 — SOLUTION / FEATURES                        */}
                    {/* Relief + Hope — "There IS a solution"                  */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    <ParallaxSection
                        scrollY={scrollY}
                        sectionIndex={2}
                        bgColor="#000"
                        blendEdges
                        blendTopColor="#050505"
                        blendBottomColor="#000"
                    >
                        <FeaturesSection scrollY={scrollY} sectionIndex={2} />
                    </ParallaxSection>

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* SECTION 4 — SOCIAL PROOF                               */}
                    {/* Trust + Belonging — "If it worked for them..."         */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    <TestimonialsSection scrollY={scrollY} sectionIndex={3} />

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* SECTION 4b — ARTIST SHOWCASE (human faces)             */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    <ParallaxSection
                        scrollY={scrollY}
                        sectionIndex={4}
                        bgColor="#000"
                        blendEdges
                        blendTopColor="#09090b"
                        blendBottomColor="#000"
                    >
                        <ArtistShowcase scrollY={scrollY} sectionIndex={4} />
                    </ParallaxSection>

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* SECTION 5 — HOW IT WORKS                               */}
                    {/* Achievability — "I can DO this in 3 steps"             */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    <HowItWorksSection scrollY={scrollY} sectionIndex={5} />

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* SECTION 6 — ORGANIZER VALUE PROP                       */}
                    {/* Efficiency — "This saves me TIME"                      */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    <OrganizerSection scrollY={scrollY} sectionIndex={6} />

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* SECTION 7 — TRUST & SECURITY                           */}
                    {/* Security — "My money is SAFE here"                     */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    <TrustSection scrollY={scrollY} sectionIndex={7} />

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* MANIFESTO QUOTE — Emotional Peak                       */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    <QuoteSection scrollY={scrollY} sectionIndex={8} />

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* SECTION 8 — CATEGORIES                                 */}
                    {/* Inclusivity — "My art form is HERE"                    */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    <ParallaxSection
                        scrollY={scrollY}
                        sectionIndex={9}
                        bgColor="#000"
                    >
                        <CategoryMarquee scrollY={scrollY} sectionIndex={9} />
                    </ParallaxSection>

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* SECTION 10 — FINAL CTA                                 */}
                    {/* Commitment — "If I don't act NOW, I'll regret it"      */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    <ParallaxSection
                        scrollY={scrollY}
                        sectionIndex={10}
                        bgColor="#000"
                        blendEdges
                        blendTopColor="#000"
                        blendBottomColor="#09090b"
                    >
                        <CTASection scrollY={scrollY} sectionIndex={10} />
                    </ParallaxSection>

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* SECTION 11 — FOOTER                                    */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    <Footer />

                </Animated.ScrollView>
            </View>
        </>
    );
}