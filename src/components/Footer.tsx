import React from 'react';
import { View, Text, TouchableOpacity, Platform, Linking, useWindowDimensions } from 'react-native';
import { Sparkles, ArrowUpRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const MOBILE_BREAKPOINT = 768;
const isWeb = Platform.OS === 'web';

export default function Footer() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isMobile = width < MOBILE_BREAKPOINT;

    const handleLink = (path: string) => {
        if (path.startsWith('http')) {
            Linking.openURL(path);
        } else {
            router.push(path as any);
        }
    };

    const footerLinks = {
        platform: [
            { label: 'Find Gigs', path: '/gigs' },
            { label: 'Workshops', path: '/events' },
            { label: 'For Organizers', path: '/organizer' },
            { label: 'Verification', path: '/verification' },
        ],
        company: [
            { label: 'Our Vision', path: '/about' },
            { label: 'Manifesto', path: '/manifesto' },
            { label: 'Blog', path: '/blog' },
            { label: 'Contact', path: '/contact' },
        ],
        legal: [
            { label: 'Terms of Service', path: '/terms' },
            { label: 'Privacy Policy', path: '/privacy' },
            { label: 'Payment Security', path: '/security' },
        ],
    };

    const socialLinks = [
        { label: 'Instagram', url: 'https://instagram.com/netsa' },
        { label: 'LinkedIn', url: 'https://linkedin.com/company/netsa' },
        { label: 'Twitter', url: 'https://twitter.com/netsa' },
    ];

    return (
        <View
            style={{
                paddingVertical: isMobile ? 48 : 80,
                paddingHorizontal: isMobile ? 16 : 24,
                backgroundColor: '#09090b',
                borderTopWidth: 1,
                borderTopColor: 'rgba(255, 255, 255, 0.06)',
            }}
        >
            <View
                style={{
                    maxWidth: 1200,
                    alignSelf: 'center',
                    width: '100%',
                }}
            >
                {/* Main footer content */}
                <View
                    style={{
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? 40 : 64,
                        marginBottom: isMobile ? 40 : 64,
                    }}
                >
                    {/* Brand section */}
                    <View style={{ width: isMobile ? '100%' : undefined, flex: isMobile ? undefined : 1 }}>
                        <TouchableOpacity
                            onPress={() => router.push('/')}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 10,
                                marginBottom: isMobile ? 16 : 24,
                            }}
                        >
                            <View
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 8,
                                    backgroundColor: '#fff',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Sparkles size={20} color="#000" />
                            </View>
                            <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -1 }}>
                                NETSA
                            </Text>
                        </TouchableOpacity>
                        <Text
                            style={{
                                fontSize: isMobile ? 13 : 14,
                                color: '#71717a',
                                lineHeight: isMobile ? 20 : 24,
                                fontWeight: '400',
                                maxWidth: isMobile ? '100%' : 280,
                            }}
                        >
                            Empowering India's performing artists with technology, transparency, and trust.
                        </Text>
                    </View>

                    {/* Links Grid */}
                    <View
                        style={{
                            flexDirection: isMobile ? 'row' : 'column',
                            flexWrap: 'wrap',
                            gap: isMobile ? 32 : 48,
                            flex: 1,
                        }}
                    >
                        {/* Platform links */}
                        <View style={{ minWidth: isMobile ? '40%' : 'auto' }}>
                            <Text
                                style={{
                                    fontSize: 10,
                                    fontWeight: '700',
                                    color: '#fff',
                                    textTransform: 'uppercase',
                                    letterSpacing: 2.5,
                                    marginBottom: isMobile ? 14 : 20,
                                }}
                            >
                                Platform
                            </Text>
                            <View style={{ gap: isMobile ? 10 : 14 }}>
                                {footerLinks.platform.map((link) => (
                                    <TouchableOpacity key={link.label} onPress={() => handleLink(link.path)}>
                                        <Text style={{ fontSize: 13, color: '#71717a' }}>{link.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Company links */}
                        <View style={{ minWidth: isMobile ? '40%' : 'auto' }}>
                            <Text
                                style={{
                                    fontSize: 10,
                                    fontWeight: '700',
                                    color: '#fff',
                                    textTransform: 'uppercase',
                                    letterSpacing: 2.5,
                                    marginBottom: isMobile ? 14 : 20,
                                }}
                            >
                                Company
                            </Text>
                            <View style={{ gap: isMobile ? 10 : 14 }}>
                                {footerLinks.company.map((link) => (
                                    <TouchableOpacity key={link.label} onPress={() => handleLink(link.path)}>
                                        <Text style={{ fontSize: 13, color: '#71717a' }}>{link.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Legal links */}
                        <View style={{ minWidth: isMobile ? '40%' : 'auto' }}>
                            <Text
                                style={{
                                    fontSize: 10,
                                    fontWeight: '700',
                                    color: '#fff',
                                    textTransform: 'uppercase',
                                    letterSpacing: 2.5,
                                    marginBottom: isMobile ? 14 : 20,
                                }}
                            >
                                Legal
                            </Text>
                            <View style={{ gap: isMobile ? 10 : 14 }}>
                                {footerLinks.legal.map((link) => (
                                    <TouchableOpacity key={link.label} onPress={() => handleLink(link.path)}>
                                        <Text style={{ fontSize: 13, color: '#71717a' }}>{link.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Bottom bar */}
                <View
                    style={{
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'space-between',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        paddingTop: isMobile ? 24 : 32,
                        borderTopWidth: 1,
                        borderTopColor: 'rgba(255, 255, 255, 0.06)',
                        gap: isMobile ? 16 : 24,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 11,
                            fontWeight: '500',
                            color: '#52525b',
                            textTransform: 'uppercase',
                            letterSpacing: isMobile ? 1 : 2,
                        }}
                    >
                        © 2026 NETSA. All rights reserved.
                    </Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: isMobile ? 14 : 24 }}>
                        {socialLinks.map((link) => (
                            <TouchableOpacity
                                key={link.label}
                                onPress={() => Linking.openURL(link.url)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 11,
                                        fontWeight: '500',
                                        color: '#52525b',
                                        textTransform: 'uppercase',
                                        letterSpacing: 2,
                                    }}
                                >
                                    {link.label}
                                </Text>
                                <ArrowUpRight size={10} color="#52525b" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </View>
    );
}
