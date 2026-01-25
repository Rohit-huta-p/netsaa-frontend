import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Sparkles, Menu, X } from 'lucide-react-native';
import { NETSA_COLORS } from '@/hooks/useThemeColors';

const isWeb = Platform.OS === 'web';

export default function LandingNavbar() {
    const router = useRouter();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!isWeb) return;

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = ['Opportunities', 'Workshops', 'Community', 'Mission'];

    return (
        <View
            style={{
                position: isWeb ? ('fixed' as any) : 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                backgroundColor: isScrolled ? 'rgba(0, 0, 0, 0.8)' : 'transparent',
                paddingVertical: isScrolled ? 16 : 24,
                borderBottomWidth: isScrolled ? 1 : 0,
                borderBottomColor: 'rgba(255, 255, 255, 0.1)',
            }}
        >
            {/* Backdrop blur simulation for non-web */}
            {isScrolled && !isWeb && (
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    }}
                />
            )}

            <View
                style={{
                    maxWidth: 1200,
                    marginHorizontal: 'auto',
                    paddingHorizontal: 24,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                {/* Logo */}
                <TouchableOpacity
                    onPress={() => router.push('/')}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                    <LinearGradient
                        colors={[NETSA_COLORS.netsa[5], NETSA_COLORS.netsa[10]] as const}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: NETSA_COLORS.netsa[10],
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.2,
                            shadowRadius: 20,
                        }}
                    >
                        <Sparkles size={24} color="#fff" />
                    </LinearGradient>
                    <Text
                        style={{
                            fontSize: 24,
                            fontWeight: '700',
                            color: '#fff',
                            letterSpacing: -1,
                        }}
                    >
                        NETSA
                    </Text>
                </TouchableOpacity>

                {/* Desktop Navigation */}
                {isWeb && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 32 }}>
                        {navItems.map((item) => (
                            <TouchableOpacity
                                key={item}
                                onPress={() => router.push(`/${item.toLowerCase()}` as any)}
                            >
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontWeight: '500',
                                        color: '#a1a1aa',
                                    }}
                                >
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        {/* Login Button */}
                        <TouchableOpacity
                            onPress={() => router.push('/(auth)/login')}
                            style={{
                                paddingHorizontal: 20,
                                paddingVertical: 10,
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: 8,
                            }}
                        >
                            <Text style={{ fontSize: 14, fontWeight: '500', color: '#fff' }}>
                                Login
                            </Text>
                        </TouchableOpacity>

                        {/* Join Button */}
                        <TouchableOpacity
                            onPress={() => router.push('/(auth)/register')}
                            style={{
                                paddingHorizontal: 20,
                                paddingVertical: 10,
                                backgroundColor: '#fff',
                                borderRadius: 8,
                            }}
                        >
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#000' }}>
                                Join the Stage
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Mobile Menu Button */}
                {!isWeb && (
                    <TouchableOpacity
                        onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
                        style={{ padding: 8 }}
                    >
                        {mobileMenuOpen ? (
                            <X size={24} color="#fff" />
                        ) : (
                            <Menu size={24} color="#fff" />
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* Mobile Menu */}
            {mobileMenuOpen && !isWeb && (
                <View
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: '#18181b',
                        borderBottomWidth: 1,
                        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                        padding: 24,
                        gap: 16,
                    }}
                >
                    {navItems.map((item) => (
                        <TouchableOpacity
                            key={item}
                            onPress={() => {
                                setMobileMenuOpen(false);
                                router.push(`/${item.toLowerCase()}` as any);
                            }}
                        >
                            <Text style={{ fontSize: 18, fontWeight: '500', color: '#a1a1aa' }}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    <View style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', marginVertical: 8 }} />

                    <TouchableOpacity
                        onPress={() => {
                            setMobileMenuOpen(false);
                            router.push('/(auth)/login');
                        }}
                        style={{
                            paddingVertical: 12,
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: 8,
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: '500', color: '#fff' }}>
                            Login
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            setMobileMenuOpen(false);
                            router.push('/(auth)/register');
                        }}
                        style={{
                            paddingVertical: 12,
                            backgroundColor: '#fff',
                            borderRadius: 8,
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#000' }}>
                            Join the Stage
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
