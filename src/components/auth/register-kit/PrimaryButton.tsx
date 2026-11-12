// register-kit/PrimaryButton.tsx — solid accent CTA with press-scale, loading + disabled states
import React from 'react';
import { Pressable, Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { RK, RK_FONT } from './theme';
import { useAccent } from './AccentContext';

export function PrimaryButton({
    label, onPress, loading, disabled,
}: {
    label: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
}) {
    const accent = useAccent();
    const scale = useSharedValue(1);
    const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
    const locked = disabled || loading;

    return (
        <Animated.View style={anim}>
            <Pressable
                onPress={onPress}
                disabled={locked}
                onPressIn={() => { if (!locked) scale.set(withTiming(0.97, { duration: 100 })); }}
                onPressOut={() => scale.set(withSpring(1, { duration: 300, dampingRatio: 0.6 }))}
            >
                <View style={[s.btn, { backgroundColor: disabled ? RK.surface2 : accent.base }]}>
                    {loading
                        ? <ActivityIndicator color={accent.on} size="small" />
                        : <Text style={[s.label, { color: disabled ? RK.dim : accent.on }]}>{label}</Text>}
                </View>
            </Pressable>
        </Animated.View>
    );
}

const s = StyleSheet.create({
    btn: { height: 50, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    label: { fontFamily: RK_FONT.semi, fontSize: 15, letterSpacing: 0.3 },
});
