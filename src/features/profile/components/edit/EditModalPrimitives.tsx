// src/features/profile/components/edit/EditModalPrimitives.tsx
//
// Hoisted form primitives. Lived inside ProfileEditModal.tsx until 2026-04-25
// — declaring a component inside another component re-creates it on every
// parent render, which unmounts the underlying TextInput and drops focus
// mid-typing. Module-scope declarations are stable across re-renders.

import React, { useState } from 'react';
import { View, Text, TextInput, StyleProp, ViewStyle } from 'react-native';

// Brand palette (matches existing modal). Kept inline so primitives stay
// self-contained — color tokens here mirror src/features/profile/components/ProfileEditModal.tsx
// Spotlight palette — warm near-black editorial. One orange accent; the old
// per-tab rainbow is gone (section headers / chrome now use `orange`).
export const P = {
    // Register-flow ("sign-up") language with the Artist indigo accent. `orange`
    // keeps its key name (referenced widely) but now holds the LIGHTENED indigo
    // used for accent text / thin borders / dots; `accent` is the solid indigo
    // base for fills (active pill, Save, filled CTAs) paired with cream/white.
    pink: '#9385DB', orange: '#9385DB', gold: '#9385DB',
    cyan: '#9385DB', green: '#22C55E',
    accent: '#362A93',
    bg: '#121216', surface: '#1b1b21', surfaceLight: '#26262c',
    border: 'rgba(255,255,255,0.08)', borderActive: 'rgba(147,133,219,0.55)',
    textPrimary: '#F3EFE8', textInput: '#D9D4CC', textSecondary: '#71717A', textMuted: '#52525B',
    danger: '#EF4444',
};

type FieldProps = {
    label: string;
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    highlighted?: boolean;
    accent?: string;
};

export function Field({ label, children, style, highlighted, accent }: FieldProps) {
    return (
        <View
            style={[
                { marginBottom: 20 },
                style,
                highlighted && {
                    borderWidth: 1.5,
                    borderColor: `${accent || P.orange}80`,
                    borderRadius: 14,
                    padding: 10,
                    backgroundColor: `${accent || P.orange}08`,
                },
            ]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {highlighted && (
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent || P.orange }} />
                )}
                <Text
                    style={{
                        fontFamily: 'Outfit-Bold',
                        fontSize: 11,
                        color: highlighted ? accent || P.orange : P.textSecondary,
                        textTransform: 'uppercase',
                        letterSpacing: 1.5,
                        marginBottom: 8,
                    }}>
                    {label}
                </Text>
            </View>
            {children}
        </View>
    );
}

type InputProps = {
    value: string;
    onChangeText: (t: string) => void;
    placeholder: string;
    multiline?: boolean;
    accentBorder?: string;
    keyboardType?: 'default' | 'number-pad' | 'email-address';
    autoCapitalize?: 'none' | 'sentences';
};

export function Input({
    value,
    onChangeText,
    placeholder,
    multiline = false,
    accentBorder,
    keyboardType,
    autoCapitalize,
}: InputProps) {
    const [focused, setFocused] = useState(false);
    return (
        <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={P.textMuted}
            multiline={multiline}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
                backgroundColor: `${P.surface}cc`,
                borderWidth: 1,
                borderColor: focused ? P.borderActive : P.border,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                color: P.textInput,
                fontFamily: 'Outfit-Regular',
                fontSize: 14,
                minHeight: multiline ? 120 : undefined,
                textAlignVertical: multiline ? 'top' : 'center',
                ...(accentBorder ? { borderLeftWidth: 2, borderLeftColor: accentBorder } : {}),
            }}
        />
    );
}

export function MiniField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <View style={{ gap: 4 }}>
            <Text
                style={{
                    fontFamily: 'Outfit-Bold',
                    fontSize: 10,
                    color: P.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: 1.5,
                    marginLeft: 2,
                }}>
                {label}
            </Text>
            {children}
        </View>
    );
}
