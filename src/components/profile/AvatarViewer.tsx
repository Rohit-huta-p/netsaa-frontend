// src/components/profile/AvatarViewer.tsx
//
// Full-screen viewer for the profile photo (the halo portrait). Reuses the
// MediaViewer backdrop language — a transparent Modal with a translucent tint
// over the blurred profile, so the app shows through behind it (MediaViewer.tsx
// uses the same transparent Modal + BlurView + tint). Unlike the media gallery
// this shows a single ROUND halo portrait + name + craft, dismissed by the ✕ or
// a tap outside the portrait.
// Mockups: DOCS/04-design/mockups/profile-artist-spotlight-FINAL.html (+ -owner-view.html)
import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Image, Modal, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { useUiStore } from '@/stores/uiStore';

// Translucent tint over the blurred profile. Intentionally lighter than the
// MediaViewer gallery's 0.72 so the profile reads clearly behind a single
// portrait — the "app seen behind" look signed off in the mockup.
const TINT = 'rgba(6,4,9,0.52)';

const initialsOf = (n: string) =>
    n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

type Props = {
    onClose: () => void;
    name: string;
    craft?: string;
    imageUrl?: string;
};

export default function AvatarViewer({ onClose, name, craft, imageUrl }: Props) {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    // Haptic on open + hide the global bottom nav while the viewer is up.
    useEffect(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        const { pushFullscreenOverlay, popFullscreenOverlay } = useUiStore.getState();
        pushFullscreenOverlay();
        return () => popFullscreenOverlay();
    }, []);

    const size = Math.min(width - 120, 248);        // enlarged portrait (inner) diameter
    const ringOuter = size + 9;                     // + 3px padding + 1.5px border each side
    const halo = Math.round(size * 1.7);            // glow extends past the ring (mockup .pm-big::before)
    const haloOffset = Math.round((ringOuter - halo) / 2);

    return (
        <Modal visible transparent statusBarTranslucent animationType="fade" onRequestClose={onClose}>
            <View style={StyleSheet.absoluteFill}>
                {/* backdrop — translucent tint over the blurred profile; tap anywhere here dismisses */}
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close photo"
                >
                    <BlurView intensity={38} tint="dark" style={StyleSheet.absoluteFill} experimentalBlurMethod="dimezisBlurView">
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: TINT }]} />
                    </BlurView>
                </Pressable>

                {/* centered portrait + caption. box-none lets empty areas fall through to the
                    backdrop (dismiss); the inner Pressable swallows taps on the portrait itself. */}
                <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="box-none">
                    <Pressable onPress={() => {}} style={styles.card}>
                        <View style={{ width: ringOuter, height: ringOuter, alignItems: 'center', justifyContent: 'center' }}>
                            {/* halo glow — the signature Spotlight warmth behind the portrait */}
                            <Svg
                                width={halo}
                                height={halo}
                                style={{ position: 'absolute', top: haloOffset, left: haloOffset }}
                                pointerEvents="none"
                            >
                                <Defs>
                                    <RadialGradient id="avhalo" cx="50%" cy="50%" r="50%">
                                        <Stop offset="0" stopColor="#FF9646" stopOpacity={0.3} />
                                        <Stop offset="0.66" stopColor="#FF9646" stopOpacity={0} />
                                    </RadialGradient>
                                </Defs>
                                <Rect x="0" y="0" width={halo} height={halo} fill="url(#avhalo)" />
                            </Svg>

                            <View style={[styles.ring, { borderRadius: ringOuter / 2 }]}>
                                {imageUrl ? (
                                    <Image source={{ uri: imageUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} />
                                ) : (
                                    <LinearGradient
                                        colors={['#3a2418', '#17151d']}
                                        start={{ x: 0.7, y: 0.2 }}
                                        end={{ x: 0, y: 1 }}
                                        style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', color: '#FFB488', fontSize: Math.round(size * 0.33) }}>
                                            {initialsOf(name)}
                                        </Text>
                                    </LinearGradient>
                                )}
                            </View>
                        </View>

                        <View style={styles.caption}>
                            <Text style={styles.name}>{name}</Text>
                            {!!craft && <Text style={styles.craft} numberOfLines={1}>{craft}</Text>}
                        </View>
                    </Pressable>
                </View>

                {/* close ✕ — top-right, above the dismiss layer */}
                <Pressable
                    onPress={onClose}
                    hitSlop={10}
                    style={[styles.closeBtn, { top: insets.top + 10 }]}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                >
                    <X size={17} color="#fff" />
                </Pressable>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
    card: { alignItems: 'center', gap: 22 },
    ring: { borderWidth: 0, padding: 3, overflow: 'hidden' },
    caption: { alignItems: 'center', gap: 6 },
    name: { fontFamily: 'DMSerifDisplay_400Regular', color: '#fff', fontSize: 25, textAlign: 'center' },
    craft: { fontFamily: 'SpaceMono-Regular', color: 'rgba(255,255,255,0.65)', fontSize: 10, letterSpacing: 1.6, textAlign: 'center' },
    closeBtn: {
        position: 'absolute', right: 16, zIndex: 10,
        width: 38, height: 38, borderRadius: 19,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.10)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    },
});
