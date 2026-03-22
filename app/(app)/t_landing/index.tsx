import React, { useEffect, useRef } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    Animated, Dimensions, Platform, StyleSheet,
    useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

/* ──────────────────────────── COLOUR PALETTE ──────────────────────────── */
const C = {
    bg: '#0C0A09',
    bgDark: '#080706',
    bgCard: '#1A1816',
    bgCardLight: '#252220',
    coral: '#E8613A',
    coralDark: '#D4532E',
    coralLight: '#F07A58',
    white: '#FFFFFF',
    offWhite: '#F5F0EB',
    textPrimary: '#F5F0EB',
    textSecondary: '#9A9490',
    textTertiary: '#6B6560',
    border: 'rgba(255,255,255,0.08)',
    borderLight: 'rgba(255,255,255,0.05)',
    quoteBg: '#F5F0EB',
    quoteText: '#1A1816',
};

/* ──────────────────────────── FONTS ──────────────────────────── */
const F = {
    heading: 'Outfit-Bold',
    headingBlack: 'Outfit-Black',
    headingMedium: 'Outfit-Medium',
    headingSemiBold: 'Outfit-SemiBold',
    headingExtraBold: 'Outfit-ExtraBold',
    body: 'SourceSans3-Regular',
    bodyMedium: 'SourceSans3-Medium',
    bodySemiBold: 'SourceSans3-SemiBold',
    bodyBold: 'SourceSans3-Bold',
};

/* ──────────────────────────── SCROLL REVEAL ──────────────────────────── */
const useReveal = (delay = 0) => {

    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(30)).current;
    const triggered = useRef(false);

    const onLayout = () => {
        if (triggered.current) return;
        triggered.current = true;
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 700, delay, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, damping: 18, stiffness: 100, delay, useNativeDriver: true }),
        ]).start();
    };

    return { style: { opacity, transform: [{ translateY }] }, onLayout };
};

/* ──────────────────────────── DATA ──────────────────────────── */
const ARTISTS = [
    { name: 'Sagar Bora', place: 'Pune', initials: 'SB', color: '#3A3A3A' },
    { name: 'Name', place: 'Place', initials: 'NP', color: '#4A3A30' },
    { name: 'Name', place: 'Dancer', initials: 'ND', color: '#6A3020' },
    { name: 'Name', place: 'Dancer\nPlace', initials: 'ND', color: '#5A2A18' },
];

const OPPORTUNITIES = [
    { category: 'PERFORMANCE', title: 'Live Music Performance', desc: 'Explore this opportunity and connect with creators worldwide.', color: C.coral },
    { category: 'WORKSHOP', title: 'Experimental Photography', desc: 'Explore this opportunity and connect with creators worldwide.', color: '#B8860B' },
    { category: 'JOB', title: 'Motion Graphics Artist', desc: 'Explore this opportunity and connect with creators worldwide.', color: '#4A90D9' },
    { category: 'COLLABORATION', title: 'Short Film Project', desc: 'Explore this opportunity and connect with creators worldwide.', color: '#6B8E4E' },
];

const TESTIMONIALS = [
    { quote: '"NETSA helped me connect with filmmakers across the world and land my first international project."', name: 'Name', type: 'Artist Type' },
    { quote: '"I found three collaborative projects in my first week. The community here is incredibly supportive."', name: 'Name', type: 'Artist Type' },
    { quote: '"The opportunities on NETSAA are real. I\'ve worked with amazing artists I never would have met otherwise."', name: 'Name', type: 'Artist Type' },
    { quote: '"This platform understands what artists need - genuine connections, not just networking."', name: 'Name', type: 'Artist Type' },
];

