import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, Platform, Image, Easing, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Sparkles, ArrowRight, TrendingUp, Play } from 'lucide-react-native';
import { NETSA_COLORS } from '@/hooks/useThemeColors';

const isWeb = Platform.OS === 'web';

// Live notification component
const LiveNotification = () => {
    const [visible, setVisible] = useState(false);
    const [currentAction, setCurrentAction] = useState(0);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const actions = [
        "Rahul S. just applied for Jazz Night Delhi",
        "Priya M. secured a 5-star rating",
        "New Workshop: Kathak Fusion by Guru Aruna",
        "Escrow payout released for 'The Grand Theatre'",
        "Artist Spotlight: Aryan K. (Violinist)",
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setVisible(true);
            setTimeout(() => setVisible(false), 4000);
            setTimeout(() => setCurrentAction(prev => (prev + 1) % actions.length), 4500);
        }, 8000);

        // Show first notification after 2 seconds
        const initialTimer = setTimeout(() => {
            setVisible(true);
            setTimeout(() => setVisible(false), 4000);
        }, 2000);

        return () => {
            clearInterval(timer);
            clearTimeout(initialTimer);
        };
    }, []);

    // Hide on mobile or if not visible
    if (!visible || isMobile || !isWeb) return null;

    return (
        <View
            style={{
                position: 'absolute',
                bottom: 32,
                right: 32,
                zIndex: 110,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: 'rgba(24, 24, 27, 0.9)',
                backdropFilter: 'blur(16px)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                padding: 16,
                borderRadius: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
            } as any}
        >
            <View
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: 'rgba(234, 105, 139, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <TrendingUp size={20} color={NETSA_COLORS.netsa[10]} />
            </View>
            <View style={{ paddingRight: 16, maxWidth: 280 }}>
                <Text style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' }}>
                    Live Activity
                </Text>
                <Text style={{ fontSize: 14, color: '#fff', fontWeight: '500' }} numberOfLines={1}>
                    {actions[currentAction]}
                </Text>
            </View>
        </View>
    );
};

