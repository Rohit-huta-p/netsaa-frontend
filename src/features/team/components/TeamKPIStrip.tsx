// netsa-mobile/src/features/team/components/TeamKPIStrip.tsx
//
// 4-cell KPI summary at the top of the team page. Reads aggregated
// gig-wide payment state via useTeamPaymentsSummary.

import React from 'react';
import { Text, View } from 'react-native';
import { useTeamPaymentsSummary } from '../hooks/useTeamPaymentsSummary';

const COLORS = {
    text0: '#F3EFE8',
    text2: '#6B6878',
    cardBg: 'rgba(255,255,255,0.03)',
    cardBorder: 'rgba(255,255,255,0.06)',
    paid: '#22C55E',
    pending: '#F59E0B',
    remaining: '#FF6B35',
};

export interface TeamKPIStripProps {
    applicationIds: string[];
    perArtistAmount: number;
}

function formatINR(n: number): string {
    return `₹${(n || 0).toLocaleString('en-IN')}`;
}

export function TeamKPIStrip({ applicationIds, perArtistAmount }: TeamKPIStripProps) {
    const summary = useTeamPaymentsSummary(applicationIds, perArtistAmount);

    return (
        <View
            accessibilityLabel="team-kpi-strip"
            style={{
                marginHorizontal: 20,
                marginTop: 12,
                padding: 14,
                borderRadius: 16,
                backgroundColor: COLORS.cardBg,
                borderWidth: 1,
                borderColor: COLORS.cardBorder,
            }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <KPICell label="Total agreed" value={formatINR(summary.totalAgreed)} accent={COLORS.text0} />
                <KPICell
                    label="Confirmed paid"
                    value={formatINR(summary.confirmed)}
                    accent={summary.confirmed > 0 ? COLORS.paid : COLORS.text0}
                />
                <KPICell
                    label="Pending"
                    value={formatINR(summary.pending)}
                    accent={summary.pending > 0 ? COLORS.pending : COLORS.text0}
                />
                <KPICell
                    label="Remaining"
                    value={formatINR(summary.remaining)}
                    accent={summary.remaining > 0 ? COLORS.remaining : COLORS.paid}
                />
            </View>
        </View>
    );
}

function KPICell({
    label,
    value,
    accent,
}: {
    label: string;
    value: string;
    accent: string;
}) {
    return (
        <View style={{ flex: 1, minWidth: 0 }}>
            <Text
                numberOfLines={1}
                style={{
                    color: COLORS.text2,
                    fontSize: 9,
                    fontWeight: '700',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                }}>
                {label}
            </Text>
            <Text
                numberOfLines={1}
                style={{
                    color: accent,
                    fontSize: 14,
                    fontWeight: '900',
                    letterSpacing: -0.3,
                    marginTop: 4,
                }}>
                {value}
            </Text>
        </View>
    );
}

export default TeamKPIStrip;