/* ──────────────────────────── MAIN COMPONENT ──────────────────────────── */
export default function TLandingPage() {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    const router = useRouter();
    const heroAnim = useRef(new Animated.Value(0)).current;
    const communityReveal = useReveal(200);
    const opportunitiesReveal = useReveal(200);
    const quoteReveal = useReveal();
    const voicesReveal = useReveal(200);
    const ctaReveal = useReveal(200);

    useEffect(() => {
        Animated.timing(heroAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    }, []);

    const contentMaxW = isWeb && SCREEN_WIDTH > 900 ? 1200 : SCREEN_WIDTH;
    const px = isWeb ? 48 : 20;

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

                {/* ═══════════════════════════════════════════════════════
                    SECTION 1 — HERO
                ═══════════════════════════════════════════════════════ */}
                <View style={{ minHeight: isWeb ? 550 : 480, position: 'relative', overflow: 'hidden' }}>
                    {/* Radial glow backgrounds */}
                    <View style={{
                        position: 'absolute', top: -100, left: '20%' as any, width: 500, height: 500,
                        borderRadius: 250, backgroundColor: 'rgba(232,97,58,0.15)',
                        ...(isWeb ? { filter: 'blur(120px)' } as any : {}),
                    }} />
                    <View style={{
                        position: 'absolute', top: -60, right: '10%' as any, width: 400, height: 400,
                        borderRadius: 200, backgroundColor: 'rgba(200,60,30,0.12)',
                        ...(isWeb ? { filter: 'blur(100px)' } as any : {}),
                    }} />
                    <View style={{
                        position: 'absolute', top: 50, left: '50%' as any, width: 300, height: 300,
                        borderRadius: 150, backgroundColor: 'rgba(232,97,58,0.08)',
                        ...(isWeb ? { filter: 'blur(80px)' } as any : {}),
                    }} />

                    {/* <Navbar /> */}

                    {/* Hero Content */}
                    <Animated.View style={{
                        flex: 1, alignItems: 'center', justifyContent: 'center',
                        paddingHorizontal: px, paddingTop: isWeb ? 60 : 40, paddingBottom: 60,
                        opacity: heroAnim,
                        transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
                    }}>
                        <Text style={{
                            color: C.textPrimary, fontFamily: F.headingMedium, textAlign: 'center',
                            fontSize: isWeb ? 22 : 16, letterSpacing: 2, textTransform: 'uppercase',
                            marginBottom: 8,
                        }}>
                            THE STAGE IS
                        </Text>
                        <Text style={{
                            color: C.coral, fontFamily: F.headingBlack, textAlign: 'center',
                            fontSize: isWeb ? (SCREEN_WIDTH > 1024 ? 90 : 64) : 42,
                            lineHeight: isWeb ? (SCREEN_WIDTH > 1024 ? 96 : 70) : 46,
                            letterSpacing: -2, textTransform: 'uppercase',
                        }}>
                            REVOLUTIONIZED
                        </Text>

                        <Text style={{
                            color: C.textSecondary, fontFamily: F.body, textAlign: 'center',
                            fontSize: isWeb ? 16 : 13, lineHeight: isWeb ? 24 : 20,
                            maxWidth: 560, marginTop: 20, marginBottom: 28,
                        }}>
                            Empowering India's performing artists with a transparent, direct, and professional ecosystem. No more WhatsApp calls, just your talent.
                        </Text>

                        {/* CTAs */}
                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
                            <TouchableOpacity
                                onPress={() => router.push('/auth')}
                                style={{
                                    backgroundColor: C.coral, borderRadius: 24,
                                    paddingHorizontal: 24, paddingVertical: 12,
                                }}
                            >
                                <Text style={{ color: C.white, fontFamily: F.bodySemiBold, fontSize: 14 }}>Join Netsa</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{
                                borderWidth: 1, borderColor: C.textTertiary, borderRadius: 24,
                                paddingHorizontal: 24, paddingVertical: 12,
                            }}>
                                <Text style={{ color: C.textPrimary, fontFamily: F.bodyMedium, fontSize: 14 }}>Explore Gigs</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Avatar row */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ flexDirection: 'row' }}>
                                {['#C87941', '#8B6E5A', '#A0522D', '#6B4423'].map((bg, i) => (
                                    <View key={i} style={{
                                        width: 28, height: 28, borderRadius: 14,
                                        backgroundColor: bg, borderWidth: 2, borderColor: C.bg,
                                        marginLeft: i === 0 ? 0 : -8,
                                        alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Text style={{ color: C.white, fontSize: 9, fontFamily: F.bodySemiBold }}>
                                            {['A', 'B', 'C', 'D'][i]}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                            <Text style={{ color: C.textSecondary, fontFamily: F.body, fontSize: 12 }}>
                                2000+ Aspiring Artists in India
                            </Text>
                        </View>
                    </Animated.View>
                </View>

                {/* ═══════════════════════════════════════════════════════
                    SECTION 2 — THE CREATIVE COMMUNITY
                ═══════════════════════════════════════════════════════ */}
                <Animated.View
                    style={[{ paddingTop: 80, paddingBottom: 60, paddingHorizontal: px }, communityReveal.style]}
                    onLayout={communityReveal.onLayout}
                >
                    <View style={{ maxWidth: contentMaxW, alignSelf: 'center' as any, width: '100%' as any }}>
                        <Text style={{
                            fontFamily: F.heading, fontSize: isWeb ? 42 : 30, color: C.textPrimary,
                            marginBottom: 4,
                        }}>
                            The{' '}
                            <Text style={{ fontStyle: 'italic', color: C.coral }}>Creative</Text>
                        </Text>
                        <Text style={{
                            fontFamily: F.heading, fontSize: isWeb ? 42 : 30, color: C.textPrimary,
                            marginBottom: 12,
                        }}>
                            Community
                        </Text>
                        <Text style={{
                            fontFamily: F.body, fontSize: 14, color: C.textSecondary,
                            marginBottom: 32, maxWidth: 400,
                        }}>
                            Meet artists from every discipline, building and{'\n'}sharing across the globe.
                        </Text>

                        {/* Artist Cards */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                        >
                            {ARTISTS.map((artist, i) => (
                                <View key={i} style={{
                                    width: isWeb ? 180 : 150, height: isWeb ? 240 : 200,
                                    borderRadius: 16, overflow: 'hidden',
                                    backgroundColor: artist.color,
                                    position: 'relative',
                                }}>
                                    {/* Placeholder for artist image */}
                                    <View style={{
                                        flex: 1, alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Text style={{
                                            color: 'rgba(255,255,255,0.2)', fontSize: 48,
                                            fontFamily: F.headingBlack,
                                        }}>
                                            {artist.initials}
                                        </Text>
                                    </View>
                                    {/* Name overlay */}
                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                                        style={{
                                            position: 'absolute', bottom: 0, left: 0, right: 0,
                                            padding: 12, paddingTop: 30,
                                        }}
                                    >
                                        <Text style={{
                                            color: C.white, fontFamily: F.bodySemiBold, fontSize: 14,
                                        }}>
                                            {artist.name}
                                        </Text>
                                        <Text style={{
                                            color: C.textSecondary, fontFamily: F.body, fontSize: 11,
                                        }}>
                                            {artist.place}
                                        </Text>
                                    </LinearGradient>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </Animated.View>

                {/* ═══════════════════════════════════════════════════════
                    SECTION 3 — DISCOVER OPPORTUNITIES
                ═══════════════════════════════════════════════════════ */}
                <Animated.View
                    style={[{ paddingTop: 40, paddingBottom: 80, paddingHorizontal: px }, opportunitiesReveal.style]}
                    onLayout={opportunitiesReveal.onLayout}
                >
                    <View style={{ maxWidth: contentMaxW, alignSelf: 'center' as any, width: '100%' as any }}>
                        {/* Header */}
                        <View style={{ alignItems: isWeb ? 'flex-end' : 'flex-start', marginBottom: 32 }}>
                            <Text style={{
                                fontFamily: F.heading, fontSize: isWeb ? 36 : 26,
                                color: C.textPrimary, textAlign: isWeb ? 'right' : 'left',
                            }}>
                                Discover
                            </Text>
                            <Text style={{
                                fontFamily: F.heading, fontSize: isWeb ? 36 : 26,
                                color: C.coral, fontStyle: 'italic',
                                textAlign: isWeb ? 'right' : 'left',
                            }}>
                                Opportunities
                            </Text>
                            <Text style={{
                                fontFamily: F.body, fontSize: 13, color: C.textSecondary,
                                textAlign: isWeb ? 'right' : 'left', marginTop: 8,
                                maxWidth: 280,
                            }}>
                                Gigs, workshops, and collaborations - all in one place.
                            </Text>
                        </View>

                        {/* Opportunity Grid */}
                        <View style={{
                            flexDirection: 'row', flexWrap: 'wrap',
                            gap: 16,
                        }}>
                            {OPPORTUNITIES.map((opp, i) => (
                                <View key={i} style={{
                                    width: isWeb && SCREEN_WIDTH > 768
                                        ? ((contentMaxW - px * 2 - 16) / 2)
                                        : '100%' as any,
                                    minWidth: isWeb ? 300 : undefined,
                                    flex: isWeb && SCREEN_WIDTH > 768 ? undefined : undefined,
                                }}>
                                    <View style={{
                                        paddingVertical: 16,
                                        borderTopWidth: 1,
                                        borderTopColor: C.border,
                                    }}>
                                        <Text style={{
                                            fontFamily: F.bodySemiBold, fontSize: 10,
                                            color: opp.color, textTransform: 'uppercase',
                                            letterSpacing: 1.2, marginBottom: 6,
                                        }}>
                                            {opp.category}
                                        </Text>
                                        <Text style={{
                                            fontFamily: F.headingSemiBold, fontSize: 16,
                                            color: C.textPrimary, marginBottom: 4,
                                        }}>
                                            {opp.title}
                                        </Text>
                                        <Text style={{
                                            fontFamily: F.body, fontSize: 12,
                                            color: C.textTertiary, lineHeight: 18,
                                        }}>
                                            {opp.desc}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                </Animated.View>

                {/* ═══════════════════════════════════════════════════════
                    SECTION 4 — QUOTE / MANIFESTO
                ═══════════════════════════════════════════════════════ */}
                <Animated.View
                    style={[quoteReveal.style]}
                    onLayout={quoteReveal.onLayout}
                >
                    <View
                        style={{
                            paddingVertical: isMobile ? 96 : isTablet ? 128 : 192,
                            backgroundColor: '#fff',
                            position: 'relative',
                        }}
                    >
                        {/* Top gradient fade from black */}
                        <LinearGradient
                            colors={['#000', 'transparent'] as const}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: isMobile ? 64 : 128,
                            }}
                        />

                        {/* Content */}
                        <View
                            style={{
                                paddingHorizontal: isMobile ? 16 : 24,
                                alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: isMobile ? 40 : isTablet ? 80 : isWeb ? 160 : 48,
                                    fontWeight: '900',
                                    color: '#000',
                                    textAlign: 'center',
                                    lineHeight: isMobile ? 44 : isTablet ? 72 : isWeb ? 140 : 52,
                                    letterSpacing: isMobile ? -1 : -3,
                                    marginBottom: isMobile ? 24 : 32,
                                }}
                            >
                                "PERFORMING ART IS{'\n'}NOT JUST A HOBBY."
                            </Text>

                            <Text
                                style={{
                                    fontSize: isMobile ? 14 : isTablet ? 18 : isWeb ? 24 : 16,
                                    fontWeight: '700',
                                    color: '#71717a',
                                    textTransform: 'uppercase',
                                    letterSpacing: isMobile ? 4 : 6,
                                    textAlign: 'center',
                                }}
                            >
                                The NETSA Manifesto
                            </Text>
                        </View>

                        {/* Bottom gradient fade to black */}
                        <LinearGradient
                            colors={['transparent', '#000'] as const}
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: isMobile ? 64 : 128,
                            }}
                        />
                    </View>
                </Animated.View>

                {/* ═══════════════════════════════════════════════════════
                    SECTION 5 — VOICES FROM THE COMMUNITY
                ═══════════════════════════════════════════════════════ */}
                <Animated.View
                    style={[{
                        paddingVertical: 80, paddingHorizontal: px,
                        backgroundColor: C.bg,
                    }, voicesReveal.style]}
                    onLayout={voicesReveal.onLayout}
                >
                    <View style={{ maxWidth: contentMaxW, alignSelf: 'center' as any, width: '100%' as any }}>
                        {/* Header */}
                        <View style={{ alignItems: 'center', marginBottom: 12 }}>
                            <Text style={{
                                fontFamily: F.heading, fontSize: isWeb ? 36 : 26,
                                color: C.textPrimary, textAlign: 'center',
                            }}>
                                Voices from the
                            </Text>
                            <Text style={{
                                fontFamily: F.heading, fontSize: isWeb ? 36 : 26,
                                color: C.coral, fontStyle: 'italic', textAlign: 'center',
                            }}>
                                Community
                            </Text>
                        </View>
                        <Text style={{
                            fontFamily: F.body, fontSize: 13, color: C.textSecondary,
                            textAlign: 'center', marginBottom: 40, maxWidth: 420,
                            alignSelf: 'center' as any,
                        }}>
                            Real stories from artists building their creative careers on NETSAA.
                        </Text>

                        {/* Testimonials Grid */}
                        <View style={{
                            flexDirection: 'row', flexWrap: 'wrap', gap: 16,
                            justifyContent: 'center',
                        }}>
                            {TESTIMONIALS.map((t, i) => (
                                <View key={i} style={{
                                    width: isWeb && SCREEN_WIDTH > 768
                                        ? ((Math.min(contentMaxW, 700) - 16) / 2)
                                        : '100%' as any,
                                    backgroundColor: C.bgCard,
                                    borderRadius: 16, padding: 20,
                                    borderWidth: 1, borderColor: C.border,
                                }}>
                                    <Text style={{
                                        fontFamily: F.body, fontSize: 13,
                                        color: C.textSecondary, lineHeight: 20,
                                        marginBottom: 16,
                                    }}>
                                        {t.quote}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <View style={{
                                            width: 32, height: 32, borderRadius: 16,
                                            backgroundColor: C.bgCardLight,
                                            alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Text style={{
                                                color: C.coral, fontSize: 12,
                                                fontFamily: F.bodySemiBold,
                                            }}>
                                                {t.name[0]}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text style={{
                                                fontFamily: F.bodySemiBold, fontSize: 13,
                                                color: C.textPrimary,
                                            }}>
                                                {t.name}
                                            </Text>
                                            <Text style={{
                                                fontFamily: F.body, fontSize: 11,
                                                color: C.coral,
                                            }}>
                                                {t.type}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                </Animated.View>

                {/* ═══════════════════════════════════════════════════════
                    SECTION 6 — READY TO TAKE CENTER STAGE CTA
                ═══════════════════════════════════════════════════════ */}
                <Animated.View
                    style={[ctaReveal.style]}
                    onLayout={ctaReveal.onLayout}
                >
                    <View style={{
                        position: 'relative', overflow: 'hidden',
                        paddingVertical: isWeb ? 100 : 70,
                        paddingHorizontal: px,
                        alignItems: 'center',
                    }}>
                        {/* Background glow */}
                        <View style={{
                            position: 'absolute', top: '20%' as any, left: '30%' as any,
                            width: 400, height: 400, borderRadius: 200,
                            backgroundColor: 'rgba(232,97,58,0.08)',
                            ...(isWeb ? { filter: 'blur(100px)' } as any : {}),
                        }} />

                        <Text style={{
                            fontFamily: F.heading,
                            fontSize: isWeb ? (SCREEN_WIDTH > 1024 ? 52 : 38) : 30,
                            lineHeight: isWeb ? (SCREEN_WIDTH > 1024 ? 60 : 44) : 36,
                            color: C.textPrimary, textAlign: 'center',
                        }}>
                            Ready to take
                        </Text>
                        <Text style={{
                            fontFamily: F.heading,
                            fontSize: isWeb ? (SCREEN_WIDTH > 1024 ? 52 : 38) : 30,
                            lineHeight: isWeb ? (SCREEN_WIDTH > 1024 ? 60 : 44) : 36,
                            color: C.coral, textAlign: 'center', fontStyle: 'italic',
                        }}>
                            center stage?
                        </Text>

                        <Text style={{
                            fontFamily: F.body, fontSize: isWeb ? 15 : 13,
                            color: C.textSecondary, textAlign: 'center',
                            maxWidth: 500, marginTop: 16, marginBottom: 32,
                            lineHeight: isWeb ? 24 : 20,
                        }}>
                            Join thousands of artists already professionalizing their careers. NETSA is your gateway to India's thriving creative economy.
                        </Text>

                        {/* CTA Buttons */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => router.push('/auth')}
                                style={{
                                    backgroundColor: C.coral, borderRadius: 24,
                                    paddingHorizontal: 24, paddingVertical: 13,
                                }}
                            >
                                <Text style={{ color: C.white, fontFamily: F.bodySemiBold, fontSize: 14 }}>
                                    Create Your Profile
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{
                                borderWidth: 1, borderColor: C.textTertiary, borderRadius: 24,
                                paddingHorizontal: 24, paddingVertical: 13,
                            }}>
                                <Text style={{ color: C.textPrimary, fontFamily: F.bodyMedium, fontSize: 14 }}>
                                    Talk To Us
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>

                {/* ═══════════════════════════════════════════════════════
                    SECTION 7 — FOOTER
                ═══════════════════════════════════════════════════════ */}
                <View style={{
                    borderTopWidth: 1, borderTopColor: C.border,
                    paddingVertical: 20, paddingHorizontal: px,
                    flexDirection: 'row', justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{
                            width: 18, height: 18, borderRadius: 3,
                            backgroundColor: C.coral, alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Text style={{ color: C.white, fontFamily: F.heading, fontSize: 8 }}>N</Text>
                        </View>
                        <Text style={{ color: C.textTertiary, fontFamily: F.bodySemiBold, fontSize: 12, letterSpacing: 0.5 }}>
                            NETSA
                        </Text>
                    </View>
                    <Text style={{
                        color: C.textTertiary, fontFamily: F.body, fontSize: 11,
                    }}>
                        © 2025 Netsaa. Built for artists, by artists.
                    </Text>
                </View>

            </ScrollView>
        </View>
    );
}
