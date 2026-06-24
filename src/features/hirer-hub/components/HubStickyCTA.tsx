// src/features/hirer-hub/components/HubStickyCTA.tsx
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import type { StickyCTA } from '../utils/computeStickyCTA';

const COLORS = { orange: '#FF6B35' };

type Props = {
    cta: StickyCTA;
    onPress: () => void;
};

export function HubStickyCTA({ cta, onPress }: Props) {
    return (
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
            <TouchableOpacity
                onPress={onPress}
                accessibilityLabel={cta.label}
                style={{
                    backgroundColor: COLORS.orange, paddingVertical: 16, borderRadius: 17,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
                    shadowColor: COLORS.orange, shadowOpacity: 0.45, shadowRadius: 32, shadowOffset: { width: 0, height: 12 },
                }}>
                <Text style={{ color: '#160A04', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 }}>
                    {cta.label}
                </Text>
                <ArrowRight size={18} color="#160A04" strokeWidth={2.6} />
            </TouchableOpacity>
        </View>
    );
}
