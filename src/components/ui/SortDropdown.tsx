// src/components/ui/SortDropdown.tsx
//
// Anchored sort dropdown. Opens directly under its trigger button and animates
// downward (translateY + fade) — no bottom-sheet modal. Render it as a sibling
// of the trigger inside a `position:'relative'` wrapper; it pins itself below.
// Closes when an option is selected or the trigger button is toggled.

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, TouchableOpacity, View } from 'react-native';
import { Check, ArrowUpDown } from 'lucide-react-native';

export type SortOption = { value: string; label: string };

type Props = {
    visible: boolean;
    options: SortOption[];
    value: string;
    onSelect: (value: string) => void;
    onClose: () => void;
    /** Accent for the active row + icon (gigs purple, events rose). */
    accent?: string;
    /** Which edge of the trigger the menu aligns to. */
    align?: 'left' | 'right';
    /** Distance from the top of the wrapper (≈ trigger height + gap). */
    offsetTop?: number;
    title?: string;
};

export function SortDropdown({
    visible,
    options,
    value,
    onSelect,
    onClose,
    accent = '#FFFFFF',
    align = 'right',
    offsetTop = 64,
    title = 'Sort by',
}: Props) {
    const anim = useRef(new Animated.Value(0)).current;
    const [mounted, setMounted] = useState(visible);

    useEffect(() => {
        if (visible) {
            setMounted(true);
            Animated.timing(anim, {
                toValue: 1,
                duration: 160,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        } else if (mounted) {
            Animated.timing(anim, {
                toValue: 0,
                duration: 120,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) setMounted(false);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    if (!mounted) return null;

    const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] });
    const edge = align === 'right' ? { right: 0 } : { left: 0 };

    return (
        <>
            <Animated.View
                style={{
                    position: 'absolute',
                    top: offsetTop,
                    ...edge,
                    minWidth: 210,
                    backgroundColor: '#0E0E12',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0)',
                    paddingVertical: 6,
                    zIndex: 2,
                    opacity: anim,
                    transform: [{ translateY }],
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.5,
                    shadowRadius: 24,
                    elevation: 12,
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 7,
                        paddingHorizontal: 14,
                        paddingTop: 6,
                        paddingBottom: 8,
                    }}
                >
                    <ArrowUpDown size={12} color={accent} />
                    <Text
                        style={{
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: 10,
                            fontWeight: '800',
                            letterSpacing: 1.5,
                            textTransform: 'uppercase',
                        }}
                    >
                        {title}
                    </Text>
                </View>
                {options.map((opt) => {
                    const active = opt.value === value;
                    return (
                        <TouchableOpacity
                            key={opt.value}
                            onPress={() => {
                                onSelect(opt.value);
                                onClose();
                            }}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingVertical: 12,
                                paddingHorizontal: 14,
                                gap: 16,
                                backgroundColor: active ? `${accent}1A` : 'transparent',
                            }}
                        >
                            <Text
                                style={{
                                    color: active ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
                                    fontSize: 14,
                                    fontWeight: active ? '700' : '500',
                                }}
                            >
                                {opt.label}
                            </Text>
                            {active && <Check size={16} color={accent} />}
                        </TouchableOpacity>
                    );
                })}
            </Animated.View>
        </>
    );
}
