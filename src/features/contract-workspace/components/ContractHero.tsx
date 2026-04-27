// src/features/contract-workspace/components/ContractHero.tsx
//
// Avatar + name + role + ₹ + status pill. Read-only.

import React from 'react';
import { View, Text } from 'react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878',
    bg2: '#16161F',
    orange: '#FF6B35', green: '#22C55E', gold: '#F59E0B',
    purple: '#8B5CF6', red: '#EF4444', grey: '#6B6878',
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: COLORS.grey },
    sent: { label: 'Awaiting signature', color: COLORS.purple },
    pending_artist_signature: { label: 'Awaiting signature', color: COLORS.purple },
    pending_guardian_cosign: { label: 'Awaiting guardian', color: COLORS.purple },
    accepted: { label: 'Active', color: COLORS.green },
    active: { label: 'Active', color: COLORS.green },
    performed: { label: 'Performed', color: COLORS.green },
    completed: { label: 'Completed', color: COLORS.green },
    disputed: { label: 'Disputed', color: COLORS.red },
    declined: { label: 'Declined', color: COLORS.red },
    cancelled: { label: 'Cancelled', color: COLORS.grey },
    breached: { label: 'Breached', color: COLORS.red },
};

type Props = {
    counterpartName: string;       // hirer name if viewer is artist, artist name if viewer is hirer
    counterpartRole: string;       // "Lead choreographer" / "Backup dancer" / etc
    amount: number;
    status: string;
    tier?: 'quick' | 'standard' | 'premium';
};

export function ContractHero({ counterpartName, counterpartRole, amount, status, tier }: Props) {
    const initials = counterpartName.split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'A';
    const statusInfo = STATUS_LABEL[status] ?? STATUS_LABEL.active;

    return (
        <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{
                    width: 56, height: 56, borderRadius: 16,
                    backgroundColor: COLORS.bg2,
                    alignItems: 'center', justifyContent: 'center',
                }}>
                    <Text style={{ color: COLORS.text0, fontSize: 18, fontWeight: '700' }}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 26, color: COLORS.text0, letterSpacing: -0.4, lineHeight: 30 }}>
                        {counterpartName}
                    </Text>
                    <Text style={{ color: COLORS.text2, fontSize: 13, marginTop: 4 }}>{counterpartRole}</Text>
                </View>
            </View>
            <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999,
                    backgroundColor: `${statusInfo.color}1A`,
                }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusInfo.color }} />
                    <Text style={{ color: statusInfo.color, fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' }}>
                        {statusInfo.label}
                    </Text>
                </View>
                {tier && (
                    <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                        {tier}
                    </Text>
                )}
                <View style={{ flex: 1 }} />
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 24, color: COLORS.text0, letterSpacing: -0.4 }}>
                    ₹{amount.toLocaleString('en-IN')}
                </Text>
            </View>
        </View>
    );
}
