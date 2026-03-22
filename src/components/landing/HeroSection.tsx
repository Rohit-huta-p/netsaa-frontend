import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, Platform, Image, Easing, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Sparkles, ArrowRight, TrendingUp, Play, CheckCircle, Users, DollarSign } from 'lucide-react-native';
import { NETSA_COLORS } from '@/hooks/useThemeColors';
import { useParallax, SCREEN_HEIGHT } from '@/hooks/useParallax';

const isWeb = Platform.OS === 'web';

// ============================================================================
// PSYCHOLOGY-DRIVEN LIVE NOTIFICATIONS
// ============================================================================
// Shows different notifications based on user type detected (or alternates)
const LiveNotification = ({ userType = 'artist' }: { userType?: 'artist' | 'organizer' }) => {
    const [visible, setVisible] = useState(false);
    const [currentAction, setCurrentAction] = useState(0);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const artistActions = [
        { text: "Rahul S. just earned ₹45,000 from Jazz Night Delhi", icon: DollarSign, color: NETSA_COLORS.netsa[10] },
        { text: "Priya M. secured a verified 5-star rating", icon: CheckCircle, color: '#22c55e' },
        { text: "New Workshop: Kathak Fusion by Guru Aruna (2 slots left)", icon: TrendingUp, color: NETSA_COLORS.netsa[5] },
        { text: "Artist Spotlight: Aryan K. got 3 gig offers this week", icon: Sparkles, color: '#fbbf24' },
        { text: "234 artists found work this month on NETSA", icon: Users, color: NETSA_COLORS.netsa[10] },
    ];

    const organizerActions = [
        { text: "Theatre Mumbai found 12 perfect actors in 24 hours", icon: CheckCircle, color: '#22c55e' },
        { text: "Dance Academy filled 5 instructor positions", icon: Users, color: NETSA_COLORS.netsa[10] },
        { text: "Corporate Event saved 40% on talent booking fees", icon: DollarSign, color: '#22c55e' },
        { text: "Wedding Planners found verified artists instantly", icon: Sparkles, color: NETSA_COLORS.netsa[5] },
        { text: "127 organizers hired talent this week", icon: TrendingUp, color: NETSA_COLORS.netsa[10] },
    ];

    const actions = userType === 'artist' ? artistActions : organizerActions;

    useEffect(() => {
        const timer = setInterval(() => {
            setVisible(true);
            setTimeout(() => setVisible(false), 5000);
            setTimeout(() => setCurrentAction(prev => (prev + 1) % actions.length), 5500);
        }, 10000);

        const initialTimer = setTimeout(() => {
            setVisible(true);
            setTimeout(() => setVisible(false), 5000);
        }, 3000);

        return () => {
            clearInterval(timer);
            clearTimeout(initialTimer);
        };
    }, []);

    if (!visible || isMobile || !isWeb) return null;

    const currentNotification = actions[currentAction];
    const Icon = currentNotification.icon;

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
                backgroundColor: 'rgba(24, 24, 27, 0.95)',
                backdropFilter: 'blur(16px)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                padding: 16,
                borderRadius: 16,
                shadowColor: currentNotification.color,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
            } as any}
        >
            <View
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: `${currentNotification.color}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Icon size={20} color={currentNotification.color} />
            </View>
            <View style={{ paddingRight: 16, maxWidth: 320 }}>
                <Text style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' }}>
                    Just Happened
                </Text>
                <Text style={{ fontSize: 14, color: '#fff', fontWeight: '500' }} numberOfLines={2}>
                    {currentNotification.text}
                </Text>
            </View>
        </View>
    );
};

// ============================================================================
// PARALLAX BACKGROUND LAYERS
// ============================================================================
const ParallaxLayer = ({
    scrollY,
    speed = 0.5,
    children,
    style
}: {
    scrollY: Animated.Value;
    speed?: number;
    children: React.ReactNode;
    style?: any
}) => {
    const translateY = scrollY.interpolate({
        inputRange: [0, SCREEN_HEIGHT],
        outputRange: [0, -SCREEN_HEIGHT * speed],
        extrapolate: 'extend',
    });

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    width: '100%',
                    transform: [{ translateY }],
                },
                style,
            ]}
        >
            {children}
        </Animated.View>
    );
};

// Enhanced gradient orb with parallax
const GradientOrb = ({
    scrollY,
    color,
    size,
    top,
    left,
    delay = 0,
    parallaxSpeed = 0.3
}: {
    scrollY?: Animated.Value;
    color: string;
    size: number;
    top: string | number;
    left: string | number;
    delay?: number;
    parallaxSpeed?: number;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        if (isWeb) return;

        Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(scaleAnim, {
                        toValue: 1.3,
                        duration: 12000,
                        delay,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 0.6,
                        duration: 12000,
                        delay,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 12000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 0.3,
                        duration: 12000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ])
        ).start();
    }, []);

    const translateY = scrollY
        ? scrollY.interpolate({
            inputRange: [0, SCREEN_HEIGHT],
            outputRange: [0, -SCREEN_HEIGHT * parallaxSpeed],
            extrapolate: 'extend',
        })
        : 0;

    const AnimatedComponent = isWeb ? View : Animated.View;
    const animatedStyle = isWeb
        ? { opacity: 0.4 }
        : {
            opacity: opacityAnim,
            transform: [
                { scale: scaleAnim },
                ...(scrollY ? [{ translateY }] : [])
            ]
        };

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
                isWeb ? { filter: 'blur(140px)' } : {},
            ] as any}
        />
    );
};

// ============================================================================
// PSYCHOLOGY-OPTIMIZED HERO SECTION
// ============================================================================
export default function HeroSection({ scrollY, sectionIndex = 0 }: { scrollY: Animated.Value; sectionIndex?: number }) {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Exit parallax: content fades + slides up as user scrolls past hero
    const { exitOpacity, exitTranslateY } = useParallax(scrollY, sectionIndex);

    // Detect user type (in real app, use cookies/query params)
    const [userType, setUserType] = useState<'artist' | 'organizer'>('artist');

    useEffect(() => {
        // Pulse animation for live indicator
        if (!isWeb) {
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
        }

        // Alternate between artist and organizer messaging every 30s
        const typeRotation = setInterval(() => {
            setUserType(prev => prev === 'artist' ? 'organizer' : 'artist');
        }, 30000);

        return () => clearInterval(typeRotation);
    }, []);

    // Final locked copy from content reference doc
    const messaging = {
        artist: {
            headline: "Your Stage. Your Terms.",
            gradientText: "Your Career.",
            subheadline: "Join 50,000+ performing artists who stopped waiting for opportunities and started creating them.",
            cta1: "Start Your Free Profile",
            cta2: "See How It Works",
            badge: "50,000+ Artists & Growing",
        },
        organizer: {
            headline: "Hire Verified Talent",
            gradientText: "In Minutes.",
            subheadline: "Stop scrolling Instagram hoping to find the right performer. Access 50,000+ verified artists filtered by skill, location, budget, and availability.",
            cta1: "Post Your First Gig Free",
            cta2: "Browse Talent Pool",
            badge: "500+ Organizers Trust NETSA",
        },
    };

    const currentMessaging = messaging[userType];

    return (
        <View
            style={{
                minHeight: isMobile ? SCREEN_HEIGHT : SCREEN_HEIGHT,
                backgroundColor: '#000',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* ========== PARALLAX BACKGROUND LAYERS ========== */}
            {/* Layer 1: Deep background orbs (slowest) */}
            <ParallaxLayer scrollY={scrollY} speed={0.1}>
                <GradientOrb scrollY={scrollY} color={NETSA_COLORS.netsa[5]} size={600} top={-100} left={-200} delay={0} parallaxSpeed={0.1} />
                <GradientOrb scrollY={scrollY} color={NETSA_COLORS.netsa[10]} size={500} top={200} left="60%" delay={2000} parallaxSpeed={0.15} />
            </ParallaxLayer>

            {/* Layer 2: Mid-ground orbs */}
            <ParallaxLayer scrollY={scrollY} speed={0.3}>
                <GradientOrb scrollY={scrollY} color="#8b5cf6" size={200} top={-50} left="90%" delay={1000} parallaxSpeed={0.3} />
                <GradientOrb scrollY={scrollY} color={NETSA_COLORS.netsa[3]} size={350} top={400} left={-500} delay={3000} parallaxSpeed={0.25} />
            </ParallaxLayer>

            {/* Layer 3: Foreground elements (faster parallax) */}
            {/* <ParallaxLayer scrollY={scrollY} speed={0.5}>
                <View style={{ position: 'absolute', top: 100, right: 50, opacity: 0.1 }}>
                    <Sparkles size={80} color="#fff" />
                </View>
                <View style={{ position: 'absolute', top: 300, left: 100, opacity: 0.05 }}>
                    <Play size={120} color="#fff" />
                </View>
            </ParallaxLayer> */}

            {/* Live notification */}
            <LiveNotification userType={userType} />

            {/* ========== MAIN CONTENT (with exit parallax) ========== */}
            <Animated.View
                style={{
                    flex: 1,
                    paddingHorizontal: isMobile ? 20 : 24,
                    maxWidth: isMobile ? '100%' : isTablet ? 800 : 1000,
                    alignSelf: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    paddingTop: isMobile ? 120 : 140,
                    opacity: exitOpacity,
                    transform: [{ translateY: exitTranslateY }],
                }}
            >
                {/* Top badges with psychology-driven messaging */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 52, flexWrap: 'wrap' }}>
                    <View
                        style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            borderWidth: 1,
                            borderColor: 'rgba(34, 197, 94, 0.3)',
                            paddingHorizontal: isMobile ? 12 : 16,
                            paddingVertical: 8,
                            borderRadius: 24,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <CheckCircle size={14} color="#22c55e" />
                        <Text style={{ fontSize: isMobile ? 11 : 12, color: '#22c55e', fontWeight: '600' }}>
                            {currentMessaging.badge}
                        </Text>
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            backgroundColor: 'rgba(234, 105, 139, 0.1)',
                            borderWidth: 1,
                            borderColor: 'rgba(234, 105, 139, 0.2)',
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 24,
                        }}
                    >
                        <Animated.View
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: NETSA_COLORS.netsa[10],
                                opacity: isWeb ? 1 : pulseAnim,
                            }}
                        />
                        <Text style={{ fontSize: 10, fontWeight: '700', color: NETSA_COLORS.netsa[10], textTransform: 'uppercase', letterSpacing: 2 }}>
                            Live Opportunities
                        </Text>
                    </View>
                </View>

                {/* Dynamic headline based on user type */}
                <Text
                    style={{
                        fontSize: isMobile ? 44 : isTablet ? 72 : isWeb ? 88 : 48,
                        fontWeight: '900',
                        color: '#fff',
                        lineHeight: isMobile ? 48 : isTablet ? 76 : isWeb ? 100 : 52,
                        letterSpacing: -2,
                        marginBottom: 20,
                    }}
                >
                    {currentMessaging.headline}
                </Text>
                <Text
                    className='text-transparent bg-clip-text bg-gradient-to-r from-netsa-5 via-netsa-8 to-netsa-10'
                    style={{
                        fontSize: isMobile ? 44 : isTablet ? 72 : isWeb ? 88 : 48,
                        fontWeight: '900',
                        lineHeight: isMobile ? 48 : isTablet ? 76 : isWeb ? 100 : 52,
                        letterSpacing: -2,
                        marginBottom: 48,
                    }}
                >
                    {currentMessaging.gradientText}
                </Text>

                {/* Benefit-focused subheadline */}
                <Text
                    style={{
                        fontSize: isMobile ? 14 : isTablet ? 20 : isWeb ? 22 : 18,
                        color: '#d4d4d8',
                        lineHeight: isMobile ? 28 : isTablet ? 34 : isWeb ? 38 : 30,
                        maxWidth: isMobile ? '100%' : 700,
                        marginBottom: isMobile ? 56 : 80,
                        fontWeight: '400',
                    }}
                >
                    {currentMessaging.subheadline}
                </Text>

                {/* Urgency-driven CTAs */}
                <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 20, marginBottom: isMobile ? 64 : 96 }}>
                    <TouchableOpacity
                        onPress={() => router.push('/(auth)/register')}
                        activeOpacity={0.8}
                        style={{
                            shadowColor: NETSA_COLORS.netsa[10],
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.3,
                            shadowRadius: 24,
                            width: isMobile ? '100%' : 'auto',
                        }}
                    >
                        <LinearGradient
                            colors={[NETSA_COLORS.netsa[5], NETSA_COLORS.netsa[10]] as const}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                height: isMobile ? 60 : 68,
                                paddingHorizontal: isMobile ? 32 : 48,
                                borderRadius: isMobile ? 30 : 34,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text style={{ fontSize: isMobile ? 17 : 18, fontWeight: '700', color: '#fff' }}>
                                {currentMessaging.cta1}
                            </Text>
                            <ArrowRight size={isMobile ? 20 : 22} color="#fff" style={{ marginLeft: 10 }} />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push(userType === 'artist' ? '/gigs' : '/search')}
                        activeOpacity={0.8}
                        style={{ width: isMobile ? '100%' : 'auto' }}
                    >
                        <View
                            style={{
                                height: isMobile ? 60 : 68,
                                paddingHorizontal: isMobile ? 32 : 48,
                                borderWidth: 2,
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: isMobile ? 30 : 34,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            }}
                        >
                            <Text style={{ fontSize: isMobile ? 17 : 18, fontWeight: '700', color: '#fff' }}>
                                {currentMessaging.cta2}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Trust signals / Social proof */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: isMobile ? 40 : 72, flexWrap: 'wrap' }}>
                    {/* Avatar stack */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ flexDirection: 'row' }}>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <View
                                    key={i}
                                    style={{
                                        width: isMobile ? 40 : 44,
                                        height: isMobile ? 40 : 44,
                                        borderRadius: isMobile ? 20 : 22,
                                        borderWidth: 3,
                                        borderColor: '#000',
                                        backgroundColor: '#27272a',
                                        marginLeft: i > 1 ? (isMobile ? -10 : -14) : 0,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Image
                                        source={{ uri: `https://i.pravatar.cc/150?u=${i + 20}` }}
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                </View>
                            ))}
                        </View>
                        <View>
                            <Text style={{ fontSize: isMobile ? 15 : 16, color: '#fff', fontWeight: '700' }}>
                                4.9/5.0
                            </Text>
                            <Text style={{ fontSize: isMobile ? 11 : 12, color: '#71717a' }}>
                                from 2,400+ users
                            </Text>
                        </View>
                    </View>

                    {/* Trust badge */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <CheckCircle size={20} color="#22c55e" />
                        <Text style={{ fontSize: isMobile ? 13 : 14, color: '#a1a1aa' }}>
                            Verified & Secure Platform
                        </Text>
                    </View>
                </View>
            </Animated.View>
        </View>
    );
}