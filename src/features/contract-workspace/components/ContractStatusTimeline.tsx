// src/features/contract-workspace/components/ContractStatusTimeline.tsx
//
// 5-node horizontal timeline with stage labels below.

import React from 'react';
import { View, Text } from 'react-native';
import type { ContractTimelineStage } from '../utils/computeContractTimelineStage';

const NODE_COLORS: Record<string, string> = {
    green: '#22C55E', gold: '#F59E0B', purple: '#8B5CF6', red: '#EF4444', grey: '#3F3D4A',
};
const TEXT_COLORS = { text1: '#B8B1A6', text2: '#6B6878', text3: '#3F3D4A' };

const STAGE_LABELS = ['Sent', 'Signed', 'Advance Paid', 'Final Due', 'Completed'];

type Props = {
    stage: ContractTimelineStage;
};

export function ContractStatusTimeline({ stage }: Props) {
    return (
        <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {stage.nodes.map((n, i) => (
                    <React.Fragment key={i}>
                        <View
                            style={{
                                width: 14, height: 14, borderRadius: 7,
                                backgroundColor: NODE_COLORS[n.color],
                                ...(n.state === 'active' && {
                                    shadowColor: NODE_COLORS[n.color],
                                    shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
                                }),
                            }}
                        />
                        {i < stage.nodes.length - 1 && (
                            <View style={{
                                flex: 1, height: 2,
                                backgroundColor: n.state === 'done' && stage.nodes[i + 1].state !== 'pending'
                                    ? NODE_COLORS[n.color]
                                    : 'rgba(255,255,255,0.09)',
                            }} />
                        )}
                    </React.Fragment>
                ))}
            </View>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
                {STAGE_LABELS.map((label, i) => (
                    <Text
                        key={label}
                        style={{
                            flex: 1,
                            fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5,
                            color: stage.nodes[i].state === 'done'
                                ? TEXT_COLORS.text1
                                : stage.nodes[i].state === 'active'
                                    ? NODE_COLORS[stage.nodes[i].color]
                                    : TEXT_COLORS.text3,
                            textAlign: i === 0 ? 'left' : i === STAGE_LABELS.length - 1 ? 'right' : 'center',
                        }}>
                        {label}
                    </Text>
                ))}
            </View>
        </View>
    );
}
