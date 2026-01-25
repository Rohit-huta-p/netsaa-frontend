import React, { useEffect, useRef } from 'react';
import { View, Text, Platform, Animated, Easing, useWindowDimensions, StyleSheet } from 'react-native';
import { NETSA_COLORS } from '@/hooks/useThemeColors';

const isWeb = Platform.OS === 'web';

// Marquee item component
const MarqueeContent = ({ isMobile, isTablet }: { isMobile: boolean; isTablet: boolean }) => {
    const categories = ['DANCE', 'MUSIC', 'THEATER', 'MODELING'];
    const colors = [NETSA_COLORS.netsa[5], NETSA_COLORS.netsa[10], NETSA_COLORS.netsa[3], NETSA_COLORS.netsa[5]];

    // Responsive sizing
    const fontSize = isMobile ? 64 : isTablet ? 120 : isWeb ? 192 : 80;
    const orbSize = isMobile ? 40 : isTablet ? 64 : isWeb ? 96 : 48;
    const gap = isMobile ? 40 : isTablet ? 60 : 80;

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap }}>
            {categories.map((category, index) => (
                <React.Fragment key={`${category}-${index}`}>
                    <Text
                        style={{
                            fontSize,
                            fontWeight: '900',
                            color: '#fff',
                            opacity: 0.2,
                            letterSpacing: isMobile ? -2 : -4,
                            fontStyle: 'italic',
                        }}
                    >
                        {category}
                    </Text>
                    <View
                        style={{
                            width: orbSize,
                            height: orbSize,
                            borderRadius: orbSize / 2,
                            backgroundColor: colors[index],
                            opacity: 0.2,
                        }}
                    />
                </React.Fragment>
            ))}
        </View>
    );
};

// Web-specific CSS animation wrapper
const WebMarquee = ({ isMobile, isTablet }: { isMobile: boolean; isTablet: boolean }) => {
    if (!isWeb) return null;

    const duration = isMobile ? 20 : isTablet ? 22 : 25;

    return (
        <View
            style={{
                display: 'flex',
                flexDirection: 'row',
                whiteSpace: 'nowrap',
                animation: `scroll ${duration}s linear infinite`,
            } as any}
        >
            <MarqueeContent isMobile={isMobile} isTablet={isTablet} />
            <MarqueeContent isMobile={isMobile} isTablet={isTablet} />
            {!isMobile && <MarqueeContent isMobile={isMobile} isTablet={isTablet} />}
        </View>
    );
};

// Native marquee with Animated API
const NativeMarquee = ({ isMobile, isTablet }: { isMobile: boolean; isTablet: boolean }) => {
    const scrollAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const duration = isMobile ? 20000 : isTablet ? 22000 : 25000;

        Animated.loop(
            Animated.timing(scrollAnim, {
                toValue: -1000,
                duration,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, [isMobile, isTablet]);

    return (
        <View style={{ flexDirection: 'row' }}>
            <Animated.View
                style={{
                    flexDirection: 'row',
                    transform: [{ translateX: scrollAnim }],
                }}
            >
                <MarqueeContent isMobile={isMobile} isTablet={isTablet} />
            </Animated.View>
            <Animated.View
                style={{
                    flexDirection: 'row',
                    transform: [{ translateX: scrollAnim }],
                }}
            >
                <MarqueeContent isMobile={isMobile} isTablet={isTablet} />
            </Animated.View>
            {!isMobile && (
                <Animated.View
                    style={{
                        flexDirection: 'row',
                        transform: [{ translateX: scrollAnim }],
                    }}
                >
                    <MarqueeContent isMobile={isMobile} isTablet={isTablet} />
                </Animated.View>
            )}
        </View>
    );
};

export default function CategoryMarquee() {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    useEffect(() => {
        // Inject CSS keyframes for web
        if (isWeb && typeof document !== 'undefined') {
            const styleId = 'category-marquee-styles';
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = `
                    @keyframes scroll {
                        0% {
                            transform: translateX(0);
                        }
                        100% {
                            transform: translateX(-50%);
                        }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }, []);

    return (
        <View
            style={{
                paddingVertical: isMobile ? 48 : isTablet ? 72 : 96,
                backgroundColor: '#000',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 10,
            }}
        >
            {isWeb ? (
                <WebMarquee isMobile={isMobile} isTablet={isTablet} />
            ) : (
                <NativeMarquee isMobile={isMobile} isTablet={isTablet} />
            )}
        </View>
    );
}