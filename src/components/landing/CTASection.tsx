import React from 'react';
import { View, Text, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { NETSA_COLORS } from '@/hooks/useThemeColors';

const isWeb = Platform.OS === 'web';

export default function CTASection() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    return (
        <View
            style={{
                paddingVertical: isMobile ? 64 : isTablet ? 96 : 128,
                paddingHorizontal: isMobile ? 16 : 24,
                backgroundColor: '#000',
            }}
        >
            <View
                style={{
                    maxWidth: 1200,
                    alignSelf: 'center',
                    width: '100%',
                }}
            >
                {/* CTA Card */}
                <View
                    style={{
                        position: 'relative',
                        padding: isMobile ? 32 : isTablet ? 64 : 128,
                        borderRadius: isMobile ? 24 : isWeb ? 64 : 32,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        shadowColor: NETSA_COLORS.netsa[10],
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.05,
                        shadowRadius: 40,
                    }}
                >
                    {/* Background gradient */}
                    <LinearGradient
                        colors={['#18181b', '#000'] as const}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                        }}
                    />

                    {/* Radial gradient overlay */}
                    <View
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'transparent',
                        }}
                    >
                        <LinearGradient
                            colors={['rgba(234, 105, 139, 0.1)', 'transparent'] as const}
                            start={{ x: 0.5, y: 0.5 }}
                            end={{ x: 0.5, y: 0 }}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                            }}
                        />
                    </View>

                    {/* Content */}
                    <View style={{ alignItems: 'center', zIndex: 10 }}>
                        {/* Badge */}
                        <View
                            style={{
                                backgroundColor: NETSA_COLORS.netsa[10],
                                paddingHorizontal: isMobile ? 16 : 24,
                                paddingVertical: isMobile ? 6 : 8,
                                borderRadius: 20,
                                marginBottom: isMobile ? 24 : 32,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: isMobile ? 10 : 12,
                                    fontWeight: '700',
                                    color: '#fff',
                                    textTransform: 'uppercase',
                                    letterSpacing: 3,
                                }}
                            >
                                Limited Beta
                            </Text>
                        </View>

                        {/* Headline */}
                        <Text
                            style={{
                                fontSize: isMobile ? 36 : isTablet ? 64 : isWeb ? 96 : 40,
                                fontWeight: '900',
                                color: '#fff',
                                textAlign: 'center',
                                lineHeight: isMobile ? 40 : isTablet ? 64 : isWeb ? 90 : 44,
                                letterSpacing: -2,
                                marginBottom: isMobile ? 24 : 32,
                            }}
                        >
                            Ready to take{'\n'}center stage?
                        </Text>

                        {/* Subtext */}
                        <Text
                            style={{
                                fontSize: isMobile ? 14 : isWeb ? 20 : 16,
                                color: '#a1a1aa',
                                textAlign: 'center',
                                lineHeight: isMobile ? 22 : isWeb ? 32 : 26,
                                maxWidth: isMobile ? '100%' : 600,
                                marginBottom: isMobile ? 32 : 48,
                                fontWeight: '300',
                                paddingHorizontal: isMobile ? 8 : 0,
                            }}
                        >
                            Join thousands of artists already professionalizing their careers. NETSA is your gateway to India's thriving creative economy.
                        </Text>

                        {/* Buttons */}
                        <View
                            style={{
                                flexDirection: isMobile ? 'column' : 'row',
                                gap: isMobile ? 16 : 24,
                                alignItems: 'center',
                                width: '100%',
                                maxWidth: isMobile ? 400 : undefined,
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => router.push('/(auth)/register')}
                                activeOpacity={0.8}
                                style={{
                                    shadowColor: '#fff',
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 20,
                                    width: isMobile ? '100%' : 'auto',
                                }}
                            >
                                <View
                                    style={{
                                        height: isMobile ? 56 : isWeb ? 80 : 64,
                                        paddingHorizontal: isMobile ? 24 : isWeb ? 64 : 32,
                                        backgroundColor: '#fff',
                                        borderRadius: isMobile ? 28 : isWeb ? 40 : 32,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: isMobile ? 16 : isWeb ? 20 : 18,
                                            fontWeight: '700',
                                            color: '#000',
                                        }}
                                    >
                                        Get Started Free
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push('/contact')}
                                activeOpacity={0.8}
                                style={{ width: isMobile ? '100%' : 'auto' }}
                            >
                                <View
                                    style={{
                                        height: isMobile ? 56 : isWeb ? 80 : 64,
                                        paddingHorizontal: isMobile ? 24 : isWeb ? 64 : 32,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                        borderRadius: isMobile ? 28 : isWeb ? 40 : 32,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: isMobile ? 16 : isWeb ? 20 : 18,
                                            fontWeight: '700',
                                            color: '#fff',
                                        }}
                                    >
                                        Talk to Us
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}