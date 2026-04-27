// src/features/contract-workspace/components/ContractActivity.tsx
//
// Vertical timestamped log. Shows up to 5; expand button reveals full list.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { ActivityEvent } from '../hooks/useContractActivity';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878', text3: '#3F3D4A',
    green: '#22C55E', gold: '#F59E0B', orange: '#FF6B35', red: '#EF4444', grey: '#6B6878',
};

const BULLET_COLORS: Record<string, string> = {
    green: COLORS.green, gold: COLORS.gold, orange: COLORS.orange,
    red: COLORS.red, grey: COLORS.text3,
};

type Props = { events: ActivityEvent[] };

const PREVIEW_COUNT = 5;

function formatTs(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() +
            ' · ' +
            d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch {
        return '—';
    }
}

export function ContractActivity({ events }: Props) {
    const [expanded, setExpanded] = useState(false);
    const visible = expanded ? events : events.slice(0, PREVIEW_COUNT);

    return (
        <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>
            <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: COLORS.text0, letterSpacing: -0.2 }}>Activity</Text>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {events.length} {events.length === 1 ? 'event' : 'events'}
                </Text>
            </View>

            {events.length === 0 ? (
                <Text style={{ color: COLORS.text2, fontSize: 13, paddingVertical: 16, textAlign: 'center' }}>
                    Activity will appear as the contract progresses.
                </Text>
            ) : (
                <>
                    <View style={{ gap: 14 }}>
                        {visible.map((e, i) => (
                            <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                                <View style={{
                                    width: 8, height: 8, borderRadius: 4, marginTop: 6,
                                    backgroundColor: BULLET_COLORS[e.bullet],
                                }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: COLORS.text0, fontSize: 13, fontWeight: '700' }}>
                                        {e.title}
                                    </Text>
                                    <Text style={{ color: COLORS.text2, fontSize: 10, fontFamily: 'SpaceMono-Regular', marginTop: 2 }}>
                                        {formatTs(e.timestamp)}
                                    </Text>
                                    {e.detail && (
                                        <Text style={{ color: COLORS.text1, fontSize: 12, marginTop: 4 }}>
                                            {e.detail}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                    {events.length > PREVIEW_COUNT && (
                        <TouchableOpacity onPress={() => setExpanded((e) => !e)} style={{ paddingTop: 16 }}>
                            <Text style={{ color: COLORS.text1, fontSize: 12, fontWeight: '700', textAlign: 'center' }}>
                                {expanded ? 'Show less' : `Show all ${events.length} events →`}
                            </Text>
                        </TouchableOpacity>
                    )}
                </>
            )}
        </View>
    );
}
