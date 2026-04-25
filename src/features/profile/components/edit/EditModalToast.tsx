// src/features/profile/components/edit/EditModalToast.tsx
//
// Slide-up toast pinned above the footer. Dismisses itself after `durationMs`
// (default 1800). Uses a single Animated.Value for translateY + opacity so
// the entry/exit feels coherent. No external libraries — keeps the modal
// dependency footprint flat.

import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { Check, AlertCircle } from 'lucide-react-native';
import { P } from './EditModalPrimitives';

type ToastVariant = 'success' | 'error';

export type ToastState = { visible: boolean; variant: ToastVariant; message: string } | null;

type Props = {
    state: ToastState;
    onDismiss: () => void;
    durationMs?: number;
};

export function EditModalToast({ state, onDismiss, durationMs = 1800 }: Props) {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!state?.visible) return;
        Animated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 18 }).start();
        const t = setTimeout(() => {
            Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true })
                .start(() => onDismiss());
        }, durationMs);
        return () => clearTimeout(t);
    }, [state?.visible]);

    if (!state?.visible) return null;

    const isSuccess = state.variant === 'success';
    const Icon = isSuccess ? Check : AlertCircle;
    const accent = isSuccess ? P.green : P.danger;

    return (
        <Animated.View
            pointerEvents="none"
            style={{
                position: 'absolute',
                left: 16, right: 16, bottom: 88,
                backgroundColor: P.surface,
                borderWidth: 1, borderColor: `${accent}80`,
                borderRadius: 12,
                paddingHorizontal: 14, paddingVertical: 12,
                flexDirection: 'row', alignItems: 'center', gap: 10,
                opacity: anim,
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
                zIndex: 50,
            }}>
            <Icon size={16} color={accent} />
            <Text style={{ flex: 1, color: P.textPrimary, fontFamily: 'Outfit-SemiBold', fontSize: 13 }}>
                {state.message}
            </Text>
        </Animated.View>
    );
}
