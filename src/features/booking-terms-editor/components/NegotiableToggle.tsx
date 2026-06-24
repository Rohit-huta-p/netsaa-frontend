// src/features/booking-terms-editor/components/NegotiableToggle.tsx
//
// Single row: switch + caption. Wraps RN Switch with brand styling.

import React from 'react';
import { View, Text, Switch } from 'react-native';

const COLORS = {
    text1: '#B8B1A6',
    orange: '#FF6B35',
};

type Props = {
    value: boolean;
    onChange: (next: boolean) => void;
};

export function NegotiableToggle({ value, onChange }: Props) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: '#3F3D4A', true: COLORS.orange }}
                thumbColor="#fff"
                accessibilityLabel="Negotiable rate toggle"
            />
            <Text style={{ flex: 1, color: COLORS.text1, fontSize: 14, lineHeight: 20 }}>
                Negotiable — artists can propose a different rate
            </Text>
        </View>
    );
}
