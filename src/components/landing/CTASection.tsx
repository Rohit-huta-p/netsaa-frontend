import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform, useWindowDimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, CheckCircle, Clock, Users, Sparkles } from 'lucide-react-native';
import { NETSA_COLORS } from '@/hooks/useThemeColors';

const isWeb = Platform.OS === 'web';

interface EnhancedCTASectionProps {
    scrollY?: Animated.Value;
    userType?: 'artist' | 'organizer';
    sectionIndex?: number;
}

export default function CTASection({ scrollY, userType = 'artist', sectionIndex }: EnhancedCTASectionProps) {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    // Countdown timer for urgency (resets daily)
    const [timeLeft, setTimeLeft] = useState({
        hours: 23,
        minutes: 45,
        seconds: 30
    });

    // Live counter animation
    const [liveCount, setLiveCount] = useState(2400);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Countdown timer
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) {
                    return { ...prev, seconds: prev.seconds - 1 };
                } else if (prev.minutes > 0) {
                    return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
                } else if (prev.hours > 0) {
                    return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
                }
                return prev;
            });
        }, 1000);

        // Live counter increment
        const countTimer = setInterval(() => {
            setLiveCount(prev => prev + Math.floor(Math.random() * 3));
        }, 5000);

        // Pulse animation
        if (!isWeb) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
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

        return () => {
            clearInterval(timer);
            clearInterval(countTimer);
        };
    }, []);

    // Parallax effect for background
    const backgroundTranslate = scrollY
        ? scrollY.interpolate({
            inputRange: [0, 1000],
            outputRange: [0, 100],
            extrapolate: 'clamp',
        })
        : 0;

    const contentTranslate = scrollY
        ? scrollY.interpolate({
            inputRange: [0, 1000],
            outputRange: [0, -50],
            extrapolate: 'clamp',
        })
        : 0;

    // Final locked copy from content reference doc
    const messaging = {
        artist: {
            badge: "Free Forever for Artists",
            headline: "Stop Waiting for Your Big Break.\nStart Creating It.",
            subheadline: "Join 50,000+ artists who've taken control of their careers. Your next gig is waiting. Your community is ready.",
            cta1: "Get Started Free",
            cta2: "See Success Stories",
            urgency: `${liveCount.toLocaleString()}+ artists already building careers`,
            features: [
                "No credit card required",
                "No hidden fees. No spam.",
                "Just opportunities."
            ]
        },
        organizer: {
            badge: "Post Your First Gig Free",
            headline: "Stop Wasting Time\nHiring Talent.",
            subheadline: "Access 50,000+ verified artists filtered by skill, location, budget, and availability. Get 20+ applications in 24 hours.",
            cta1: "Post Your First Gig Free",
            cta2: "Browse Talent Pool",
            urgency: `${Math.floor(liveCount / 5).toLocaleString()}+ organizers already hiring`,
            features: [
                "Verified performers only",
                "Direct booking · No middlemen",
                "Save 40% on talent costs"
            ]
        }
    };

    const current = messaging[userType];

    return (
        <View
            style={{
                paddingVertical: isMobile ? 112 : isTablet ? 160 : 200,
                paddingHorizontal: isMobile ? 20 : 24,
                backgroundColor: '#000',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Parallax background layers */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    transform: scrollY ? [{ translateY: backgroundTranslate }] : undefined,
                }}
            >
                {/* Gradient orbs */}
                <View
                    style={[
                        {
                            position: 'absolute',
                            top: -200,
                            left: -100,
                            width: 500,
                            height: 500,
                            borderRadius: 250,
                            backgroundColor: NETSA_COLORS.netsa[5],
                            opacity: 0.15,
                        },
                        isWeb ? { filter: 'blur(100px)' } : {},
                    ] as any}
                />
                <View
                    style={[
                        {
                            position: 'absolute',
                            bottom: -200,
                            right: -100,
                            width: 600,
                            height: 600,
                            borderRadius: 300,
                            backgroundColor: NETSA_COLORS.netsa[10],
                            opacity: 0.15,
                        },
                        isWeb ? { filter: 'blur(120px)' } : {},
                    ] as any}
                />
            </Animated.View>

            {/* Main content */}
            <Animated.View
                style={{
                    maxWidth: 1200,
                    alignSelf: 'center',
                    width: '100%',
                    zIndex: 10,
                    transform: scrollY ? [{ translateY: contentTranslate }] : undefined,
                }}
            >
                {/* CTA Card */}
                <View
                    style={{
                        position: 'relative',
                        padding: isMobile ? 56 : isTablet ? 80 : 120,
                        borderRadius: isMobile ? 28 : isWeb ? 48 : 36,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                >
                    {/* Background gradient */}
                    <LinearGradient
                        colors={['rgba(24, 24, 27, 0.95)', 'rgba(0, 0, 0, 0.95)'] as const}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                        }}
                    />

                    {/* Accent gradient glow */}
                    <View
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 3,
                            backgroundColor: NETSA_COLORS.netsa[10],
                            shadowColor: NETSA_COLORS.netsa[10],
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.8,
                            shadowRadius: 20,
                        }}
                    />

                    {/* Content */}
                    <View style={{ alignItems: 'center', zIndex: 10 }}>
                        {/* Urgency badges */}
                        <View
                            style={{
                                flexDirection: isMobile ? 'column' : 'row',
                                alignItems: 'center',
                                gap: isMobile ? 12 : 20,
                                marginBottom: isMobile ? 48 : 64,
                            }}
                        >
                            {/* Limited badge */}
                            <View
                                style={{
                                    backgroundColor: NETSA_COLORS.netsa[10],
                                    paddingHorizontal: isMobile ? 20 : 28,
                                    paddingVertical: isMobile ? 8 : 10,
                                    borderRadius: 24,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 8,
                                    shadowColor: NETSA_COLORS.netsa[10],
                                    shadowOffset: { width: 0, height: 8 },
                                    shadowOpacity: 0.4,
                                    shadowRadius: 16,
                                }}
                            >
                                <Sparkles size={16} color="#fff" />
                                <Text
                                    style={{
                                        fontSize: isMobile ? 11 : 13,
                                        fontWeight: '700',
                                        color: '#fff',
                                        textTransform: 'uppercase',
                                        letterSpacing: 2,
                                    }}
                                >
                                    {current.badge}
                                </Text>
                            </View>

                            {/* Countdown timer */}
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 8,
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    borderRadius: 24,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                }}
                            >
                                <Clock size={14} color="#fbbf24" />
                                <Text
                                    style={{
                                        fontSize: isMobile ? 11 : 12,
                                        fontWeight: '600',
                                        color: '#fbbf24',
                                        fontVariant: ['tabular-nums'] as any,
                                    }}
                                >
                                    {String(timeLeft.hours).padStart(2, '0')}:
                                    {String(timeLeft.minutes).padStart(2, '0')}:
                                    {String(timeLeft.seconds).padStart(2, '0')}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: isMobile ? 10 : 11,
                                        color: '#a1a1aa',
                                    }}
                                >
                                    left today
                                </Text>
                            </View>
                        </View>

                        {/* Headline */}
                        <Text
                            style={{
                                fontSize: isMobile ? 40 : isTablet ? 64 : isWeb ? 80 : 44,
                                fontWeight: '900',
                                color: '#fff',
                                textAlign: 'center',
                                lineHeight: isMobile ? 44 : isTablet ? 68 : isWeb ? 84 : 48,
                                letterSpacing: -2,
                                marginBottom: isMobile ? 40 : 56,
                            }}
                        >
                            {current.headline}
                        </Text>

                        {/* Subheadline with benefit focus */}
                        <Text
                            style={{
                                fontSize: isMobile ? 15 : isWeb ? 19 : 17,
                                color: '#d4d4d8',
                                textAlign: 'center',
                                lineHeight: isMobile ? 26 : isWeb ? 32 : 28,
                                maxWidth: isMobile ? '100%' : 700,
                                marginBottom: isMobile ? 48 : 64,
                                fontWeight: '400',
                                paddingHorizontal: isMobile ? 8 : 0,
                            }}
                        >
                            {current.subheadline}
                        </Text>

                        {/* Feature checklist */}
                        <View
                            style={{
                                flexDirection: isMobile ? 'column' : 'row',
                                gap: isMobile ? 12 : 32,
                                marginBottom: isMobile ? 56 : 72,
                                alignItems: 'center',
                            }}
                        >
                            {current.features.map((feature, index) => (
                                <View
                                    key={index}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                >
                                    <CheckCircle size={18} color="#22c55e" />
                                    <Text
                                        style={{
                                            fontSize: isMobile ? 13 : 14,
                                            color: '#a1a1aa',
                                            fontWeight: '500',
                                        }}
                                    >
                                        {feature}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* CTA Buttons */}
                        <View
                            style={{
                                flexDirection: isMobile ? 'column' : 'row',
                                gap: isMobile ? 16 : 24,
                                alignItems: 'center',
                                width: '100%',
                                maxWidth: isMobile ? 500 : undefined,
                                marginBottom: 48,
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => router.push('/(auth)/register')}
                                activeOpacity={0.8}
                                style={{
                                    shadowColor: NETSA_COLORS.netsa[10],
                                    shadowOffset: { width: 0, height: 12 },
                                    shadowOpacity: 0.4,
                                    shadowRadius: 24,
                                    width: isMobile ? '100%' : 'auto',
                                }}
                            >
                                <LinearGradient
                                    colors={[NETSA_COLORS.netsa[5], NETSA_COLORS.netsa[10]] as const}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{
                                        height: isMobile ? 64 : isWeb ? 72 : 68,
                                        paddingHorizontal: isMobile ? 32 : isWeb ? 56 : 40,
                                        borderRadius: isMobile ? 32 : isWeb ? 36 : 34,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: isMobile ? 17 : isWeb ? 19 : 18,
                                            fontWeight: '700',
                                            color: '#fff',
                                        }}
                                    >
                                        {current.cta1}
                                    </Text>
                                    <ArrowRight size={isMobile ? 20 : 22} color="#fff" style={{ marginLeft: 12 }} />
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push(userType === 'artist' ? '/gigs' : '/search')}
                                activeOpacity={0.8}
                                style={{ width: isMobile ? '100%' : 'auto' }}
                            >
                                <View
                                    style={{
                                        height: isMobile ? 64 : isWeb ? 72 : 68,
                                        paddingHorizontal: isMobile ? 32 : isWeb ? 56 : 40,
                                        borderWidth: 2,
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                        borderRadius: isMobile ? 32 : isWeb ? 36 : 34,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: isMobile ? 17 : isWeb ? 19 : 18,
                                            fontWeight: '700',
                                            color: '#fff',
                                        }}
                                    >
                                        {current.cta2}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Social proof with live counter */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                paddingHorizontal: 20,
                                paddingVertical: 12,
                                borderRadius: 24,
                                borderWidth: 1,
                                borderColor: 'rgba(34, 197, 94, 0.2)',
                            }}
                        >
                            <Animated.View
                                style={{
                                    transform: [{ scale: pulseAnim }],
                                }}
                            >
                                <Users size={20} color="#22c55e" />
                            </Animated.View>
                            <Text
                                style={{
                                    fontSize: isMobile ? 13 : 14,
                                    color: '#22c55e',
                                    fontWeight: '600',
                                }}
                            >
                                {current.urgency}
                            </Text>
                        </View>
                    </View>
                </View>
            </Animated.View>
        </View>
    );
}