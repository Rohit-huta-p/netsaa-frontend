import React from 'react';
import { View, Text, Platform, useWindowDimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Zap, Shield } from 'lucide-react-native';
import { NETSA_COLORS } from '@/hooks/useThemeColors';
import { useParallax } from '@/hooks/useParallax';

const isWeb = Platform.OS === 'web';

interface FeatureCardProps {
    icon: any;
    title: string;
    description: string;
    cardAnim?: { opacity: Animated.AnimatedInterpolation<number>; translateY: Animated.AnimatedInterpolation<number>; scale: Animated.AnimatedInterpolation<number> };
}

const FeatureCard = ({ icon: Icon, title, description, cardAnim }: FeatureCardProps) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    return (
        <Animated.View
            style={{
                flex: 1,
                minWidth: isMobile ? '100%' : isWeb ? 300 : '100%',
                padding: isMobile ? 36 : 48,
                borderRadius: isMobile ? 28 : 36,
                backgroundColor: 'rgba(24, 24, 27, 0.5)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.05)',
                overflow: 'hidden',
                opacity: cardAnim ? cardAnim.opacity : 1,
                transform: cardAnim ? [
                    { translateY: cardAnim.translateY },
                    { scale: cardAnim.scale },
                ] : undefined,
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
                    marginBottom: isMobile ? 32 : 48,
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
                    lineHeight: isMobile ? 24 : 30,
                }}
            >
                {description}
            </Text>
        </Animated.View>
    );
};

export default function FeaturesSection({ scrollY, sectionIndex }: { scrollY?: any; sectionIndex?: number }) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    const features = [
        {
            icon: Search,
            title: 'Discover Every Opportunity',
            description: 'Every workshop, concert, corporate event, and competition in India — real-time updates, location-based alerts, genre & skill matching. No more \'I wish I\'d known about that.\'',
        },
        {
            icon: Zap,
            title: 'Apply Direct. Get Hired Faster.',
            description: 'Your portfolio goes straight to the organizer\'s inbox. Zero intermediaries. Keep 95% of your fee — just a 5% platform fee on bookings.',
        },
        {
            icon: Shield,
            title: 'Get Paid. Always.',
            description: 'Money held in escrow until your gig is completed. No more chasing, no more excuses. Automatic release, dispute protection, 24hr support.',
        },
    ];

    return (
        <View
            style={{
                paddingVertical: isMobile ? 96 : isTablet ? 128 : 176,
                paddingHorizontal: isMobile ? 20 : 24,
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
                        marginBottom: isMobile ? 72 : isTablet ? 96 : 120,
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
                        }}
                    >
                        Welcome to NETSA.{'\n'}Where Artists Control Their Careers.
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
                        No middlemen. No missed gigs. No more paying you in exposure. NETSA connects you directly with verified organizers across India.
                    </Text>
                </View>

                {/* Feature cards */}
                <View
                    style={{
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? 24 : 48,
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