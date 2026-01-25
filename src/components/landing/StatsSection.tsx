import React from 'react';
import { View, Text, Platform, useWindowDimensions } from 'react-native';
import { NETSA_COLORS } from '@/hooks/useThemeColors';

const isWeb = Platform.OS === 'web';

interface StatCardProps {
    label: string;
    value: string;
    description: string;
}

const StatCard = ({ label, value, description }: StatCardProps) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    return (
        <View
            style={{
                flex: 1,
                minWidth: isMobile ? '100%' : 280,
                padding: isMobile ? 24 : 32,
                borderRadius: isMobile ? 12 : 16,
                backgroundColor: 'rgba(24, 24, 27, 0.5)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.05)',
            }}
        >
            {/* Top accent line */}
            <View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 1,
                    backgroundColor: 'transparent',
                }}
            />

            <Text
                style={{
                    fontSize: isMobile ? 10 : 12,
                    color: '#71717a',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: 3,
                    marginBottom: 8,
                }}
            >
                {label}
            </Text>

            <Text
                style={{
                    fontSize: isMobile ? 40 : isWeb ? 60 : 48,
                    fontWeight: '900',
                    color: '#fff',
                    marginTop: 8,
                    marginBottom: 8,
                    letterSpacing: -2,
                    fontStyle: 'italic',
                }}
            >
                {value}
            </Text>

            <Text
                style={{
                    fontSize: isMobile ? 13 : 14,
                    color: '#a1a1aa',
                    lineHeight: isMobile ? 20 : 22,
                }}
            >
                {description}
            </Text>
        </View>
    );
};

export default function StatsSection() {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    const stats = [
        {
            label: 'Market Size',
            value: '$3.8B',
            description: "India's performing arts market is booming and ready for a professional standard.",
        },
        {
            label: 'Growth Forecast',
            value: '$7B',
            description: 'Projected market value by 2027, driven by a surge in live events and digital media.',
        },
        {
            label: 'Participation',
            value: '26M',
            description: 'Millions of young Indians are pursuing music, dance, and theater as a career.',
        },
    ];

    return (
        <View
            style={{
                paddingVertical: isMobile ? 48 : isTablet ? 72 : 96,
                paddingHorizontal: isMobile ? 16 : 24,
                backgroundColor: '#09090b', // zinc-950
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
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? 16 : 32,
                    }}
                >
                    {stats.map((stat) => (
                        <StatCard key={stat.label} {...stat} />
                    ))}
                </View>
            </View>
        </View>
    );
}