import React from 'react';
import { View, Text, Platform, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, ShieldCheck, Users } from 'lucide-react-native';
import { NETSA_COLORS } from '@/hooks/useThemeColors';

const isWeb = Platform.OS === 'web';

interface FeatureCardProps {
    icon: any;
    title: string;
    description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    return (
        <View
            style={{
                flex: 1,
                minWidth: isMobile ? '100%' : isWeb ? 300 : '100%',
                padding: isMobile ? 24 : 32,
                borderRadius: isMobile ? 24 : 32,
                backgroundColor: 'rgba(24, 24, 27, 0.5)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.05)',
                overflow: 'hidden',
            }}
        >
            {/* Background icon (decorative) */}
            <View
                style={{
                    position: 'absolute',
                    top: isMobile ? -20 : 0,
                    right: isMobile ? -20 : 0,
                    padding: 16,
                    opacity: 0.03,
                }}
            >
                <Icon size={isMobile ? 120 : 160} color="#fff" />
            </View>

            {/* Icon container */}
            <LinearGradient
                colors={[NETSA_COLORS.netsa[5], NETSA_COLORS.netsa[10]] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    width: isMobile ? 48 : 56,
                    height: isMobile ? 48 : 56,
                    borderRadius: isMobile ? 12 : 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: isMobile ? 24 : 32,
                }}
            >
                <Icon size={isMobile ? 24 : 28} color="#fff" />
            </LinearGradient>

            <Text
                style={{
                    fontSize: isMobile ? 20 : 24,
                    fontWeight: '700',
                    color: '#fff',
                    marginBottom: isMobile ? 12 : 16,
                    letterSpacing: -0.5,
                }}
            >
                {title}
            </Text>

            <Text
                style={{
                    fontSize: isMobile ? 14 : 16,
                    color: '#a1a1aa',
                    lineHeight: isMobile ? 22 : 26,
                }}
            >
                {description}
            </Text>
        </View>
    );
};

export default function FeaturesSection() {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    const features = [
        {
            icon: Zap,
            title: 'Centralized Discovery',
            description: 'Stop hunting in WhatsApp groups. Access a curated marketplace of gigs, workshops, and competitions in one place.',
        },
        {
            icon: ShieldCheck,
            title: 'Escrow Payments',
            description: 'Secure agreements and guaranteed payments. We hold funds so you never have to chase a payment again.',
        },
        {
            icon: Users,
            title: 'Verified Ecosystem',
            description: 'No more scams. Verified profiles for artists and organizers with a transparent rating system for every gig.',
        },
    ];

    return (
        <View
            style={{
                paddingVertical: isMobile ? 64 : isTablet ? 96 : 128,
                paddingHorizontal: isMobile ? 16 : 24,
                backgroundColor: '#000',
                overflow: 'hidden',
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
                        marginBottom: isMobile ? 48 : isTablet ? 64 : 80,
                        maxWidth: isMobile ? '100%' : 700,
                        alignSelf: 'center',
                    }}
                >
                    <Text
                        style={{
                            fontSize: isMobile ? 32 : isWeb ? 60 : 36,
                            fontWeight: '900',
                            color: '#fff',
                            textAlign: 'center',
                            marginBottom: isMobile ? 16 : 24,
                            letterSpacing: -2,
                            fontStyle: 'italic',
                        }}
                    >
                        Professionalizing the Passion.
                    </Text>
                    <Text
                        style={{
                            fontSize: isMobile ? 14 : isWeb ? 20 : 16,
                            color: '#a1a1aa',
                            textAlign: 'center',
                            lineHeight: isMobile ? 22 : isWeb ? 32 : 26,
                            fontWeight: '300',
                            paddingHorizontal: isMobile ? 8 : 0,
                        }}
                    >
                        For too long, Indian artists have struggled with fragmented networks, unfair pay, and lack of respect. NETSA is here to build the infrastructure you deserve.
                    </Text>
                </View>

                {/* Feature cards */}
                <View
                    style={{
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? 16 : 32,
                    }}
                >
                    {features.map((feature, index) => (
                        <FeatureCard key={index} {...feature} />
                    ))}
                </View>
            </View>
        </View>
    );
}