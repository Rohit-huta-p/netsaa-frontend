// src/features/booking-terms-editor/components/CancellationPicker.tsx
//
// Three chips (24h / 48h / 72h) + a small forfeit-preview card below.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878',
    bg1: '#0F0F16', bg2: '#16161F', line: 'rgba(255,255,255,0.05)',
    orange: '#FF6B35',
};

export type CancellationPolicy = '24h' | '48h' | '72h';

const OPTIONS: CancellationPolicy[] = ['24h', '48h', '72h'];

type Props = {
    value: CancellationPolicy;
    onChange: (next: CancellationPolicy) => void;
};

export function CancellationPicker({ value, onChange }: Props) {
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
            <View style={{
                marginTop: 16, padding: 12, borderRadius: 12,
                backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.line,
            }}>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                    If cancelled within {value}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: COLORS.orange, fontSize: 14, fontWeight: '700' }}>100%</Text>
                    <Text style={{ color: COLORS.text1, fontSize: 12 }}>forfeit</Text>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.line }} />
                    <Text style={{ color: COLORS.text2, fontSize: 12 }}>artist keeps full advance</Text>
                </View>
            </View>
        </View>
    );
}
