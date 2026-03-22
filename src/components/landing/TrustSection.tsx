import React from 'react';
import { View, Text, Platform, useWindowDimensions } from 'react-native';
import { CheckCircle, Lock, MessageCircle, Shield } from 'lucide-react-native';
import { NETSA_COLORS } from '@/hooks/useThemeColors';

const isWeb = Platform.OS === 'web';

interface PillarProps {
    icon: any;
    title: string;
    description: string;
    accentColor: string;
    isMobile: boolean;
}

const Pillar = ({ icon: Icon, title, description, accentColor, isMobile }: PillarProps) => (
    <View
        style={{
            flex: 1,
            minWidth: isMobile ? '100%' : 260,
            padding: isMobile ? 28 : 36,
            borderRadius: isMobile ? 20 : 24,
            backgroundColor: 'rgba(24,24,27,0.5)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
        }}
    >
        {/* Icon badge */}
        <View
            style={{
                width: isMobile ? 48 : 56,
                height: isMobile ? 48 : 56,
                borderRadius: isMobile ? 14 : 16,
                backgroundColor: `${accentColor}15`,
                borderWidth: 1,
                borderColor: `${accentColor}30`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: isMobile ? 16 : 20,
            }}
        >
            <Icon size={isMobile ? 22 : 26} color={accentColor} />
        </View>

        <Text
            style={{
                fontSize: isMobile ? 17 : 19,
                fontWeight: '700',
                color: '#fff',
                marginBottom: 10,
                letterSpacing: -0.3,
            }}
        >
            {title}
        </Text>

        <Text
            style={{
                fontSize: isMobile ? 13 : 14,
                color: '#71717a',
                lineHeight: isMobile ? 20 : 24,
            }}
        >
            {description}
        </Text>
    </View>
);

export default function TrustSection({ scrollY, sectionIndex }: { scrollY?: any; sectionIndex?: number }) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    const pillars = [
        {
            icon: CheckCircle,
            title: 'Verification',
            description: 'Every organizer is ID-verified. Every artist profile is human-reviewed. Zero fake listings.',
            accentColor: '#22c55e',
        },
        {
            icon: Lock,
            title: 'Escrow',
            description: 'Payments held until work delivered. Automated release or dispute resolution. 100% fraud protection.',
            accentColor: NETSA_COLORS.netsa[10],
        },
        {
            icon: MessageCircle,
            title: 'Support',
            description: '24/7 artist support team. Response time: <2 hours. Dedicated account managers for every user.',
            accentColor: '#60a5fa',
        },
        {
            icon: Shield,
            title: 'Privacy',
            description: 'Bank-grade encryption. GDPR-compliant data handling. Your data is never sold — ever.',
            accentColor: '#a855f7',
        },
    ];

    const badges = ['🔐  SSL Secured', '✓  PCI Compliant', '🛡️  GDPR Ready'];

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
                        maxWidth: isMobile ? '100%' : 680,
                        alignSelf: 'center',
                    }}
                >
                    <Text
                        style={{
                            fontSize: isMobile ? 10 : 12,
                            color: '#22c55e',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: 4,
                            marginBottom: 16,
                        }}
                    >
                        Trust & Safety
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
                        Your Safety is Our Priority
                    </Text>
                </View>

                {/* 2×2 Pillar grid */}
                <View
                    style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: isMobile ? 16 : 24,
                        marginBottom: isMobile ? 48 : 72,
                    }}
                >
                    {pillars.map((p) => (
                        <Pillar key={p.title} {...p} isMobile={isMobile} />
                    ))}
                </View>

                {/* Trust badge strip */}
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: isMobile ? 16 : 32,
                        flexWrap: 'wrap',
                    }}
                >
                    {badges.map((badge) => (
                        <View
                            key={badge}
                            style={{
                                backgroundColor: 'rgba(34,197,94,0.08)',
                                borderWidth: 1,
                                borderColor: 'rgba(34,197,94,0.2)',
                                borderRadius: 20,
                                paddingHorizontal: isMobile ? 16 : 24,
                                paddingVertical: 10,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: isMobile ? 12 : 14,
                                    color: '#22c55e',
                                    fontWeight: '600',
                                }}
                            >
                                {badge}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}
