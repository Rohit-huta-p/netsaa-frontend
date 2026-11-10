// app/(auth)/welcome.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Crown, Star } from 'lucide-react-native';

const C = {
    bg: '#121216',
    orange: '#FF6B35',
    purple: '#8B5CF6',
    text0: '#F3EFE8',
    text2: '#71717a',
    text3: '#52525b',
    hair: 'rgba(255,255,255,0.08)',
    hairPurple: 'rgba(139,92,246,0.3)',
    bgPurple: 'rgba(139,92,246,0.06)',
    iconPurple: 'rgba(139,92,246,0.14)',
};

export default function Welcome() {
    const router = useRouter();

    const pick = (role: string) => {
        router.push({ pathname: '/(auth)/register', params: { role } } as any);
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={s.root}>
                <View style={s.inner}>
                    {/* Brand mark */}
                    <Text style={s.brandMark}>
                        NET<Text style={{ color: C.orange }}>·</Text>SA
                    </Text>

                    <Text style={s.headline}>
                        Who are you{'\n'}in the arts?
                    </Text>
                    <Text style={s.sub}>
                        Choose your role to get the right experience.{'\n'}You can switch later in Settings.
                    </Text>

                    {/* Artist card — the familiar path */}
                    <Pressable
                        onPress={() => pick('artist')}
                        style={[s.card, s.cardArtist]}
                    >
                        <View style={[s.iconWrap, { backgroundColor: C.iconPurple }]}>
                            <Star size={16} color={C.purple} strokeWidth={2} />
                        </View>
                        <View style={s.cardText}>
                            <Text style={s.cardTitle}>I'm an Artist</Text>
                            <Text style={s.cardBlurb}>
                                Build a profile, apply to gigs, get booked for performances.
                            </Text>
                        </View>
                    </Pressable>

                    {/* Creative Lead card — new concept, needs more context */}
                    <Pressable
                        onPress={() => pick('creative_lead')}
                        style={[s.card, s.cardCL]}
                    >
                        <View style={[s.iconWrap, { backgroundColor: 'rgba(139,92,246,0.2)', marginTop: 2 }]}>
                            <Crown size={16} color={C.purple} strokeWidth={2} />
                        </View>
                        <View style={s.cardText}>
                            <View style={s.clTitleRow}>
                                <Text style={s.cardTitle}>I'm a Creative Lead</Text>
                                <View style={s.newBadge}>
                                    <Text style={s.newBadgeText}>NEW</Text>
                                </View>
                            </View>
                            <Text style={s.cardBlurb}>
                                You lead projects — win work from clients, then hire artists to execute it.
                            </Text>
                            <Text style={s.cardExample}>
                                Choreographers · Bandleaders · Event production companies
                            </Text>
                        </View>
                    </Pressable>

                    {/* Login link */}
                    <Pressable
                        onPress={() => router.push('/(auth)/login' as any)}
                        style={s.loginRow}
                    >
                        <Text style={s.loginText}>
                            Already have an account?{' '}
                            <Text style={s.loginAccent}>Log in</Text>
                        </Text>
                    </Pressable>
                </View>
            </View>
        </>
    );
}

const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: C.bg,
    },
    inner: {
        flex: 1,
        paddingHorizontal: 22,
        justifyContent: 'center',
    },
    brandMark: {
        fontFamily: 'SpaceMono-Bold',
        color: 'rgba(255,255,255,0.75)',
        fontSize: 11,
        letterSpacing: 4,
        textTransform: 'uppercase' as const,
        marginBottom: 24,
    },
    headline: {
        fontFamily: 'DMSerifDisplay_400Regular',
        color: C.text0,
        fontSize: 28,
        lineHeight: 32,
        marginBottom: 6,
    },
    sub: {
        fontFamily: 'Outfit-Regular',
        color: C.text2,
        fontSize: 12.5,
        lineHeight: 18,
        marginBottom: 24,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 10,
    },
    cardArtist: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: C.hair,
    },
    cardCL: {
        backgroundColor: C.bgPurple,
        borderColor: C.hairPurple,
    },
    iconWrap: {
        width: 34,
        height: 34,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    cardText: { flex: 1 },
    clTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        marginBottom: 2,
    },
    cardTitle: {
        fontFamily: 'Outfit-Bold',
        color: C.text0,
        fontSize: 13.5,
    },
    newBadge: {
        backgroundColor: 'rgba(139,92,246,0.18)',
        borderRadius: 4,
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    newBadgeText: {
        fontFamily: 'SpaceMono-Regular',
        color: C.purple,
        fontSize: 8,
        letterSpacing: 0.8,
    },
    cardBlurb: {
        fontFamily: 'Outfit-Regular',
        color: C.text3,
        fontSize: 11.5,
        lineHeight: 16,
        marginBottom: 5,
    },
    cardExample: {
        fontFamily: 'Outfit-Regular',
        color: 'rgba(139,92,246,0.5)',
        fontSize: 10.5,
        lineHeight: 15,
        fontStyle: 'italic' as const,
    },
    loginRow: {
        alignItems: 'center',
        marginTop: 24,
    },
    loginText: {
        fontFamily: 'Outfit-Regular',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 13,
    },
    loginAccent: {
        color: C.orange,
        fontFamily: 'Outfit-Bold',
    },
});
