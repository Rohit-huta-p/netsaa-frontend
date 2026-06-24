// src/features/contract-workspace/components/ContractAmendments.tsx
//
// Empty state + dashed "Request a change" button (Phase 3A) OR a list of
// amendment cards if non-empty. Read-only in 3A.

import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878',
    bg1: '#0F0F16', line: 'rgba(255,255,255,0.05)', line2: 'rgba(255,255,255,0.09)',
    gold: '#F59E0B', green: '#22C55E', red: '#EF4444',
};

type Amendment = {
    requestedAt?: string;
    reason?: string;
    status?: string;
    changes?: Record<string, any>;
};

type Props = {
    amendments: Amendment[];
};

function comingSoon() {
    Alert.alert('Coming soon', 'Amendment requests ship in a follow-up release.');
}

export function ContractAmendments({ amendments }: Props) {
    return (
        <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>
            <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: COLORS.text0, letterSpacing: -0.2 }}>Amendments</Text>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {amendments.length === 0 ? 'None yet' : `${amendments.length} requests`}
                </Text>
            </View>
            <Text style={{ color: COLORS.text2, fontSize: 12, lineHeight: 18, marginBottom: 12 }}>
                Material changes (amount, date, scope) require an amendment round. Up to 3 negotiations.
            </Text>

            {amendments.length === 0 ? (
                <TouchableOpacity
                    onPress={comingSoon}
                    accessibilityLabel="Request a change"
                    style={{
                        paddingVertical: 14, borderRadius: 12,
                        borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.line2,
                        alignItems: 'center',
                    }}>
                    <Text style={{ color: COLORS.text1, fontSize: 13, fontWeight: '700' }}>
                        + Request a change
                    </Text>
                </TouchableOpacity>
            ) : (
                <View style={{ gap: 8 }}>
                    {amendments.map((a, i) => {
                        const accent = a.status === 'rejected' ? COLORS.red : a.status === 'accepted' ? COLORS.green : COLORS.gold;
                        return (
                            <View key={i} style={{
                                borderRadius: 12, padding: 12,
                                backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.line,
                                borderLeftWidth: 3, borderLeftColor: accent,
                            }}>
                                <Text style={{ color: COLORS.text0, fontSize: 13, fontWeight: '700' }}>
                                    {a.reason || 'Amendment request'}
                                </Text>
                                <Text style={{ color: COLORS.text2, fontSize: 11, marginTop: 2 }}>
                                    {a.requestedAt ? new Date(a.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                                    {' · '}
                                    <Text style={{ color: accent, textTransform: 'uppercase', fontWeight: '700' }}>{a.status ?? 'pending'}</Text>
                                </Text>
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );
}
