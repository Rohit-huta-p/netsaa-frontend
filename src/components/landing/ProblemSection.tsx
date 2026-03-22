import React from 'react';
import { View, Text, Platform, useWindowDimensions, Animated } from 'react-native';
import { ArrowRight } from 'lucide-react-native';

const isWeb = Platform.OS === 'web';

interface ProblemCardProps {
    emoji: string;
    title: string;
    quote: string;
    outcome: string;
    accentColor: string;
    isMobile: boolean;
}

const ProblemCard = ({ emoji, title, quote, outcome, accentColor, isMobile }: ProblemCardProps) => (
    <View
        style={{
            flex: 1,
            minWidth: isMobile ? '100%' : 280,
            padding: isMobile ? 32 : 40,
            borderRadius: isMobile ? 24 : 28,
            backgroundColor: '#0f0f0f',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
        }}
    >
        {/* Top accent line */}
        <View
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: accentColor,
                opacity: 0.7,
            }}
        />

        {/* Emoji badge */}
        <View
            style={{
                width: isMobile ? 52 : 60,
                height: isMobile ? 52 : 60,
                borderRadius: isMobile ? 16 : 18,
                backgroundColor: `${accentColor}12`,
                borderWidth: 1,
                borderColor: `${accentColor}28`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: isMobile ? 20 : 28,
            }}
        >
            <Text style={{ fontSize: isMobile ? 24 : 28 }}>{emoji}</Text>
        </View>

        {/* Title */}
        <Text
            style={{
                fontSize: isMobile ? 18 : 20,
                fontWeight: '700',
                color: '#fff',
                marginBottom: isMobile ? 12 : 16,
                letterSpacing: -0.5,
            }}
        >
            {title}
        </Text>

        {/* Quote — the pain */}
        <Text
            style={{
                fontSize: isMobile ? 14 : 15,
                color: '#a1a1aa',
                lineHeight: isMobile ? 22 : 26,
                fontStyle: 'italic',
                marginBottom: isMobile ? 20 : 24,
            }}
        >
            {quote}
        </Text>

        {/* Outcome — with accent colour */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <ArrowRight size={16} color={accentColor} style={{ marginTop: 2 }} />
            <Text
                style={{
                    flex: 1,
                    fontSize: isMobile ? 13 : 14,
                    color: accentColor,
                    fontWeight: '600',
                    lineHeight: 20,
                }}
            >
                {outcome}
            </Text>
        </View>
    </View>
);

export default function ProblemSection({ scrollY, sectionIndex }: { scrollY?: any; sectionIndex?: number }) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    const problems = [
        {
            emoji: '🔍',
            title: 'The WhatsApp Hustle',
            quote: '"Scrolling through endless groups. \'Anyone know of gigs in Delhi?\' Seen by 247, replied by 0."',
            outcome: 'Miss opportunities because they weren\'t shared with YOU',
            accentColor: '#f97316',
        },
        {
            emoji: '💸',
            title: 'The Middleman Markup',
            quote: '"Your ₹10,000 gig becomes ₹3,000. After agent fees, manager cuts, and \'coordination charges\'."',
            outcome: 'Work hard, earn less, wonder why',
            accentColor: '#ef4444',
        },
        {
            emoji: '👻',
            title: 'The Payment Ghost',
            quote: '"I\'ll transfer it next week, promise." Next week becomes next month. Next month becomes never.',
            outcome: 'Bills don\'t wait. Neither should your payment.',
            accentColor: '#a855f7',
        },
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
                {/* Section header */}
                <View
                    style={{
                        alignItems: 'center',
                        marginBottom: isMobile ? 64 : 96,
                        maxWidth: isMobile ? '100%' : 680,
                        alignSelf: 'center',
                    }}
                >
                    <Text
                        style={{
                            fontSize: isMobile ? 10 : 12,
                            color: '#ef4444',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: 4,
                            marginBottom: 16,
                        }}
                    >
                        Sound Familiar?
                    </Text>
                    <Text
                        style={{
                            fontSize: isMobile ? 36 : isWeb ? 56 : 40,
                            fontWeight: '900',
                            color: '#fff',
                            textAlign: 'center',
                            marginBottom: isMobile ? 20 : 24,
                            letterSpacing: -1.5,
                            lineHeight: isMobile ? 40 : isWeb ? 62 : 46,
                        }}
                    >
                        Tired of the{'\n'}Same Old Story?
                    </Text>
                    <Text
                        style={{
                            fontSize: isMobile ? 15 : 17,
                            color: '#71717a',
                            textAlign: 'center',
                            lineHeight: isMobile ? 24 : 28,
                            fontWeight: '400',
                        }}
                    >
                        You're not alone. But here's the thing — it doesn't have to be this way.
                    </Text>
                </View>

                {/* Problem cards */}
                <View
                    style={{
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? 20 : 28,
                    }}
                >
                    {problems.map((problem) => (
                        <ProblemCard
                            key={problem.title}
                            {...problem}
                            isMobile={isMobile}
                        />
                    ))}
                </View>

                {/* Transition copy */}
                <View
                    style={{
                        marginTop: isMobile ? 56 : 80,
                        alignItems: 'center',
                        paddingHorizontal: isMobile ? 0 : 32,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.08)',
                            borderRadius: 16,
                            paddingHorizontal: isMobile ? 24 : 40,
                            paddingVertical: isMobile ? 20 : 24,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: isMobile ? 15 : 17,
                                color: '#d4d4d8',
                                textAlign: 'center',
                                lineHeight: isMobile ? 24 : 28,
                                fontWeight: '400',
                            }}
                        >
                            Sound familiar? You're not alone. But here's the thing —{'\n'}
                            <Text style={{ color: '#fff', fontWeight: '700' }}>
                                it doesn't have to be this way.
                            </Text>
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
