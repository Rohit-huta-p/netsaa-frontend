import React from 'react';
import { View, Text } from 'react-native';
import type { HubKPIs as HubKPIData } from '../hooks/useGigHubData';

// `kpis.slotsTotal` is guaranteed >= 1 by the upstream selector hook
// (useGigHubData applies `|| 1` fallback). If a future caller hands in 0,
// the rendered "/0" reads as "all slots filled" but is meaningless — keep
// the upstream guard.

const COLORS = {
    text0: '#F3EFE8',
    text2: '#6B6878',
    text3: '#3F3D4A',
    orange: '#FF6B35',
    green: '#22C55E',
    gold: '#F59E0B',
};

function inrShort(amount: number): string {
    if (!Number.isFinite(amount)) return '₹0';
    // Bump to lakh slightly early so the boundary doesn't read as ₹100.0K
    // (a tick from ₹1L). Floor instead of round so we never overstate.
    if (amount >= 99_950) {
        // For values in the early-bump zone [99_950, 100_000), snap to ₹1L
        // so the boundary doesn't read as ₹100K. For values >= 100_000,
        // floor so we never overstate.
        const lakh = amount < 100_000 ? 1 : Math.floor((amount / 100_000) * 10) / 10;
        return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)}L`;
    }
    if (amount >= 1000) {
        const k = Math.floor((amount / 1000) * 10) / 10;
        return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
    }
    return `₹${Math.max(0, Math.floor(amount))}`;
}

type Props = { kpis: HubKPIData };

export function HubKPIs({ kpis }: Props) {
    return (
        <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' }}>
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
                        <Text>{kpis.hiredCount}</Text>
                        <Text style={{ fontSize: 18, color: COLORS.text3 }}>/{kpis.slotsTotal}</Text>
                    </Text>
                </View>
                {/* PAYMENTS-DISABLED (Apr 30): Paid · Due cell removed.
                    Was reading contract.paidAmount which is always 0 since
                    contract rollback. Restore when on-platform Razorpay
                    ships and aggregation reads from confirmed Transactions. */}
            </View>
        </View>
    );
}
