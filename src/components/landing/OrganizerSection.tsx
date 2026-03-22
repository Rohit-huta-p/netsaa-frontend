import React from 'react';
import { View, Text, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, CheckCircle, Clock, Users, Star, Briefcase } from 'lucide-react-native';
import { NETSA_COLORS } from '@/hooks/useThemeColors';

const isWeb = Platform.OS === 'web';

export default function OrganizerSection({ scrollY, sectionIndex }: { scrollY?: any; sectionIndex?: number }) {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    const benefits = [
        { icon: Clock, text: 'Post your event in 5 minutes' },
        { icon: Users, text: 'Get 20+ applications in 24 hours' },
        { icon: Star, text: 'Review portfolios, ratings, and past work' },
        { icon: CheckCircle, text: 'Book with confidence. Secure payments.' },
    ];

    return (
        <View
            style={{
                paddingVertical: isMobile ? 96 : isTablet ? 128 : 160,
                paddingHorizontal: isMobile ? 20 : 24,
                backgroundColor: '#050505',
            }}
        >
            <View
                style={{
                    maxWidth: 1200,
                    alignSelf: 'center',
                    width: '100%',
                }}
            >
                <View
                    style={{
                        borderRadius: isMobile ? 28 : 36,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: `${NETSA_COLORS.netsa[10]}30`,
                    }}
                >
                    <LinearGradient
                        colors={['rgba(88,28,235,0.15)', 'rgba(0,0,0,0.95)'] as const}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            padding: isMobile ? 40 : isTablet ? 64 : 80,
                        }}
                    >
                        {/* Top glow accent */}
                        <View
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 2,
                                backgroundColor: NETSA_COLORS.netsa[10],
                                opacity: 0.6,
                            }}
                        />

                        <View
                            style={{
                                flexDirection: isMobile ? 'column' : 'row',
                                gap: isMobile ? 40 : 80,
                                alignItems: isMobile ? 'flex-start' : 'center',
                            }}
                        >
                            {/* Left: Copy */}
                            <View style={{ flex: 1 }}>
                                {/* Badge */}
                                <View
                                    style={{
                                        backgroundColor: `${NETSA_COLORS.netsa[10]}20`,
                                        borderWidth: 1,
                                        borderColor: `${NETSA_COLORS.netsa[10]}40`,
                                        borderRadius: 20,
                                        paddingHorizontal: 16,
                                        paddingVertical: 6,
                                        alignSelf: 'flex-start',
                                        marginBottom: 24,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                >
                                    <Briefcase size={14} color={NETSA_COLORS.netsa[10]} />
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            fontWeight: '700',
                                            color: NETSA_COLORS.netsa[10],
                                            textTransform: 'uppercase',
                                            letterSpacing: 2,
                                        }}
                                    >
                                        For Organizers
                                    </Text>
                                </View>

                                <Text
                                    style={{
                                        fontSize: isMobile ? 32 : isWeb ? 52 : 36,
                                        fontWeight: '900',
                                        color: '#fff',
                                        letterSpacing: -1.5,
                                        marginBottom: 12,
                                        lineHeight: isMobile ? 38 : isWeb ? 60 : 42,
                                    }}
                                >
                                    Are You an Event Organizer?
                                </Text>

                                <Text
                                    style={{
                                        fontSize: isMobile ? 18 : 22,
                                        fontWeight: '700',
                                        color: NETSA_COLORS.netsa[10],
                                        marginBottom: 20,
                                        letterSpacing: -0.5,
                                    }}
                                >
                                    Hire Verified Talent in Minutes.
                                </Text>

                                <Text
                                    style={{
                                        fontSize: isMobile ? 14 : 16,
                                        color: '#a1a1aa',
                                        lineHeight: isMobile ? 22 : 28,
                                        marginBottom: isMobile ? 32 : 40,
                                    }}
                                >
                                    Stop scrolling Instagram hoping to find the right performer. NETSA gives you access to 50,000+ verified artists — filtered by skill, location, budget, and availability.
                                </Text>

                                {/* CTA */}
                                <TouchableOpacity
                                    onPress={() => router.push('/(auth)/register')}
                                    activeOpacity={0.8}
                                    style={{
                                        alignSelf: isMobile ? 'stretch' : 'flex-start',
                                        shadowColor: NETSA_COLORS.netsa[10],
                                        shadowOffset: { width: 0, height: 8 },
                                        shadowOpacity: 0.35,
                                        shadowRadius: 20,
                                    }}
                                >
                                    <LinearGradient
                                        colors={[NETSA_COLORS.netsa[5], NETSA_COLORS.netsa[10]] as const}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{
                                            height: isMobile ? 56 : 64,
                                            paddingHorizontal: isMobile ? 28 : 40,
                                            borderRadius: 32,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 10,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: isMobile ? 16 : 18,
                                                fontWeight: '700',
                                                color: '#fff',
                                            }}
                                        >
                                            Post Your First Gig Free
                                        </Text>
                                        <ArrowRight size={18} color="#fff" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>

                            {/* Right: Benefits list */}
                            <View
                                style={{
                                    gap: isMobile ? 14 : 16,
                                    minWidth: isMobile ? '100%' : 280,
                                }}
                            >
                                {benefits.map((benefit) => (
                                    <View
                                        key={benefit.text}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 14,
                                            backgroundColor: 'rgba(255,255,255,0.04)',
                                            borderWidth: 1,
                                            borderColor: 'rgba(255,255,255,0.07)',
                                            borderRadius: 14,
                                            padding: isMobile ? 14 : 18,
                                        }}
                                    >
                                        <benefit.icon size={20} color={NETSA_COLORS.netsa[10]} />
                                        <Text
                                            style={{
                                                fontSize: isMobile ? 14 : 15,
                                                color: '#d4d4d8',
                                                fontWeight: '500',
                                                flex: 1,
                                            }}
                                        >
                                            {benefit.text}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </View>
        </View>
    );
}
