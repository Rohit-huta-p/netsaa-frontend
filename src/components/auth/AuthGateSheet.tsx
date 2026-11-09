// src/components/auth/AuthGateSheet.tsx
// A·Minimal bottom sheet for guest users attempting an auth-gated action.
// Stores a pendingIntent (returnPath + action type) before navigating to auth,
// so the caller page can resume the action after login/register.

import React, { useRef, useEffect } from 'react';
import {
    View, Text, Modal, Pressable, StyleSheet, Animated,
    PanResponder, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, UserPlus } from 'lucide-react-native';
import { usePendingAuthActionStore } from '@/stores/pendingAuthActionStore';
import type { PendingAuthIntent } from '@/stores/pendingAuthActionStore';

export type AuthGateActionType = 'apply' | 'register_event' | 'connect' | 'follow' | 'save';

interface AuthGateSheetProps {
    visible: boolean;
    onClose: () => void;
    actionType: AuthGateActionType;
    contextLabel?: string;
    resourceId?: string;
    returnPath?: string;
}

const C = {
    canvas: '#121216',
    sheet: '#17171D',
    card: '#1a1a22',
    orange: '#FF6B35',
    orangeDim: 'rgba(255,107,53,0.12)',
    orangeBorder: 'rgba(255,107,53,0.25)',
    t1: '#fff',
    t2: '#D4D4D8',
    t3: '#A1A1AA',
    t4: '#8B8B99',
    t5: '#5c5c66',
    hair: 'rgba(255,255,255,0.07)',
    well: 'rgba(255,255,255,0.05)',
    wellb: 'rgba(255,255,255,0.08)',
};

const F = {
    bold: 'Outfit-Bold',
    semi: 'Outfit-SemiBold',
    med: 'Outfit-Medium',
    reg: 'Outfit-Regular',
    mono: 'SpaceMono-Regular',
};

const ACTION_COPY: Record<AuthGateActionType, { verb: string; chip: string; sub: string }> = {
    apply: {
        verb: 'apply',
        chip: 'Applying for',
        sub: 'Join thousands of artists finding their next gig on NETSA.',
    },
    register_event: {
        verb: 'register',
        chip: 'Registering for',
        sub: 'Discover and register for workshops, masterclasses, and more.',
    },
    connect: {
        verb: 'connect',
        chip: 'Connecting with',
        sub: 'Build your performing arts network on NETSA.',
    },
    follow: {
        verb: 'follow',
        chip: 'Following',
        sub: 'Stay updated when they post gigs and events.',
    },
    save: {
        verb: 'save',
        chip: 'Saving',
        sub: 'Come back to this whenever you are ready.',
    },
};

export const AuthGateSheet: React.FC<AuthGateSheetProps> = ({
    visible,
    onClose,
    actionType,
    contextLabel,
    resourceId = '',
    returnPath = '',
}) => {
    const router = useRouter();
    const { setPendingIntent } = usePendingAuthActionStore();
    const copy = ACTION_COPY[actionType];

    const dragY = useRef(new Animated.Value(0)).current;
    const closeRef = useRef<() => void>(() => {});

    const pan = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_e, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
            onPanResponderMove: (_e, g) => { if (g.dy > 0) dragY.setValue(g.dy); },
            onPanResponderRelease: (_e, g) => {
                if (g.dy > 100 || g.vy > 1.0) closeRef.current();
                else Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
            },
            onPanResponderTerminate: () =>
                Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start(),
        })
    ).current;

    useEffect(() => { if (visible) dragY.setValue(0); }, [visible, dragY]);
    closeRef.current = onClose;

    const storeIntent = () => {
        const intent: PendingAuthIntent = {
            type: actionType === 'apply' ? 'apply'
                : actionType === 'register_event' ? 'register_event'
                : actionType,
            resourceId,
            returnPath,
        };
        setPendingIntent(intent);
        onClose();
    };

    const handleSignup = () => {
        storeIntent();
        router.push('/(auth)/welcome' as any);
    };

    const handleLogin = () => {
        storeIntent();
        router.push('/(auth)/login' as any);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={s.overlay}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                />
                <Animated.View style={[s.sheet, { transform: [{ translateY: dragY }] }]}>
                    {/* Grabber */}
                    <View {...pan.panHandlers}>
                        <View style={s.grab} />
                    </View>

                    <View style={s.body}>
                        {/* Context chip */}
                        {contextLabel && (
                            <View style={s.chip}>
                                <Text style={s.chipPre}>{copy.chip} </Text>
                                <Text style={s.chipLabel} numberOfLines={1}>{contextLabel}</Text>
                            </View>
                        )}

                        {/* Icon */}
                        <View style={s.iconRing}>
                            <UserPlus size={26} color={C.orange} strokeWidth={1.8} />
                        </View>

                        {/* Copy */}
                        <Text style={s.headline}>
                            To {copy.verb}, create a free account
                        </Text>
                        <Text style={s.sub}>{copy.sub}</Text>

                        {/* CTAs */}
                        <TouchableOpacity
                            onPress={handleSignup}
                            style={s.primaryBtn}
                            activeOpacity={0.88}
                            accessibilityRole="button"
                        >
                            <Text style={s.primaryTxt}>Create free account</Text>
                            <ArrowRight size={16} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleLogin}
                            style={s.ghostBtn}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                        >
                            <Text style={s.ghostTxt}>I already have an account</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onClose}
                            style={s.dismissBtn}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                        >
                            <Text style={s.dismissTxt}>Not now</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const s = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.65)',
    },
    sheet: {
        backgroundColor: C.sheet,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderTopWidth: 1,
        borderColor: C.hair,
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 40,
        shadowOffset: { width: 0, height: -16 },
        paddingBottom: 36,
    },
    grab: {
        width: 38,
        height: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 4,
    },
    body: {
        paddingHorizontal: 24,
        paddingTop: 8,
        alignItems: 'center',
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.orangeDim,
        borderWidth: 1,
        borderColor: C.orangeBorder,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 20,
        maxWidth: '100%',
    },
    chipPre: {
        fontFamily: F.med,
        fontSize: 12,
        color: C.t4,
    },
    chipLabel: {
        fontFamily: F.semi,
        fontSize: 12,
        color: C.orange,
        flexShrink: 1,
    },
    iconRing: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: C.orangeDim,
        borderWidth: 1,
        borderColor: C.orangeBorder,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    headline: {
        fontFamily: F.bold,
        fontSize: 21,
        color: C.t1,
        textAlign: 'center',
        letterSpacing: -0.4,
        marginBottom: 9,
    },
    sub: {
        fontFamily: F.reg,
        fontSize: 13.5,
        color: C.t4,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 28,
        paddingHorizontal: 8,
    },
    primaryBtn: {
        width: '100%',
        height: 54,
        borderRadius: 16,
        backgroundColor: C.orange,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        marginBottom: 12,
        shadowColor: C.orange,
        shadowOpacity: 0.3,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
    },
    primaryTxt: {
        fontFamily: F.bold,
        fontSize: 15.5,
        color: '#fff',
        letterSpacing: 0.2,
    },
    ghostBtn: {
        width: '100%',
        height: 50,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: C.wellb,
        backgroundColor: C.well,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    ghostTxt: {
        fontFamily: F.semi,
        fontSize: 14,
        color: C.t2,
    },
    dismissBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    dismissTxt: {
        fontFamily: F.med,
        fontSize: 13,
        color: C.t5,
    },
});
