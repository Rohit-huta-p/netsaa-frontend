// app/(auth)/welcome.tsx
// Variant A — "Diagonal Stage" role picker.
// Two warm cards staggered diagonally, cutout performer illustrations floating over them.
import { View, Text, Pressable, Image, ScrollView, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

const C = {
    bg: '#121216',
    orange: '#FF6B35',
    cream: '#F3EFE8',
    muted: '#6b6b73',
    // cards (warm, solid)
    cardArtist: '#362A93',
    cardCL: '#9E4C15',
    bdArtist: '#6A61AF',
    bdCL: '#BD7838',
    // card text (legible on the warm fills)
    fg: '#FDF6EE',
    fg2: '#ECD9C7',
    lbl: '#FFC79E',
};

function Glow({ style, color, id }: { style: any; color: string; id: string }) {
    return (
        <Svg style={[{ position: 'absolute' }, style]} pointerEvents="none">
            <Defs>
                <RadialGradient id={id} cx="50%" cy="45%" r="55%">
                    <Stop offset="0%" stopColor={color} stopOpacity="0.17" />
                    <Stop offset="100%" stopColor={color} stopOpacity="0" />
                </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
        </Svg>
    );
}

export default function Welcome() {
    const router = useRouter();

    const pick = (role: string) => {
        router.push({ pathname: '/(auth)/register', params: { role } } as any);
    };

    return (
        <View style={s.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" backgroundColor={C.bg} />
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                <ScrollView
                    contentContainerStyle={s.scroll}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={s.head}>
                        <Text style={s.kick}>THE STAGE IS YOURS</Text>
                        <Text style={s.h}>Step into{'\n'}your role</Text>
                        <Text style={s.sub0}>Two ways to move through NETSA.</Text>
                    </View>

                    {/* Stage */}
                    <View style={s.stage}>
                        <Glow id="glowCL" color="#FF8A4C" style={{ right: -14, top: -8, width: 185, height: 212 }} />
                        <Glow id="glowArtist" color="#FF8A4C" style={{ left: -6, top: 306, width: 208, height: 150 }} />

                        {/* Creative Lead card */}
                        <Pressable
                            onPress={() => pick('creative_lead')}
                            style={({ pressed }) => [s.card, s.cardCL, pressed && s.pressed]}
                        >
                            <Text style={s.lbl}>I AM A</Text>
                            <Text style={s.role}>Creative{'\n'}Lead</Text>
                            <Text style={s.cardsub}>Post gigs to hire artists,{'\n'}and events they register for.</Text>
                        </Pressable>

                        {/* Creative Lead figure */}
                        <View pointerEvents="none" style={s.figCL}>
                            <Image source={require('@/assets/creative_lead.png')} style={s.figImg} resizeMode="contain" />
                        </View>

                        {/* Artist figure */}
                        <View pointerEvents="none" style={s.figArtist}>
                            <Image source={require('@/assets/artist.png')} style={s.figImg} resizeMode="contain" />
                        </View>

                        {/* Artist card */}
                        <Pressable
                            onPress={() => pick('artist')}
                            style={({ pressed }) => [s.card, s.cardArtist, pressed && s.pressed]}
                        >
                            <Text style={[s.lbl, s.right]}>I AM AN</Text>
                            <Text style={[s.role, s.right]}>Artist</Text>
                            <Text style={[s.cardsub, s.right]}>Your craft, center stage —{'\n'}get seen, get booked.</Text>
                        </Pressable>
                    </View>

                    {/* Login */}
                    <Pressable onPress={() => router.push('/(auth)/login' as any)} style={s.login}>
                        <Text style={s.loginText}>
                            Already with us? <Text style={s.loginAccent}>Log in</Text>
                        </Text>
                    </Pressable>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    scroll: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 20 },

    head: { marginTop: 40, alignItems: 'center' },
    kick: {
        fontFamily: 'SpaceMono-Regular',
        color: C.orange,
        fontSize: 9.5,
        letterSpacing: 2.5,
        marginBottom: 10,
        textAlign: 'center',
    },
    h: {
        fontFamily: 'DMSerifDisplay_400Regular',
        color: C.cream,
        fontSize: 31,
        lineHeight: 34,
        letterSpacing: -0.4,
        textAlign: 'center',
    },
    sub0: {
        fontFamily: 'Outfit-Regular',
        color: C.muted,
        fontSize: 12.5,
        lineHeight: 18,
        marginTop: 8,
        textAlign: 'center',
    },

    stage: { position: 'relative', height: 466, marginTop: 20 },

    card: {
        position: 'absolute',
        width: 300,
        minHeight: 148,
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 18,
        paddingVertical: 16,
        justifyContent: 'center',
    },
    cardCL: {
        top: 12,
        left: -40,
        paddingLeft: 38,
        backgroundColor: C.cardCL,
        borderColor: C.bdCL,
        alignItems: 'flex-start',
    },
    cardArtist: {
        top: 250,
        right: -40,
        paddingRight: 38,
        backgroundColor: C.cardArtist,
        borderColor: C.bdArtist,
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
    },
    pressed: { opacity: 0.88 },

    lbl: {
        fontFamily: 'SpaceMono-Regular',
        color: C.lbl,
        fontSize: 9,
        letterSpacing: 2,
        marginBottom: 8,
    },
    role: {
        fontFamily: 'DMSerifDisplay_400Regular',
        color: C.fg,
        fontSize: 24,
        lineHeight: 26,
        letterSpacing: -0.3,
    },
    cardsub: {
        fontFamily: 'Outfit-Regular',
        color: C.fg2,
        fontSize: 11,
        lineHeight: 15,
        marginTop: 10,
    },
    right: { textAlign: 'right' },

    figCL: { position: 'absolute', right: -6, top: 10, width: 150, height: 220, zIndex: 3 },
    figArtist: { position: 'absolute', left: -22, top: 300, width: 230, height: 118, zIndex: 3 },
    figImg: { width: '100%', height: '100%' },

    login: { alignItems: 'center', marginTop: 'auto', paddingTop: 20 },
    loginText: { fontFamily: 'Outfit-Regular', color: 'rgba(255,255,255,0.42)', fontSize: 13 },
    loginAccent: { color: C.orange, fontFamily: 'Outfit-Bold' },
});
