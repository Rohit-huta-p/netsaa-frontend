// BioComposer — editorial pull-quote treatment for the bio (v1 direction).
// Wraps AITextInput (keeps AI rephrase) with an oversized serif open-quote and
// a hairline foot that turns the character count into a signal, not a readout.

import React from 'react';
import { Text, View } from 'react-native';
import { AITextInput } from '@/components/ui/AITextInput';
import { P } from './EditModalPrimitives';

type Band = { label: string; color: string; min: number };

// Character-count bands, picked by the highest min the length reaches. The
// sweet spot (300+) reads in orange so users feel they've landed the target.
const BANDS: Band[] = [
    { label: 'Too brief',         color: P.textMuted,     min: 0 },
    { label: 'Getting there',     color: P.textSecondary, min: 100 },
    { label: 'Great length',      color: P.orange,        min: 300 },
    { label: 'Consider trimming', color: P.gold,          min: 700 },
];

function bandFor(len: number): Band {
    for (let i = BANDS.length - 1; i >= 0; i--) if (len >= BANDS[i].min) return BANDS[i];
    return BANDS[0];
}

type Props = {
    value: string;
    onChangeText: (v: string) => void;
    isRequired?: boolean;
};

export function BioComposer({ value, onChangeText, isRequired }: Props) {
    const charCount = value.length;
    const band = bandFor(charCount);

    return (
        <View style={{ marginBottom: 24, paddingTop: 6 }}>
            {/* Oversized serif open-quote — the editorial pull-quote signature */}
            <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 76, lineHeight: 40, color: 'rgba(255,107,53,0.5)', marginBottom: 6 }}>
                &ldquo;
            </Text>

            {isRequired ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: P.orange }} />
                    <Text style={{ color: P.orange, fontSize: 10, fontFamily: 'SpaceMono-Bold', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                        Required
                    </Text>
                </View>
            ) : null}

            <AITextInput
                value={value}
                onChangeText={onChangeText}
                placeholder="Tell your story — your training, your style, what makes your performances unforgettable…"
                containerStyle={{ marginBottom: 0 }}
            />

            {/* Editorial foot: hairline + live signal + tabular count */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: P.border }}>
                <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 12.5, color: band.color }}>{band.label}</Text>
                <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 11, color: P.textMuted, letterSpacing: 0.5 }}>
                    <Text style={{ fontVariant: ['tabular-nums'] as any }}>{charCount}</Text> / 600
                </Text>
            </View>
        </View>
    );
}
