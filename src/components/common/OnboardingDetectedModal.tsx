import React, { useEffect } from 'react';
import {
    View, Text, TouchableOpacity, Modal, Platform,
    StyleSheet, Pressable, AccessibilityInfo,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { CheckCircle2, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';

/* ─────────────────────────────────────────────────────── */
/*  Types                                                  */
/* ─────────────────────────────────────────────────────── */

interface OnboardingDetectedModalProps {
    /** Controls visibility of the modal */
    visible: boolean;
    /** The verified phone number (displayed in context copy) */
    phoneNumber: string;
    /** Called when the user taps the primary CTA */
    onContinue: () => void;
    /** Called when the user dismisses. Falls back to onContinue if not provided */
    onClose?: () => void;
}

/* ─────────────────────────────────────────────────────── */
/*  Component                                              */
/* ─────────────────────────────────────────────────────── */

export const OnboardingDetectedModal: React.FC<OnboardingDetectedModalProps> = ({
    visible,
    phoneNumber,
    onContinue,
    onClose,
}) => {
    const scale = useSharedValue(0.85);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            scale.value = withSpring(1, { damping: 14, stiffness: 120, mass: 0.8 });
            opacity.value = withTiming(1, { duration: 250 });

            // Announce to screen readers
            AccessibilityInfo.announceForAccessibility(
                'Phone verified! Your number is confirmed. Tap Create My Account to continue.'
            );
        } else {
            scale.value = 0.85;
            opacity.value = 0;
        }
    }, [visible]);

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const handleDismiss = onClose ?? onContinue;

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={handleDismiss}
            accessibilityViewIsModal
        >
            {/* ── Full-screen backdrop ── */}
            <Pressable
                onPress={handleDismiss}
                className="flex-1 justify-center items-center"
                style={styles.backdrop}
                accessibilityRole="none"
                accessibilityLabel="Dismiss modal"
            >
                {/* Blur overlay (native only) */}
                {Platform.OS !== 'web' && (
                    <BlurView
                        intensity={25}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                    />
                )}

                {/* ── Animated card ── */}
                <Animated.View style={cardStyle}>
                    <Pressable
                        onPress={(e) => e.stopPropagation()}
                        className="w-[90vw] max-w-[380px] bg-[#121212] rounded-[28px] overflow-hidden border border-white/10"
                        accessibilityRole="alert"
                        accessibilityLabel="Phone verified modal"
                    >
                        {/* Decorative gradient wash */}
                        <LinearGradient
                            colors={['rgba(34, 197, 94, 0.08)', 'transparent']}
                            style={styles.gradientWash}
                        />

                        {/* Close button */}
                        {onClose && (
                            <TouchableOpacity
                                onPress={onClose}
                                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 border border-white/10 items-center justify-center"
                                accessibilityRole="button"
                                accessibilityLabel="Close"
                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            >
                                <X size={14} color="rgba(255,255,255,0.4)" />
                            </TouchableOpacity>
                        )}

                        <View className="px-7 pt-10 pb-8 items-center">
                            {/* ── Success icon ── */}
                            <View className="mb-6 relative">
                                <View className="w-20 h-20 rounded-full bg-zinc-900 border border-white/10 items-center justify-center">
                                    <LinearGradient
                                        colors={['#22C55E', '#16A34A']}
                                        className="w-16 h-16 rounded-full items-center justify-center"
                                    >
                                        <CheckCircle2 size={34} color="white" strokeWidth={2.2} />
                                    </LinearGradient>
                                </View>
                                {/* Sparkle accent */}
                                <View className="absolute -top-1 -right-1 bg-emerald-500/20 p-1.5 rounded-full border border-emerald-500/30">
                                    <Text style={{ fontSize: 10 }}>✨</Text>
                                </View>
                            </View>

                            {/* ── Title ── */}
                            <Text
                                className="text-white text-[22px] font-black text-center mb-2 tracking-tight"
                                accessibilityRole="header"
                            >
                                🎉 Phone Verified!
                            </Text>

                            {/* ── Subtitle ── */}
                            <Text className="text-zinc-400 text-center text-sm leading-6 px-2 font-medium mb-1">
                                We couldn't find an existing NETSA account linked to{' '}
                                <Text className="text-white/80 font-bold">{phoneNumber}</Text>.
                            </Text>
                            <Text className="text-zinc-500 text-center text-sm leading-6 px-2 mb-8">
                                Looks like you're new here — let's create your profile and get you on stage.
                            </Text>

                            {/* ── Primary CTA ── */}
                            <TouchableOpacity
                                onPress={onContinue}
                                activeOpacity={0.85}
                                className="w-full rounded-2xl overflow-hidden"
                                accessibilityRole="button"
                                accessibilityLabel="Create My Account"
                            >
                                <LinearGradient
                                    colors={['#8B5CF6', '#3B82F6']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="py-4 items-center justify-center rounded-2xl"
                                >
                                    <Text className="text-white font-black text-base tracking-wide">
                                        Create My Account
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* ── Dismiss link ── */}
                            {/* <TouchableOpacity
                                onPress={handleDismiss}
                                className="mt-5 p-2"
                                accessibilityRole="button"
                                accessibilityLabel="Maybe later"
                            >
                                <Text className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                                    Maybe Later
                                </Text>
                            </TouchableOpacity> */}
                        </View>
                    </Pressable>
                </Animated.View>
            </Pressable>
        </Modal>
    );
};

/* ─────────────────────────────────────────────────────── */
/*  Styles (non-NativeWind)                                */
/* ─────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
    backdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
    },
    gradientWash: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 180,
    },
});

/* ─────────────────────────────────────────────────────── */
/*  Usage Example                                          */
/* ─────────────────────────────────────────────────────── */
/*
import { OnboardingDetectedModal } from '@/components/common/OnboardingDetectedModal';

const [showModal, setShowModal] = useState(false);
const [verifiedPhone, setVerifiedPhone] = useState('');

// After OTP verification returns userExists === false:
setVerifiedPhone('+919876543210');
setShowModal(true);

<OnboardingDetectedModal
    visible={showModal}
    phoneNumber={verifiedPhone}
    onContinue={() => {
        setShowModal(false);
        router.replace({
            pathname: '/(auth)/register',
            params: { phone: verifiedPhone },
        });
    }}
    onClose={() => setShowModal(false)}
/>
*/
