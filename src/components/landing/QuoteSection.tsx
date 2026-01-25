import React from 'react';
import { View, Text, Platform, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const isWeb = Platform.OS === 'web';

export default function QuoteSection() {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    return (
        <View
            style={{
                paddingVertical: isMobile ? 96 : isTablet ? 128 : 192,
                backgroundColor: '#fff',
                position: 'relative',
            }}
        >
            {/* Top gradient fade from black */}
            <LinearGradient
                colors={['#000', 'transparent'] as const}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: isMobile ? 64 : 128,
                }}
            />

            {/* Content */}
            <View
                style={{
                    paddingHorizontal: isMobile ? 16 : 24,
                    alignItems: 'center',
                }}
            >
                <Text
                    style={{
                        fontSize: isMobile ? 40 : isTablet ? 80 : isWeb ? 160 : 48,
                        fontWeight: '900',
                        color: '#000',
                        textAlign: 'center',
                        lineHeight: isMobile ? 44 : isTablet ? 72 : isWeb ? 140 : 52,
                        letterSpacing: isMobile ? -1 : -3,
                        marginBottom: isMobile ? 24 : 32,
                    }}
                >
                    "PERFORMING ART IS{'\n'}NOT JUST A HOBBY."
                </Text>

                <Text
                    style={{
                        fontSize: isMobile ? 14 : isTablet ? 18 : isWeb ? 24 : 16,
                        fontWeight: '700',
                        color: '#71717a',
                        textTransform: 'uppercase',
                        letterSpacing: isMobile ? 4 : 6,
                        textAlign: 'center',
                    }}
                >
                    The NETSA Manifesto
                </Text>
            </View>

            {/* Bottom gradient fade to black */}
            <LinearGradient
                colors={['transparent', '#000'] as const}
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: isMobile ? 64 : 128,
                }}
            />
        </View>
    );
}