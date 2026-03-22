import React from 'react';
import { View, Text, Platform, useWindowDimensions } from 'react-native';
import { Star } from 'lucide-react-native';
import { NETSA_COLORS } from '@/hooks/useThemeColors';

const isWeb = Platform.OS === 'web';

interface TestimonialCardProps {
    name: string;
    role: string;
    city: string;
    quote: string;
    initials: string;
    accentColor: string;
    isMobile: boolean;
}

const StarRating = ({ color }: { color: string }) => (
    <View style={{ flexDirection: 'row', gap: 3, marginBottom: 16 }}>
        {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={14} color={color} fill={color} />
        ))}
    </View>
);

const TestimonialCard = ({ name, role, city, quote, initials, accentColor, isMobile }: TestimonialCardProps) => (
    <View
        style={{
            flex: 1,
            minWidth: isMobile ? '100%' : 280,
            padding: isMobile ? 32 : 40,
            borderRadius: isMobile ? 24 : 28,
            backgroundColor: 'rgba(24, 24, 27, 0.6)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            borderLeftWidth: 3,
            borderLeftColor: accentColor,
        }}
    >
        <StarRating color="#fbbf24" />

        {/* Quote */}
        <Text
            style={{
                fontSize: isMobile ? 14 : 15,
                color: '#d4d4d8',
                lineHeight: isMobile ? 24 : 28,
                fontStyle: 'italic',
                marginBottom: isMobile ? 24 : 32,
                flex: 1,
            }}
        >
            "{quote}"
        </Text>

        {/* Author row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: `${accentColor}20`,
                    borderWidth: 1.5,
                    borderColor: `${accentColor}40`,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Text style={{ fontSize: 14, fontWeight: '700', color: accentColor }}>
                    {initials}
                </Text>
            </View>
            <View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{name}</Text>
                <Text style={{ fontSize: 12, color: '#71717a' }}>{role} · {city}</Text>
            </View>
        </View>
    </View>
);

export default function TestimonialsSection({ scrollY, sectionIndex }: { scrollY?: any; sectionIndex?: number }) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    const testimonials = [
        {
            name: 'Priya Sharma',
            role: 'Bharatanatyam Dancer',
            city: 'Mumbai',
            quote: 'I used to spend 4 hours daily in WhatsApp groups, hoping someone would share a gig. Now I wake up to 5–10 relevant opportunities in my NETSA inbox. Booked 12 events in 2 months.',
            initials: 'PS',
            accentColor: NETSA_COLORS.netsa[10],
        },
        {
            name: 'Arjun Mehta',
            role: 'Guitarist & Music Producer',
            city: 'Bangalore',
            quote: "Got tired of agents taking 40% for making one phone call. NETSA connected me directly with a wedding planner — ₹50,000 gig, paid in full the next day. That's never happened before.",
            initials: 'AM',
            accentColor: '#22c55e',
        },
        {
            name: 'Neha Kapoor',
            role: 'Theater Artist & Voice Actor',
            city: 'Delhi',
            quote: 'Finally, a platform that treats artists like professionals, not hobbyists. The contract feature saved me from a scam — the organizer tried to cut my fee, but NETSA support backed me up.',
            initials: 'NK',
            accentColor: '#a855f7',
        },
    ];

    const stats = [
        { value: '50,000+', label: 'Artists' },
        { value: '12,000+', label: 'Gigs Posted' },
        { value: '47 Cr+', label: 'Paid to Artists' },
        { value: '4.9/5', label: 'Rating' },
    ];

    return (
        <View
            style={{
                paddingVertical: isMobile ? 96 : isTablet ? 128 : 160,
                paddingHorizontal: isMobile ? 20 : 24,
                backgroundColor: '#09090b',
            }}
        >
            <View
                style={{
                    maxWidth: 1200,
                    alignSelf: 'center',
                    width: '100%',
                }}
            >
                {/* Section header */}
                <View
                    style={{
                        alignItems: 'center',
                        marginBottom: isMobile ? 64 : 96,
                        maxWidth: isMobile ? '100%' : 700,
                        alignSelf: 'center',
                    }}
                >
                    <Text
                        style={{
                            fontSize: isMobile ? 10 : 12,
                            color: '#fbbf24',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: 4,
                            marginBottom: 16,
                        }}
                    >
                        Real Artists. Real Results.
                    </Text>
                    <Text
                        style={{
                            fontSize: isMobile ? 34 : isWeb ? 52 : 38,
                            fontWeight: '900',
                            color: '#fff',
                            textAlign: 'center',
                            letterSpacing: -1.5,
                            lineHeight: isMobile ? 40 : isWeb ? 60 : 44,
                        }}
                    >
                        Don't Take Our Word For It.{'\n'}Listen to Artists Like You.
                    </Text>
                </View>

                {/* Stats bar */}
                <View
                    style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderRadius: isMobile ? 20 : 24,
                        overflow: 'hidden',
                        marginBottom: isMobile ? 48 : 72,
                    }}
                >
                    {stats.map((stat, index) => (
                        <View
                            key={stat.label}
                            style={{
                                flex: 1,
                                minWidth: isMobile ? '50%' : undefined,
                                paddingVertical: isMobile ? 24 : 32,
                                paddingHorizontal: isMobile ? 16 : 24,
                                alignItems: 'center',
                                borderRightWidth: index < stats.length - 1 && !isMobile ? 1 : 0,
                                borderBottomWidth: isMobile && index < 2 ? 1 : 0,
                                borderRightColor: 'rgba(255,255,255,0.06)',
                                borderBottomColor: 'rgba(255,255,255,0.06)',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: isMobile ? 26 : isWeb ? 38 : 30,
                                    fontWeight: '900',
                                    color: '#fff',
                                    letterSpacing: -1,
                                    marginBottom: 4,
                                }}
                            >
                                {stat.value}
                            </Text>
                            <Text
                                style={{
                                    fontSize: isMobile ? 11 : 13,
                                    color: '#71717a',
                                    fontWeight: '500',
                                    textTransform: 'uppercase',
                                    letterSpacing: 2,
                                    textAlign: 'center',
                                }}
                            >
                                {stat.label}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Testimonial cards */}
                <View
                    style={{
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? 20 : 28,
                        alignItems: 'stretch',
                    }}
                >
                    {testimonials.map((t) => (
                        <TestimonialCard key={t.name} {...t} isMobile={isMobile} />
                    ))}
                </View>
            </View>
        </View>
    );
}
