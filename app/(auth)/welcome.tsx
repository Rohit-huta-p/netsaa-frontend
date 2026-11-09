// app/(auth)/welcome.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Briefcase, Crown, Star } from 'lucide-react-native';

const C = {
    bg: '#121216',
    orange: '#FF6B35',
    purple: '#8B5CF6',
    text0: '#F3EFE8',
    text2: '#71717a',
    text3: '#52525b',
    hair: 'rgba(255,255,255,0.08)',
    hairOrange: 'rgba(255,107,53,0.28)',
    bgOrange: 'rgba(255,107,53,0.055)',
    bgPurple: 'rgba(139,92,246,0.055)',
    iconOrange: 'rgba(255,107,53,0.14)',
    iconPurple: 'rgba(139,92,246,0.14)',
};

const CARDS = [
    {
        role: 'client',
        Icon: Briefcase,
        tint: C.orange,
        iconBg: C.iconOrange,
        cardBg: C.bgOrange,
        cardBorder: C.hairOrange,
        title: "I'm a Client",
        blurb: 'Post work, get proposals from Creative Leads',
    },
    {
        role: 'creative_lead',
        Icon: Crown,
        tint: C.purple,
        iconBg: C.iconPurple,
        cardBg: 'rgba(255,255,255,0.03)',
        cardBorder: C.hair,
        title: "I'm a Creative Lead",
        blurb: 'Win client work, hire artists to deliver it',
    },
    {
        role: 'artist',
        Icon: Star,
        tint: C.purple,
        iconBg: C.iconPurple,
        cardBg: 'rgba(255,255,255,0.03)',
        cardBorder: C.hair,
        title: "I'm an Artist",
        blurb: 'Find gigs from Creative Leads, get hired',
    },
] as const;

export default function Welcome() {
    const router = useRouter();

    const pick = (role: string) => {
        if (role === 'client') {
            router.push('/(auth)/client-signup' as any);
        } else {
            router.push({ pathname: '/(auth)/register', params: { role } } as any);
        }
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
                        How will you{'\n'}use NETSA?
                    </Text>
                    <Text style={s.sub}>Pick one to get started. Switch anytime in Settings.</Text>

                    {CARDS.map((c) => (
                        <Pressable
                            key={c.role}
                            onPress={() => pick(c.role)}
                            style={[s.card, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}
                        >
                            <View style={[s.iconWrap, { backgroundColor: c.iconBg }]}>
                                <c.Icon size={16} color={c.tint} strokeWidth={2} />
                            </View>
                            <View style={s.cardText}>
                                <Text style={s.cardTitle}>{c.title}</Text>
                                <Text style={s.cardBlurb}>{c.blurb}</Text>
                            </View>
                        </Pressable>
                    ))}

                    <Text style={s.hint}>Role can be changed later in Settings</Text>

                    <Pressable onPress={() => router.push('/(auth)/login' as any)} style={s.loginRow}>
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
        marginBottom: 22,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 10,
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
    cardTitle: {
        fontFamily: 'Outfit-Bold',
        color: C.text0,
        fontSize: 13.5,
        marginBottom: 2,
    },
    cardBlurb: {
        fontFamily: 'Outfit-Regular',
        color: C.text3,
        fontSize: 11.5,
        lineHeight: 16,
    },
    hint: {
        fontFamily: 'SpaceMono-Regular',
        color: 'rgba(255,255,255,0.22)',
        fontSize: 9.5,
        letterSpacing: 0.6,
        textAlign: 'center' as const,
        marginTop: 8,
        marginBottom: 18,
    },
    loginRow: { alignItems: 'center' },
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