// Animated background gradient orb
const GradientOrb = ({ color, size, top, left, delay = 0 }: { color: string; size: number; top: string | number; left: string | number; delay?: number }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        if (isWeb) return;

        Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(scaleAnim, {
                        toValue: 1.2,
                        duration: 10000,
                        delay,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 0.5,
                        duration: 10000,
                        delay,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 10000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 0.3,
                        duration: 10000,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        ).start();
    }, []);

    const AnimatedComponent = isWeb ? View : Animated.View;
    const animatedStyle = isWeb
        ? { opacity: 0.3 }
        : { opacity: opacityAnim, transform: [{ scale: scaleAnim }] };

    return (
        <AnimatedComponent
            style={[
                {
                    position: 'absolute',
                    top,
                    left,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                },
                animatedStyle,
                isWeb ? { filter: 'blur(120px)' } : {},
            ] as any}
        />
    );
};
// Floating phone mockup (desktop only)
const FloatingMockup = () => {
    const floatAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const { width } = useWindowDimensions();

    // Hide on mobile widths
    const isSmallScreen = width < 900;
    const isMediumScreen = width >= 900 && width < 1200;

    // Scale down for medium screens
    const cardWidth = isMediumScreen ? 280 : 384;
    const cardHeight = isMediumScreen ? 380 : 500;
    const cardPadding = isMediumScreen ? 20 : 32;
    const cardBorderRadius = isMediumScreen ? 32 : 48;
    const opportunityMarginTop = isMediumScreen ? 50 : 80;

    useEffect(() => {
        if (!isWeb) return;

        Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(floatAnim, {
                        toValue: -20,
                        duration: 3000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                    Animated.timing(floatAnim, {
                        toValue: 0,
                        duration: 3000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(rotateAnim, {
                        toValue: 5,
                        duration: 3000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                    Animated.timing(rotateAnim, {
                        toValue: 0,
                        duration: 3000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                ]),
            ])
        ).start();
    }, []);

    // Hide on native or small screens
    if (!isWeb || isSmallScreen) return null;

    return (
        <Animated.View
            style={{
                position: 'absolute',
                right: isMediumScreen ? '-8%' : '-5%',
                top: '15%',
                transform: [
                    { translateY: floatAnim },
                    // @ts-ignore
                    { rotate: rotateAnim.interpolate({ inputRange: [0, 5], outputRange: ['0deg', '5deg'] }) },
                ],
            }}
        >
            <View
                style={{
                    width: cardWidth,
                    height: cardHeight,
                    backgroundColor: 'rgba(24, 24, 27, 0.4)',
                    backdropFilter: 'blur(32px)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: cardBorderRadius,
                    padding: cardPadding,
                    overflow: 'hidden',

                } as any}
            >
                {/* Gradient overlay */}
                <LinearGradient
                    colors={['rgba(234, 105, 139, 0.1)', 'transparent'] as const}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />

                {/* Play button */}
                <View
                    style={{
                        width: isMediumScreen ? 40 : 48,
                        height: isMediumScreen ? 40 : 48,
                        borderRadius: isMediumScreen ? 20 : 24,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: isMediumScreen ? 16 : 24,
                    }}
                >
                    <Play size={isMediumScreen ? 14 : 16} color="#fff" fill="#fff" />
                </View>

                {/* Skeleton content */}
                <View style={{ gap: isMediumScreen ? 12 : 16 }}>
                    <View style={{ height: isMediumScreen ? 12 : 16, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 8, width: '75%' }} />
                    <View style={{ height: isMediumScreen ? 12 : 16, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 8, width: '50%' }} />
                    <View style={{ flexDirection: 'row', gap: isMediumScreen ? 12 : 16, paddingTop: isMediumScreen ? 12 : 16 }}>
                        <View style={{ flex: 1, aspectRatio: 1, backgroundColor: '#27272a', borderRadius: isMediumScreen ? 12 : 16 }} />
                        <View style={{ flex: 1, aspectRatio: 1, backgroundColor: '#27272a', borderRadius: isMediumScreen ? 12 : 16 }} />
                    </View>
                </View>

                {/* Opportunity card */}
                <View
                    style={{
                        marginTop: opportunityMarginTop,
                        padding: isMediumScreen ? 16 : 24,
                        borderRadius: isMediumScreen ? 16 : 24,
                        backgroundColor: '#fff',
                    }}
                >
                    <Text style={{ fontSize: isMediumScreen ? 9 : 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: isMediumScreen ? 4 : 8, color: '#000' }}>
                        New Opportunity
                    </Text>
                    <Text style={{ fontSize: isMediumScreen ? 14 : 18, fontWeight: '700', color: '#000' }}>
                        Jazz Night at Piano Man
                    </Text>
                    <Text style={{ fontSize: isMediumScreen ? 12 : 14, opacity: 0.6, marginTop: 4, color: '#000' }}>
                        ₹15,000 • New Delhi
                    </Text>
                </View>
            </View>
        </Animated.View>
    );
};



export default function HeroSection({ scrollY }: { scrollY: any }) {
    const router = useRouter();
    const { height, width } = useWindowDimensions();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Pulsing animation for live badge
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.4,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <View
            style={{
                minHeight: isMobile ? height - 80 : height,
                backgroundColor: '#000',
                overflow: 'hidden',
                paddingTop: isMobile ? 80 : 80,
                position: 'relative',
            }}
        >
            {/* Background gradient orbs */}
            <GradientOrb
                color={NETSA_COLORS.netsa[1]}
                size={isMobile ? 400 : 800}
                top="25%"
                left={isMobile ? "-50%" : "-25%"}
                delay={0}
            />
            <GradientOrb
                color={NETSA_COLORS.netsa[2]}
                size={isMobile ? 300 : 600}
                top="25%"
                left={isMobile ? "50%" : "75%"}
                delay={2000}
            />

            {/* Live notification (desktop only) */}
            <LiveNotification />

            {/* Floating mockup (desktop only) */}
            {
                isWeb ? (<FloatingMockup />) : null
            }

            {/* Main content */}
            <View
                style={{
                    flex: 1,
                    paddingHorizontal: isMobile ? 16 : 24,
                    maxWidth: isMobile ? '100%' : isTablet ? 700 : 900,
                    alignSelf: isMobile ? 'center' : isWeb && !isTablet ? 'flex-start' : 'center',
                    marginLeft: isMobile ? 0 : isWeb && !isTablet ? 48 : 0,
                    justifyContent: 'center',
                    zIndex: 10,
                }}
            >
                {/* Badges row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                    {/* First badge */}
                    <View
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            paddingHorizontal: isMobile ? 12 : 16,
                            paddingVertical: 6,
                            borderRadius: 20,
                        }}
                    >
                        <Text style={{ fontSize: isMobile ? 11 : 14, color: '#d4d4d8', fontWeight: '500' }}>
                            India's First Artistic Professional Network
                        </Text>
                    </View>

                    {/* Live gigs badge */}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            backgroundColor: 'rgba(234, 105, 139, 0.1)',
                            borderWidth: 1,
                            borderColor: 'rgba(234, 105, 139, 0.2)',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 20,
                        }}
                    >
                        <Animated.View
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: NETSA_COLORS.netsa[10],
                                opacity: isWeb ? 1 : pulseAnim,
                                shadowColor: NETSA_COLORS.netsa[10],
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 1,
                                shadowRadius: 8,
                            }}
                        />
                        <Text style={{ fontSize: 10, fontWeight: '700', color: NETSA_COLORS.netsa[10], textTransform: 'uppercase', letterSpacing: 2 }}>
                            Live Gigs Active
                        </Text>
                    </View>
                </View>

                {/* Main headline */}
                <Text
                    style={{
                        fontSize: isMobile ? 48 : isTablet ? 80 : isWeb ? 95 : 48,
                        fontWeight: '900',
                        color: '#fff',
                        lineHeight: isMobile ? 52 : isTablet ? 76 : isWeb ? 122 : 52,
                        letterSpacing: -2,
                        marginBottom: 8,
                    }}
                >
                    THE STAGE IS
                </Text>
                <Text
                    className='text-transparent bg-clip-text bg-gradient-to-r from-netsa-5 via-netsa-8 to-netsa-10'
                    style={{
                        fontSize: isMobile ? 42 : isTablet ? 72 : isWeb ? 95 : 42,
                        fontWeight: '900',
                        lineHeight: isMobile ? 48 : isTablet ? 68 : isWeb ? 122 : 48,
                        letterSpacing: -2,
                        marginBottom: 32,
                    }}
                >
                    REVOLUTIONIZED.
                </Text>

                {/* Subheadline */}
                <Text
                    style={{
                        fontSize: isMobile ? 16 : isTablet ? 20 : isWeb ? 24 : 20,
                        color: '#a1a1aa',
                        lineHeight: isMobile ? 24 : isTablet ? 30 : isWeb ? 36 : 28,
                        maxWidth: isMobile ? '100%' : 600,
                        marginBottom: isMobile ? 32 : 48,
                        fontWeight: '300',
                    }}
                >
                    Empowering India's performing artists with a transparent, direct, and professional ecosystem. No more WhatsApp calls, just your talent.
                </Text>

                {/* CTA Buttons */}
                <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 20, marginBottom: isMobile ? 48 : 80 }}>
                    <TouchableOpacity
                        onPress={() => router.push('/(auth)/register')}
                        activeOpacity={0.8}
                        style={{
                            shadowColor: '#fff',
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.1,
                            shadowRadius: 20,
                            width: isMobile ? '100%' : 'auto',
                        }}
                    >
                        <View
                            style={{
                                height: isMobile ? 56 : 64,
                                paddingHorizontal: isMobile ? 32 : 40,
                                backgroundColor: '#fff',
                                borderRadius: isMobile ? 28 : 32,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text style={{ fontSize: isMobile ? 16 : 18, fontWeight: '600', color: '#000' }}>
                                Create Your Profile
                            </Text>
                            <ArrowRight size={isMobile ? 18 : 20} color="#000" style={{ marginLeft: 8 }} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/gigs')}
                        activeOpacity={0.8}
                        style={{ width: isMobile ? '100%' : 'auto' }}
                    >
                        <View
                            style={{
                                height: isMobile ? 56 : 64,
                                paddingHorizontal: isMobile ? 32 : 40,
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: isMobile ? 28 : 32,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text style={{ fontSize: isMobile ? 16 : 18, fontWeight: '600', color: '#fff' }}>
                                Explore Gigs
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Social proof */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: isMobile ? 16 : 32 }}>
                    {/* Avatar stack */}
                    <View style={{ flexDirection: 'row' }}>
                        {[1, 2, 3, 4].map((i) => (
                            <View
                                key={i}
                                style={{
                                    width: isMobile ? 40 : 48,
                                    height: isMobile ? 40 : 48,
                                    borderRadius: isMobile ? 20 : 24,
                                    borderWidth: 4,
                                    borderColor: '#000',
                                    backgroundColor: '#27272a',
                                    marginLeft: i > 1 ? (isMobile ? -12 : -16) : 0,
                                    overflow: 'hidden',
                                }}
                            >
                                <Image
                                    source={{ uri: `https://i.pravatar.cc/150?u=${i + 10}` }}
                                    style={{ width: '100%', height: '100%' }}
                                />
                            </View>
                        ))}
                    </View>
                    <Text style={{ fontSize: isMobile ? 13 : 14, color: '#71717a', fontWeight: '500' }}>
                        <Text style={{ color: '#fff', fontWeight: '600' }}>26M+</Text> Aspiring Artists in India
                    </Text>
                </View>
            </View>
        </View>
    );
}
