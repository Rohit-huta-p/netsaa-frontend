import React from 'react';
import { View, Text, Platform, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, Bell, Star } from 'lucide-react-native';
import { NETSA_COLORS } from '@/hooks/useThemeColors';

const isWeb = Platform.OS === 'web';

interface StepProps {
    stepNumber: string;
    icon: any;
    title: string;
    tagline: string;
    description: string;
    bullets: string[];
    isLast: boolean;
    isMobile: boolean;
    accentColor: string;
}

const Step = ({ stepNumber, icon: Icon, title, tagline, description, bullets, isLast, isMobile, accentColor }: StepProps) => (
    <View
        style={{
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 20 : 40,
            alignItems: isMobile ? 'flex-start' : 'flex-start',
            position: 'relative',
        }}
    >
        {/* Step number + connector line */}
        <View style={{ alignItems: 'center', minWidth: isMobile ? undefined : 80 }}>
            {/* Step number circle */}
            <LinearGradient
                colors={[NETSA_COLORS.netsa[5], NETSA_COLORS.netsa[10]] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    width: isMobile ? 56 : 72,
                    height: isMobile ? 56 : 72,
                    borderRadius: isMobile ? 28 : 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: NETSA_COLORS.netsa[10],
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                }}
            >
                <Text
                    style={{
                        fontSize: isMobile ? 18 : 22,
                        fontWeight: '900',
                        color: '#fff',
                        letterSpacing: -1,
                    }}
                >
                    {stepNumber}
                </Text>
            </LinearGradient>

            {/* Vertical connector (not on last step) */}
            {!isLast && !isMobile && (
                <View
                    style={{
                        width: 2,
                        flex: 1,
                        minHeight: 80,
                        marginTop: 12,
                        backgroundColor: 'rgba(255,255,255,0.08)',
                    }}
                />
            )}
        </View>

        {/* Content */}
        <View
            style={{
                flex: 1,
                paddingBottom: isLast ? 0 : isMobile ? 40 : 64,
            }}
        >
            {/* Icon + title */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Icon size={20} color={accentColor} />
                <Text
                    style={{
                        fontSize: isMobile ? 20 : 24,
                        fontWeight: '800',
                        color: '#fff',
                        letterSpacing: -0.5,
                        flex: 1,
                    }}
                >
                    {title}
                </Text>
            </View>

            {/* Tagline */}
            <Text
                style={{
                    fontSize: isMobile ? 13 : 14,
                    color: accentColor,
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    marginBottom: 12,
                }}
            >
                {tagline}
            </Text>

            {/* Description */}
            <Text
                style={{
                    fontSize: isMobile ? 14 : 16,
                    color: '#a1a1aa',
                    lineHeight: isMobile ? 22 : 28,
                    marginBottom: 16,
                }}
            >
                {description}
            </Text>

            {/* Bullet points */}
            <View style={{ gap: 8 }}>
                {bullets.map((b) => (
                    <View key={b} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: accentColor,
                                opacity: 0.7,
                            }}
                        />
                        <Text style={{ fontSize: isMobile ? 13 : 14, color: '#71717a' }}>{b}</Text>
                    </View>
                ))}
            </View>
        </View>
    </View>
);

export default function HowItWorksSection({ scrollY, sectionIndex }: { scrollY?: any; sectionIndex?: number }) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    const steps = [
        {
            stepNumber: '01',
            icon: FileText,
            title: 'Create Your Profile',
            tagline: '2 Minutes',
            description: 'Add your skills, portfolio, and availability. Our AI helps you stand out from the crowd.',
            bullets: ['Upload photos & videos', 'Set your rates', 'Choose your locations'],
            accentColor: NETSA_COLORS.netsa[10],
        },
        {
            stepNumber: '02',
            icon: Bell,
            title: 'Get Matched to Perfect Gigs',
            tagline: 'Smart Matching',
            description: 'Our algorithm finds opportunities that fit YOUR talent. Apply with one tap.',
            bullets: ['Smart recommendations', 'Instant notifications', 'Save favourites'],
            accentColor: '#22c55e',
        },
        {
            stepNumber: '03',
            icon: Star,
            title: 'Get Booked. Get Paid. Get Famous.',
            tagline: 'Automatic & Secure',
            description: 'Organizer reviews your profile. You accept. Money in escrow. Perform. Get paid automatically.',
            bullets: ['Secure contracts', 'Automatic payments', 'Build your reputation'],
            accentColor: '#fbbf24',
        },
    ];

    return (
        <View
            style={{
                paddingVertical: isMobile ? 96 : isTablet ? 128 : 160,
                paddingHorizontal: isMobile ? 20 : 24,
                backgroundColor: '#000',
            }}
        >
            <View
                style={{
                    maxWidth: 800,
                    alignSelf: 'center',
                    width: '100%',
                }}
            >
                {/* Section header */}
                <View
                    style={{
                        alignItems: isMobile ? 'flex-start' : 'center',
                        marginBottom: isMobile ? 64 : 96,
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
                        How It Works
                    </Text>
                    <Text
                        style={{
                            fontSize: isMobile ? 34 : isWeb ? 52 : 38,
                            fontWeight: '900',
                            color: '#fff',
                            textAlign: isMobile ? 'left' : 'center',
                            letterSpacing: -1.5,
                            lineHeight: isMobile ? 40 : isWeb ? 60 : 44,
                        }}
                    >
                        Your Career, Three Steps Away
                    </Text>
                </View>

                {/* Steps */}
                <View style={{ gap: 0 }}>
                    {steps.map((step, index) => (
                        <Step
                            key={step.stepNumber}
                            {...step}
                            isLast={index === steps.length - 1}
                            isMobile={isMobile}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
}
