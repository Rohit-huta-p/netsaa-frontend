import React from 'react';
import { View, Text, Platform, useWindowDimensions, Animated } from 'react-native';
import { TrendingUp, Award, Users, DollarSign } from 'lucide-react-native';
import { NETSA_COLORS } from '@/hooks/useThemeColors';
import { useParallax } from '@/hooks/useParallax';

const isWeb = Platform.OS === 'web';

interface StatCardProps {
    icon: any;
    label: string;
    value: string;
    description: string;
    accentColor: string;
    scrollY?: Animated.Value;
    sectionIndex?: number;
    index: number;
}

const StatCard = ({ icon: Icon, label, value, description, accentColor, scrollY, sectionIndex = 1, index }: StatCardProps) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    // Use useParallax staggered reveals for cards
    const { staggered } = useParallax(scrollY!, sectionIndex);
    const cardAnim = staggered(index, 3);

    // Staggered parallax movement  
    const translateY = scrollY
        ? scrollY.interpolate({
            inputRange: [0, 1000],
            outputRange: [0, -50 + (index * 15)],
            extrapolate: 'clamp',
        })
        : 0;

    return (
        <Animated.View
            style={{
                flex: 1,
                minWidth: isMobile ? '100%' : 300,
                padding: isMobile ? 40 : 56,
                borderRadius: isMobile ? 24 : 32,
                backgroundColor: 'rgba(24, 24, 27, 0.6)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)',
                position: 'relative',
                overflow: 'hidden',
                opacity: scrollY ? cardAnim.opacity : 1,
                transform: scrollY ? [
                    { translateY },
                    { scale: cardAnim.scale },
                ] : undefined,
            }}
        >
            {/* Accent glow */}
            <View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundColor: accentColor,
                    shadowColor: accentColor,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 16,
                }}
            />

            {/* Background icon decoration */}
            <View
                style={{
                    position: 'absolute',
                    top: isMobile ? -10 : 10,
                    right: isMobile ? -10 : 10,
                    opacity: 0.04,
                }}
            >
                <Icon size={isMobile ? 100 : 140} color="#fff" />
            </View>

            {/* Icon badge */}
            <View
                style={{
                    width: isMobile ? 56 : 64,
                    height: isMobile ? 56 : 64,
                    borderRadius: isMobile ? 16 : 20,
                    backgroundColor: `${accentColor}15`,
                    borderWidth: 1,
                    borderColor: `${accentColor}30`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: isMobile ? 20 : 28,
                }}
            >
                <Icon size={isMobile ? 28 : 32} color={accentColor} />
            </View>

            {/* Label */}
            <Text
                style={{
                    fontSize: isMobile ? 11 : 12,
                    color: '#71717a',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: 3,
                    marginBottom: 12,
                }}
            >
                {label}
            </Text>

            {/* Value - Large and bold */}
            <Text
                style={{
                    fontSize: isMobile ? 52 : isWeb ? 72 : 56,
                    fontWeight: '900',
                    color: '#fff',
                    marginBottom: 12,
                    letterSpacing: -2,
                    lineHeight: isMobile ? 56 : isWeb ? 76 : 60,
                }}
            >
                {value}
            </Text>

            {/* Description with benefit framing */}
            <Text
                style={{
                    fontSize: isMobile ? 14 : 15,
                    color: '#d4d4d8',
                    lineHeight: isMobile ? 22 : 24,
                    fontWeight: '400',
                }}
            >
                {description}
            </Text>
        </Animated.View>
    );
};

export default function StatsSection({ scrollY, sectionIndex = 1 }: { scrollY?: Animated.Value; sectionIndex?: number }) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    const stats = [
        {
            icon: TrendingUp,
            label: 'Performing Artists',
            value: '50K+',
            description: "And growing every day. India's largest verified performing arts community — all in one platform.",
            accentColor: NETSA_COLORS.netsa[10],
        },
        {
            icon: Users,
            label: 'Gigs Posted',
            value: '12K+',
            description: 'Workshops, concerts, corporate events & competitions. No more \'I wish I\'d known about that.\'',
            accentColor: '#22c55e',
        },
        {
            icon: DollarSign,
            label: 'Paid to Artists',
            value: '₹47Cr+',
            description: 'Direct payments, zero middlemen. Artists keep 95% of every booking fee — what you earn stays yours.',
            accentColor: '#fbbf24',
        },
    ];

    return (
        <View
            style={{
                paddingVertical: isMobile ? 112 : isTablet ? 144 : 192,
                paddingHorizontal: isMobile ? 20 : 24,
                backgroundColor: '#09090b',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Subtle gradient overlay */}
            <View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 200,
                    opacity: 0.3,
                }}
            >
                <View
                    style={[
                        {
                            position: 'absolute',
                            top: -100,
                            left: '20%',
                            width: 400,
                            height: 400,
                            borderRadius: 200,
                            backgroundColor: NETSA_COLORS.netsa[5],
                        },
                        isWeb ? { filter: 'blur(100px)' } : {},
                    ] as any}
                />
            </View>

            <View
                style={{
                    maxWidth: 1200,
                    alignSelf: 'center',
                    width: '100%',
                    zIndex: 10,
                }}
            >
                {/* Section header with psychology-driven copy */}
                <View
                    style={{
                        alignItems: 'center',
                        marginBottom: isMobile ? 80 : 104,
                        maxWidth: isMobile ? '100%' : 800,
                        alignSelf: 'center',
                    }}
                >
                    <Text
                        style={{
                            fontSize: isMobile ? 10 : 12,
                            color: NETSA_COLORS.netsa[10],
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: 4,
                            marginBottom: 16,
                        }}
                    >
                        The Numbers Speak
                    </Text>
                    <Text
                        style={{
                            fontSize: isMobile ? 36 : isWeb ? 56 : 40,
                            fontWeight: '900',
                            color: '#fff',
                            textAlign: 'center',
                            marginBottom: isMobile ? 20 : 28,
                            letterSpacing: -1.5,
                        }}
                    >
                        Join India's Creative{'\n'}Revolution
                    </Text>
                    <Text
                        style={{
                            fontSize: isMobile ? 15 : isWeb ? 18 : 16,
                            color: '#a1a1aa',
                            textAlign: 'center',
                            lineHeight: isMobile ? 24 : isWeb ? 30 : 26,
                            fontWeight: '400',
                            paddingHorizontal: isMobile ? 16 : 0,
                        }}
                    >
                        While others struggle with fragmented networks and unfair pay,{'\n'}
                        NETSA artists are building sustainable creative careers.
                    </Text>
                </View>

                {/* Stat cards with staggered parallax */}
                <View
                    style={{
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? 28 : 40,
                    }}
                >
                    {stats.map((stat, index) => (
                        <StatCard
                            key={stat.label}
                            {...stat}
                            scrollY={scrollY}
                            sectionIndex={sectionIndex}
                            index={index}
                        />
                    ))}
                </View>

                {/* Trust signal footer */}
                <View
                    style={{
                        marginTop: isMobile ? 72 : 96,
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            borderRadius: 24,
                            borderWidth: 1,
                            borderColor: 'rgba(34, 197, 94, 0.2)',
                        }}
                    >
                        <Award size={20} color="#22c55e" />
                        <Text
                            style={{
                                fontSize: isMobile ? 13 : 14,
                                color: '#22c55e',
                                fontWeight: '600',
                            }}
                        >
                            4.9/5 Rating · Trusted by 50,000+ Artists & 12,000+ Organizers
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}