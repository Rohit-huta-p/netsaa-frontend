import React from 'react';
import { View, Text } from 'react-native';
import type { HubKPIs as HubKPIData } from '../hooks/useGigHubData';

const COLORS = {
    text0: '#F3EFE8',
    text2: '#6B6878',
    text3: '#3F3D4A',
    orange: '#FF6B35',
    green: '#22C55E',
    gold: '#F59E0B',
};

function inrShort(amount: number): string {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
    return `₹${amount}`;
}

type Props = { kpis: HubKPIData };

export function HubKPIs({ kpis }: Props) {
    return (
        <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <View>
                    <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                        Applied
                    </Text>
                    <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 32, color: COLORS.orange, marginTop: 4 }}>
                        {kpis.appliedCount}
                    </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                        Hired
                    </Text>
                    <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 32, color: COLORS.text0, marginTop: 4 }}>
                        {kpis.hiredCount}
                        <Text style={{ fontSize: 18, color: COLORS.text3 }}>/{kpis.slotsTotal}</Text>
                    </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                        Paid · Due
                    </Text>
                    <View style={{ flexDirection: 'row', marginTop: 4 }}>
                        <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, color: COLORS.green }}>
                            {inrShort(kpis.paidAmount)}
                        </Text>
                        <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, color: COLORS.text3 }}> · </Text>
                        <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, color: COLORS.gold }}>
                            {inrShort(kpis.dueAmount)}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
