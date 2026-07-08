import React from 'react';
import { View, Text } from 'react-native';
import type { HubKPIs as HubKPIData } from '../hooks/useGigHubData';

// Gig-hub redesign v1 — single hairline KPI band, Space Mono tabular numerals.
// Cells: Applicants (+new) · Slots filled · Budget · Days left.
// See DOCS/04-design/mockups/gig-hub-redesign-v1.html.

const COLORS = {
    text0: '#F3EFE8',
    text2: '#6B6878',
    text3: '#3F3D4A',
    orange: '#FF6B35',
    gold: '#F59E0B',
    line: 'rgba(243,239,232,0.07)',
};

function inrShort(amount: number): string {
    if (!Number.isFinite(amount) || amount <= 0) return '—';
    // Bump to lakh slightly early so the boundary doesn't read as ₹100.0K
    // (a tick from ₹1L). Floor instead of round so we never overstate.
    if (amount >= 99_950) {
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

function Cell({
    children,
    label,
    first,
}: {
    children: React.ReactNode;
    label: string;
    first?: boolean;
}) {
    return (
        <View
            style={{
                flex: 1,
                paddingVertical: 16,
                alignItems: 'center',
                borderLeftWidth: first ? 0 : 1,
                borderLeftColor: COLORS.line,
            }}>
            <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 20, color: COLORS.text0, letterSpacing: -0.5 }}>
                {children}
            </Text>
            <Text style={{ fontSize: 9, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.3, textTransform: 'uppercase', marginTop: 6 }}>
                {label}
            </Text>
        </View>
    );
}

export function HubKPIs({ kpis }: Props) {
    return (
        <View
            style={{
                marginHorizontal: 24,
                marginBottom: 8,
                flexDirection: 'row',
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: COLORS.line,
            }}>
            <Cell first label="Applied">
                <Text>{kpis.appliedCount}</Text>
            </Cell>
            <Cell label="Slots">
                <Text>{kpis.hiredCount}</Text>
                <Text style={{ color: COLORS.text3 }}>/{kpis.slotsTotal}</Text>
            </Cell>
            <Cell label="Budget">
                <Text style={{ color: COLORS.gold }}>{inrShort(kpis.budgetAmount)}</Text>
            </Cell>
            <Cell label="Days left">
                <Text>{kpis.daysLeft ?? '—'}</Text>
            </Cell>
        </View>
    );
}
