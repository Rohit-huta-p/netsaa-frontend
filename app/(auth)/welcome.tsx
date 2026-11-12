// app/(auth)/welcome.tsx
// Variant A — "Diagonal Stage" role picker.
// Two warm cards staggered diagonally, cutout performer illustrations floating over them.
import { useCallback, useRef, useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, StatusBar, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
    useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS, useReducedMotion,
} from 'react-native-reanimated';

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

// Role → step entry transition: a disk bursts from the tapped card and fills the screen,
// carrying the role's accent into the first register step.
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const DIAG = Math.sqrt(SCREEN_W * SCREEN_W + SCREEN_H * SCREEN_H);
const DISK_D = 48;                           // base disk diameter
const FULL_SCALE = (2 * DIAG) / DISK_D + 1;  // large enough to cover from any origin
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const EASE_EXPAND = Easing.out(Easing.cubic); // gentler decelerate — the disk grows smoothly, no hard burst
const ACCENT: Record<string, string> = { creative_lead: C.cardCL, artist: C.cardArtist };

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
    const reduced = useReducedMotion();

    const clRef = useRef<View>(null);
    const artistRef = useRef<View>(null);

    const [disk, setDisk] = useState<{ color: string; cx: number; cy: number } | null>(null);
    const scale = useSharedValue(0);
    const contentOpacity = useSharedValue(1);

    const diskStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
    const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.get() }));

    // Reset when the screen regains focus (e.g. back-swipe from register)
    useFocusEffect(
        useCallback(() => {
            scale.set(0);
            contentOpacity.set(1);
            setDisk(null);
        }, [])
    );

    const go = (role: string) => {
        router.push({ pathname: '/(auth)/register', params: { role, enter: '1' } } as any);
    };

    const pick = (role: string) => {
        if (reduced) {
            router.push({ pathname: '/(auth)/register', params: { role } } as any);
            return;
        }
        const ref = role === 'creative_lead' ? clRef : artistRef;
        const launch = (cx: number, cy: number) => {
            setDisk({ color: ACCENT[role] ?? C.cardArtist, cx, cy });
            scale.set(0);
            contentOpacity.set(withTiming(0.12, { duration: 660, easing: EASE_EXPAND }));
            scale.set(withTiming(FULL_SCALE, { duration: 820, easing: EASE_EXPAND }, (fin) => {
                'worklet';
                if (fin) runOnJS(go)(role);
            }));
        };
        if (ref.current?.measureInWindow) {
            ref.current.measureInWindow((x, y, w, h) => launch(x + w / 2, y + h / 2));
        } else {
            launch(SCREEN_W / 2, SCREEN_H / 2);
        }
    };

    return (
        <View style={s.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" backgroundColor={C.bg} />
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                <Animated.View style={[{ flex: 1 }, contentStyle]}>
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
                            ref={clRef}
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
                            ref={artistRef}
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
                </Animated.View>
            </SafeAreaView>

            {disk && (
                <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                    <Animated.View
                        style={[
                            {
                                position: 'absolute',
                                width: DISK_D,
                                height: DISK_D,
                                borderRadius: DISK_D / 2,
                                backgroundColor: disk.color,
                                left: disk.cx - DISK_D / 2,
                                top: disk.cy - DISK_D / 2,
                            },
                            diskStyle,
                        ]}
                    />
                </View>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    scroll: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 20 },

    head: { marginTop: 24, alignItems: 'center' },
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

    stage: { position: 'relative', height: 424, marginTop: 12 },

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
