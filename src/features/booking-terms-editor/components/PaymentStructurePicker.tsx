// src/features/booking-terms-editor/components/PaymentStructurePicker.tsx
//
// Two radio cards: Full upfront / 30/70 advance. The advance card shows
// the computed split (₹15K → ₹35K) when an amount is provided, plus a
// 'Recommended' badge for amounts >= ₹50K.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878', text3: '#3F3D4A',
    bg1: '#0F0F16', line: 'rgba(255,255,255,0.05)',
    orange: '#FF6B35', gold: '#F59E0B',
};

export type PaymentStructure = 'full' | 'advance_balance';

type Props = {
    value: PaymentStructure;
    amount: number;
    onChange: (next: PaymentStructure) => void;
};

function inrShort(amount: number): string {
    if (!Number.isFinite(amount)) return '₹0';
    if (amount >= 99_950) {
        const lakh = Math.floor((amount / 100000) * 10) / 10;
        return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)}L`;
    }
    if (amount >= 1000) {
        const k = Math.floor((amount / 1000) * 10) / 10;
        return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
    }
    return `₹${Math.max(0, Math.floor(amount))}`;
}

function OptionCard({
    title, subtitle, selected, onPress, children, recommended,
}: {
    title: string;
    subtitle: string;
    selected: boolean;
    onPress: () => void;
    children?: React.ReactNode;
    recommended?: boolean;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            accessibilityLabel={`Payment structure: ${title}${selected ? ', selected' : ''}`}
            style={{
                padding: 16,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: selected ? COLORS.orange : COLORS.line,
                backgroundColor: selected ? 'rgba(255,107,53,0.06)' : COLORS.bg1,
                marginBottom: 12,
                position: 'relative',
            }}>
            {selected && (
                <View style={{
                    position: 'absolute', top: 14, right: 14,
                    width: 18, height: 18, borderRadius: 9,
                    backgroundColor: COLORS.orange,
                    borderWidth: 4, borderColor: COLORS.bg1,
                }} />
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 28 }}>
                <Text style={{ color: COLORS.text0, fontSize: 14, fontWeight: '700' }}>{title}</Text>
                {recommended && (
                    <View style={{
                        paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999,
                        backgroundColor: 'rgba(255,107,53,0.18)',
                    }}>
                        <Text style={{ color: COLORS.orange, fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                            Recommended
                        </Text>
                    </View>
                )}
            </View>
            <Text style={{ color: COLORS.text2, fontSize: 12, marginTop: 6, lineHeight: 18 }}>
                {subtitle}
            </Text>
            {children}
        </TouchableOpacity>
    );
}

export function PaymentStructurePicker({ value, amount, onChange }: Props) {
    const advance = Math.floor(amount * 0.3);
    const balance = amount - advance;

    return (
        <View>
            <OptionCard
                title="Full upfront"
                subtitle="Hirer pays 100% on contract signing. Best for one-off short gigs."
                selected={value === 'full'}
                onPress={() => onChange('full')}
            />
            <OptionCard
                title="30/70 advance"
                subtitle="30% on signing, 70% after the gig. Standard for events ≥ ₹50K."
                selected={value === 'advance_balance'}
                onPress={() => onChange('advance_balance')}
                recommended={amount >= 50000}>
                {value === 'advance_balance' && amount > 0 && (
                    <View style={{
                        marginTop: 12,
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                    }}>
                        <Text style={{ color: COLORS.orange, fontSize: 11, fontWeight: '700' }}>
                            {inrShort(advance)}
                        </Text>
                        <Text style={{ color: COLORS.text3, fontSize: 11 }}>on sign  →  </Text>
                        <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '700' }}>
                            {inrShort(balance)}
                        </Text>
                        <Text style={{ color: COLORS.text3, fontSize: 11 }}>post-event</Text>
                    </View>
                )}
            </OptionCard>
        </View>
    );
}
