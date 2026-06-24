// src/features/booking-terms-editor/components/CancellationPicker.tsx
//
// Three chips (24h / 48h / 72h) + a forfeit-percentage row (50/75/100) +
// a small forfeit fact card + a hirer-authored custom text textarea.
//
// Power-user "+ Use suggested wording" button pre-fills the textarea with
// auto-generated copy as a starter; hirer edits or clears freely.

import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878', text3: '#3F3D4A',
    bg1: '#0F0F16', bg2: '#16161F', line: 'rgba(255,255,255,0.05)',
    orange: '#FF6B35',
};

export type CancellationPolicy = '24h' | '48h' | '72h';

const OPTIONS: CancellationPolicy[] = ['24h', '48h', '72h'];
const FORFEIT_OPTIONS = [50, 75, 100] as const;

type Props = {
    value: CancellationPolicy;
    onChange: (next: CancellationPolicy) => void;
    forfeitPct: number;
    onForfeitPctChange: (next: number) => void;
    customText: string;
    onCustomTextChange: (next: string) => void;
};

export function CancellationPicker({
    value,
    onChange,
    forfeitPct,
    onForfeitPctChange,
    customText,
    onCustomTextChange,
}: Props) {
    return (
        <View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
                {OPTIONS.map((opt) => {
                    const selected = value === opt;
                    return (
                        <TouchableOpacity
                            key={opt}
                            onPress={() => onChange(opt)}
                            accessibilityLabel={`Cancellation: ${opt}${selected ? ', selected' : ''}`}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                borderRadius: 12,
                                borderWidth: 1.5,
                                borderColor: selected ? COLORS.orange : COLORS.line,
                                backgroundColor: selected ? 'rgba(255,107,53,0.10)' : COLORS.bg2,
                                alignItems: 'center',
                            }}>
                            <Text style={{
                                color: selected ? COLORS.orange : COLORS.text2,
                                fontSize: 12, fontWeight: '700',
                            }}>{opt}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Forfeit-percentage selector — Phase 2C makes the forfeit %
                hirer-configurable instead of the previously hardcoded 100%. */}
            <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                    Forfeit if cancelled within window
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {FORFEIT_OPTIONS.map((pct) => {
                        const selected = forfeitPct === pct;
                        return (
                            <TouchableOpacity
                                key={pct}
                                onPress={() => onForfeitPctChange(pct)}
                                accessibilityLabel={`Forfeit: ${pct}%${selected ? ', selected' : ''}`}
                                style={{
                                    flex: 1, paddingVertical: 12, borderRadius: 12,
                                    borderWidth: 1.5,
                                    borderColor: selected ? COLORS.orange : COLORS.line,
                                    backgroundColor: selected ? 'rgba(255,107,53,0.10)' : COLORS.bg2,
                                    alignItems: 'center',
                                }}>
                                <Text style={{
                                    color: selected ? COLORS.orange : COLORS.text2,
                                    fontSize: 12, fontWeight: '700',
                                }}>{pct}%</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Structured fact preview — no narrative, no NETSA-forced wording.
                The hirer's custom text (below) becomes the contract narrative. */}
            <View style={{
                marginTop: 16, padding: 12, borderRadius: 12,
                backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.line,
            }}>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                    Forfeit if cancelled within window
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                    <Text style={{ color: COLORS.orange, fontSize: 16, fontWeight: '700' }}>{forfeitPct}%</Text>
                    <Text style={{ color: COLORS.text2, fontSize: 12 }}>· {value} window</Text>
                </View>
            </View>

            {/* Hirer-authored cancellation policy text. Optional. Saved verbatim
                into the contract narrative when set. */}
            <View style={{ marginTop: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                        Cancellation policy text
                    </Text>
                    <Text style={{ fontSize: 9, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                        Optional · {customText.length}/500
                    </Text>
                </View>

                <TextInput
                    value={customText}
                    onChangeText={(t) => onCustomTextChange(t.slice(0, 500))}
                    placeholder={"e.g. \"Cancellations within 48h of the event date forfeit the full booking amount. Half refund within 7 days. No questions asked beyond 7 days.\"\n\nLeave empty to keep just the structured window + forfeit % above."}
                    placeholderTextColor={COLORS.text3}
                    multiline
                    style={{
                        backgroundColor: COLORS.bg2,
                        borderWidth: 1,
                        borderColor: COLORS.line,
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        color: COLORS.text0,
                        fontSize: 13,
                        lineHeight: 20,
                        minHeight: 100,
                        textAlignVertical: 'top',
                    }}
                    maxLength={500}
                    accessibilityLabel="Cancellation custom text"
                />

                {/* Power-user: Use suggested wording button — only shown when
                    the textarea is empty. Pre-fills as an editable starter. */}
                {customText.trim() === '' && (
                    <TouchableOpacity
                        onPress={() => {
                            const suggestion = `Cancellations within ${value} of the event date forfeit ${forfeitPct}% of the booking amount. Refunds beyond the cancellation window are at the artist's discretion.`;
                            onCustomTextChange(suggestion);
                        }}
                        accessibilityLabel="Use suggested wording"
                        style={{
                            marginTop: 8,
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                            alignSelf: 'flex-start',
                            backgroundColor: 'rgba(255,107,53,0.08)',
                            borderWidth: 1,
                            borderColor: 'rgba(255,107,53,0.25)',
                        }}>
                        <Text style={{ color: COLORS.orange, fontSize: 11, fontWeight: '700' }}>
                            + Use suggested wording
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
