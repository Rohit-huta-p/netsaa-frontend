import React from 'react';
import { View, Text } from 'react-native';
import { HubTeamRow } from './HubTeamRow';
import type { TeamRowData } from '../hooks/useGigHubData';

const COLORS = { text0: '#F3EFE8', text2: '#6B6878', text3: '#3F3D4A', line2: 'rgba(255,255,255,0.09)' };

type Props = {
    teamRows: TeamRowData[];
    slotsTotal: number;
    pendingApplicantsCount: number;
};

export function HubTeamSection({ teamRows, slotsTotal, pendingApplicantsCount }: Props) {
    const emptySlots = Math.max(0, slotsTotal - teamRows.length);

    return (
        <View style={{ paddingTop: 36, paddingBottom: 8 }}>
            <View style={{ paddingHorizontal: 24, marginBottom: 20, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 24, color: COLORS.text0, letterSpacing: -0.4 }}>
                    Your team
                </Text>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {teamRows.length} of {slotsTotal}
                </Text>
            </View>

            {teamRows.map((row, i) => (
                <HubTeamRow key={row.application?._id ?? i} application={row.application} contract={row.contract} />
            ))}

            {emptySlots > 0 && (
                <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {Array.from({ length: Math.min(emptySlots, 3) }).map((_, i) => (
                            <View
                                key={i}
                                style={{
                                    flex: 1,
                                    aspectRatio: 1,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderStyle: 'dashed',
                                    borderColor: COLORS.line2,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 24, color: COLORS.text3 }}>+</Text>
                            </View>
                        ))}
                    </View>
                    <Text style={{ textAlign: 'center', fontSize: 12, color: COLORS.text2, marginTop: 12 }}>
                        {emptySlots} more {emptySlots === 1 ? 'slot' : 'slots'} needed · {pendingApplicantsCount} {pendingApplicantsCount === 1 ? 'applicant' : 'applicants'} waiting
                    </Text>
                </View>
            )}
        </View>
    );
}
