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
export const P = {
    pink: '#EC4899', orange: '#F97316', gold: '#EAB308',
    cyan: '#06B6D4', green: '#34D399',
    bg: '#0A0A10', surface: '#121018', surfaceLight: '#1A1824',
    border: 'rgba(255,255,255,0.06)', borderActive: 'rgba(249,115,22,0.5)',
    textPrimary: '#F0ECE6', textSecondary: '#6B6878', textMuted: '#4A4656',
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
                color: P.textPrimary,
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
