// src/components/profile/WithdrawRequestSheet.tsx
//
// Confirmation sheet for withdrawing a pending connection request. Reuses the
// MediaViewer / AvatarViewer backdrop language — a transparent Modal with a
// translucent tint over the blurred profile, so the app shows through behind it.
// A centred card holds the prompt + Keep it / Withdraw; a tap outside the card
// (or Keep it) dismisses without withdrawing.
// Mockup: DOCS/04-design/mockups/profile-artist-spotlight-FINAL.html
import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useUiStore } from '@/stores/uiStore';

// Translucent tint over the blurred profile — the app shows through behind it.
const TINT = 'rgba(6,4,9,0.6)';
const firstNameOf = (n: string) => (n || '').trim().split(' ')[0] || 'them';

type Props = {
    name: string;
    busy?: boolean;
    onKeep: () => void;
    onWithdraw: () => void;
};

export default function WithdrawRequestSheet({ name, busy = false, onKeep, onWithdraw }: Props) {
    // Haptic on open + hide the global bottom nav while the sheet is up.
    useEffect(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        const { pushFullscreenOverlay, popFullscreenOverlay } = useUiStore.getState();
        pushFullscreenOverlay();
        return () => popFullscreenOverlay();
    }, []);

    return (
        <Modal visible transparent statusBarTranslucent animationType="fade" onRequestClose={onKeep}>
            <View style={StyleSheet.absoluteFill}>
                {/* backdrop — translucent tint over the blurred profile; tap outside the card = keep */}
                <Pressable style={StyleSheet.absoluteFill} onPress={onKeep} accessibilityRole="button" accessibilityLabel="Keep request">
                    <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} experimentalBlurMethod="dimezisBlurView">
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: TINT }]} />
                    </BlurView>
                </Pressable>

                {/* centred card; box-none lets empty areas fall through to the backdrop (keep) */}
                <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="box-none">
                    <View style={styles.card}>
                        <Text style={styles.h}>Withdraw your request to {firstNameOf(name)}?</Text>
                        <Text style={styles.b}>Your pending request will be removed — you can send it again anytime.</Text>
                        <View style={styles.row}>
                            <Pressable onPress={onKeep} disabled={busy} style={[styles.btn, styles.keep]} accessibilityRole="button" accessibilityLabel="Keep it">
                                <Text style={[styles.btnTx, { color: '#E5E5E5' }]}>Keep it</Text>
                            </Pressable>
                            <Pressable onPress={onWithdraw} disabled={busy} style={[styles.btn, styles.go]} accessibilityRole="button" accessibilityLabel="Withdraw request">
                                {busy ? <ActivityIndicator size="small" color="#FCA5A5" /> : <Text style={[styles.btnTx, { color: '#FCA5A5' }]}>Withdraw</Text>}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
    card: { width: '100%', maxWidth: 330, backgroundColor: '#17171d', borderWidth: 1, borderColor: '#27272A', borderRadius: 20, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 18 },
    h: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 21, color: '#fff', lineHeight: 26 },
    b: { fontFamily: 'Outfit-Regular', fontSize: 13, lineHeight: 19.5, color: '#A1A1AA', marginTop: 9 },
    row: { flexDirection: 'row', gap: 10, marginTop: 20 },
    btn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    btnTx: { fontFamily: 'Outfit-Bold', fontSize: 13.5 },
    keep: { backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)' },
    go: { backgroundColor: 'rgba(239,68,68,0.14)', borderColor: 'rgba(239,68,68,0.30)' },
});
