// src/features/contract-workspace/components/ContractStickyCTA.tsx
//
// Pinned to bottom. Color reflects intent (orange primary / gold pay /
// muted disabled).

import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import type { PrimaryCTA } from '../utils/computePrimaryCTA';

const COLORS = {
    orange: '#FF6B35', gold: '#F59E0B', text3: '#3F3D4A',
};

type Props = {
    cta: PrimaryCTA;
    onPress: () => void;
};

export function ContractStickyCTA({ cta, onPress }: Props) {
    const isPay = cta.intent === 'pay-advance' || cta.intent === 'pay-balance';
    const bg = cta.disabled ? COLORS.text3 : isPay ? COLORS.gold : COLORS.orange;

    return (
        <View style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 12 }}>
            <TouchableOpacity
                onPress={cta.disabled ? undefined : onPress}
                accessibilityLabel={cta.label}
                style={{
                    backgroundColor: bg, paddingVertical: 16, borderRadius: 16,
                    alignItems: 'center',
                    opacity: cta.disabled ? 0.5 : 1,
                    shadowColor: bg, shadowOpacity: cta.disabled ? 0 : 0.45,
                    shadowRadius: 32, shadowOffset: { width: 0, height: 12 },
                }}>
                <Text style={{ color: '#0A0A0F', fontWeight: '800', fontSize: 14, letterSpacing: 0.3 }}>
                    {cta.label}
                </Text>
            </TouchableOpacity>
        </View>
    );
}
