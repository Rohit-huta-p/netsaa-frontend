import React from 'react';
import { View, Text, TouchableOpacity, Platform, Linking } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const isWeb = Platform.OS === 'web';

export default function Footer() {
    const router = useRouter();

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
                paddingVertical: 96,
                paddingHorizontal: 24,
                backgroundColor: '#09090b',
                borderTopWidth: 1,
                borderTopColor: 'rgba(255, 255, 255, 0.05)',
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
                        flexDirection: isWeb ? 'row' : 'column',
                        gap: 64,
                        marginBottom: 96,
                    }}
                >
                    {/* Brand section */}
                    <View style={{ flex: isWeb ? 1 : undefined }}>
                        <TouchableOpacity
                            onPress={() => router.push('/')}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 32,
                            }}
                        >
                            <View
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 8,
                                    backgroundColor: '#fff',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Sparkles size={24} color="#000" />
                            </View>
                            <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff', letterSpacing: -1 }}>
                                NETSA
                            </Text>
                        </TouchableOpacity>
                        <Text
                            style={{
                                fontSize: 16,
                                color: '#71717a',
                                lineHeight: 26,
                                fontWeight: '300',
                                maxWidth: 300,
                            }}
                        >
                            Empowering India's performing artists with technology, transparency, and trust. Professionalizing the passion since 2026.
                        </Text>
                    </View>

                    {/* Platform links */}
                    <View>
                        <Text
                            style={{
                                fontSize: 11,
                                fontWeight: '700',
                                color: '#fff',
                                textTransform: 'uppercase',
                                letterSpacing: 3,
                                marginBottom: 32,
                            }}
                        >
                            Platform
                        </Text>
                        <View style={{ gap: 16 }}>
                            {footerLinks.platform.map((link) => (
                                <TouchableOpacity key={link.label} onPress={() => handleLink(link.path)}>
                                    <Text style={{ fontSize: 14, color: '#a1a1aa' }}>{link.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Company links */}
                    <View>
                        <Text
                            style={{
                                fontSize: 11,
                                fontWeight: '700',
                                color: '#fff',
                                textTransform: 'uppercase',
                                letterSpacing: 3,
                                marginBottom: 32,
                            }}
                        >
                            Company
                        </Text>
                        <View style={{ gap: 16 }}>
                            {footerLinks.company.map((link) => (
                                <TouchableOpacity key={link.label} onPress={() => handleLink(link.path)}>
                                    <Text style={{ fontSize: 14, color: '#a1a1aa' }}>{link.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Legal links */}
                    <View>
                        <Text
                            style={{
                                fontSize: 11,
                                fontWeight: '700',
                                color: '#fff',
                                textTransform: 'uppercase',
                                letterSpacing: 3,
                                marginBottom: 32,
                            }}
                        >
                            Legal
                        </Text>
                        <View style={{ gap: 16 }}>
                            {footerLinks.legal.map((link) => (
                                <TouchableOpacity key={link.label} onPress={() => handleLink(link.path)}>
                                    <Text style={{ fontSize: 14, color: '#a1a1aa' }}>{link.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Bottom bar */}
                <View
                    style={{
                        flexDirection: isWeb ? 'row' : 'column',
                        justifyContent: 'space-between',
                        alignItems: isWeb ? 'center' : 'flex-start',
                        paddingTop: 48,
                        borderTopWidth: 1,
                        borderTopColor: 'rgba(255, 255, 255, 0.05)',
                        gap: 24,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 11,
                            fontWeight: '500',
                            color: '#52525b',
                            textTransform: 'uppercase',
                            letterSpacing: 3,
                        }}
                    >
                        © 2026 NETSA. All rights reserved.
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 32 }}>
                        {socialLinks.map((link) => (
                            <TouchableOpacity key={link.label} onPress={() => Linking.openURL(link.url)}>
                                <Text
                                    style={{
                                        fontSize: 11,
                                        fontWeight: '500',
                                        color: '#52525b',
                                        textTransform: 'uppercase',
                                        letterSpacing: 3,
                                    }}
                                >
                                    {link.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </View>
    );
}
