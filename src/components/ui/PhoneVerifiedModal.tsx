import React, { useEffect, useRef } from 'react';
import {
    View, Text, Modal, Animated, Pressable,
    ActivityIndicator, StyleSheet,
} from 'react-native';
import { CheckCircle } from 'lucide-react-native';

/* ─────────────────────────────────────────────── */
/*  Props                                          */
/* ─────────────────────────────────────────────── */

interface PhoneVerifiedModalProps {
    /** Controls visibility */
    visible: boolean;
    /** The verified phone number to display context */
    phoneNumber?: string;
    /** Called when the user taps "Create My Account" */
    onCreateAccount: () => void;
    /** Disables button & shows spinner to prevent double-tap */
    loading?: boolean;
}

/* ─────────────────────────────────────────────── */
/*  Component                                      */
/* ─────────────────────────────────────────────── */

export function PhoneVerifiedModal({
    visible,
    phoneNumber,
    onCreateAccount,
    loading = false,
}: PhoneVerifiedModalProps) {
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Reset before animating in
            scaleAnim.setValue(0.85);
            opacityAnim.setValue(0);
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 6,
                    tension: 80,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal
            transparent
            animationType="none"
            visible={visible}
            statusBarTranslucent
        >
            {/* Blurred / dimmed backdrop */}
            <View style={styles.backdrop}>
                <Animated.View
                    style={[
                        styles.card,
                        {
                            opacity: opacityAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    {/* ── Green success icon ── */}
                    <View style={styles.iconWrapper}>
                        <CheckCircle size={44} color="#22C55E" strokeWidth={2.2} />
                    </View>

                    {/* ── Title ── */}
                    <Text style={styles.title}>🎉 Phone Verified!</Text>

                    {/* ── Body ── */}
                    <Text style={styles.body}>
                        We couldn't find an existing NETSA account linked to
                        {phoneNumber ? ` ${phoneNumber}` : ' this number'}.
                        {'\n\n'}Looks like you're new here — let's create your profile.
                    </Text>

                    {/* ── CTA Button ── */}
                    <Pressable
                        onPress={onCreateAccount}
                        disabled={loading}
                        style={({ pressed }) => [
                            styles.ctaButton,
                            pressed && !loading && styles.ctaPressed,
                            loading && styles.ctaDisabled,
                        ]}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.ctaLabel}>Create My Account</Text>
                        )}
                    </Pressable>
                </Animated.View>
            </View>
        </Modal>
    );
}

/* ─────────────────────────────────────────────── */
/*  Styles                                         */
/* ─────────────────────────────────────────────── */

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingVertical: 36,
        paddingHorizontal: 28,
        alignItems: 'center',
        // Soft shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 20,
    },
    iconWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(34, 197, 94, 0.10)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.3,
    },
    body: {
        fontSize: 14,
        lineHeight: 21,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 28,
    },
    ctaButton: {
        width: '100%',
        height: 52,
        borderRadius: 16,
        backgroundColor: '#8B5CF6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.98 }],
    },
    ctaDisabled: {
        opacity: 0.7,
    },
    ctaLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },
});
