// register-kit/Field.tsx — dark labeled text input (replaces the light StepInput in reskinned steps)
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { RK, RK_FONT } from './theme';
import { useAccent } from './AccentContext';

export interface FieldProps extends Omit<TextInputProps, 'style'> {
    label?: string;
    optional?: boolean;
    icon?: React.ReactNode;    // left icon node
    prefix?: string;           // e.g. '@'
    helper?: string;
    error?: string | null;
    multiline?: boolean;
    counter?: string;          // right-aligned counter shown in the label row (e.g. "0 / 500")
}

export function Field({
    label, optional, icon, prefix, helper, error, multiline, counter, onFocus, onBlur, ...rest
}: FieldProps) {
    const accent = useAccent();
    const [focused, setFocused] = useState(false);
    const borderColor = error ? RK.dangerBd : focused ? accent.base : RK.hair;

    return (
        <View style={s.wrap}>
            {(label || counter) && (
                <View style={s.labelRow}>
                    <Text style={s.label}>
                        {label}
                        {optional ? <Text style={s.optional}>  OPTIONAL</Text> : null}
                    </Text>
                    {counter ? <Text style={s.counter}>{counter}</Text> : null}
                </View>
            )}
            <View style={[s.box, multiline && s.boxMulti, { borderColor }]}>
                {icon ? <View style={s.icon}>{icon}</View> : null}
                {prefix ? <Text style={s.prefix}>{prefix}</Text> : null}
                <TextInput
                    {...rest}
                    multiline={multiline}
                    placeholderTextColor={RK.dim}
                    selectionColor={accent.base}
                    style={[s.input, multiline && s.inputMulti]}
                    onFocus={(e) => { setFocused(true); onFocus?.(e); }}
                    onBlur={(e) => { setFocused(false); onBlur?.(e); }}
                />
            </View>
            {error ? (
                <Text style={s.error}>{error}</Text>
            ) : helper ? (
                <Text style={s.helper}>{helper}</Text>
            ) : null}
        </View>
    );
}

const s = StyleSheet.create({
    wrap: { marginBottom: 16 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 },
    label: { fontFamily: RK_FONT.mono, fontSize: 9, letterSpacing: 1.6, color: RK.muted },
    optional: { fontFamily: RK_FONT.mono, fontSize: 9, letterSpacing: 1.6, color: RK.dim },
    counter: { fontFamily: RK_FONT.mono, fontSize: 9, letterSpacing: 0.8, color: RK.dim },
    box: {
        minHeight: 48, borderRadius: 12, backgroundColor: RK.surface,
        borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9,
    },
    boxMulti: { minHeight: 92, alignItems: 'flex-start', paddingVertical: 12 },
    icon: { width: 18, alignItems: 'center', justifyContent: 'center' },
    prefix: { fontFamily: RK_FONT.body, fontSize: 14, color: RK.muted },
    input: { flex: 1, fontFamily: RK_FONT.body, fontSize: 14.5, color: RK.cream, paddingVertical: 12 },
    inputMulti: { paddingVertical: 0, textAlignVertical: 'top', minHeight: 68 },
    helper: { fontFamily: RK_FONT.body, fontSize: 11, color: RK.dim, marginTop: 6 },
    error: { fontFamily: RK_FONT.body, fontSize: 11.5, color: RK.danger, marginTop: 6 },
});
