// src/features/hirer-hub/components/HubMiniTimeline.tsx
//
// Compact 4-node timeline that lives inside a team row.
// Color of node 2/3/4 communicates "where the contract is".

import React from 'react';
import { View } from 'react-native';
import type { ContractStage, StageNodeColor } from '../utils/computeContractStage';

const COLOR_MAP: Record<StageNodeColor, string> = {
    green: '#22C55E',
    gold: '#F59E0B',
    purple: '#8B5CF6',
    red: '#EF4444',
    grey: '#3F3D4A',
};

type Props = {
    nodes: ContractStage['nodes'];
    overlay: ContractStage['overlay'];
};

export function HubMiniTimeline({ nodes, overlay }: Props) {
    return (
        <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: 0 }}
            testID="mini-tl"
        >
            {nodes.map((n, i) => (
                <React.Fragment key={i}>
                    <View
                        testID="mini-tl-node"
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: COLOR_MAP[n.color],
                            ...(n.state === 'active' && {
                                shadowColor: COLOR_MAP[n.color],
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.5,
                                shadowRadius: 3,
                            }),
                        }}
                    />
                    {i < nodes.length - 1 && (
                        <View
                            testID="mini-tl-connector"
                            style={{
                                width: 14,
                                height: 1,
                                backgroundColor:
                                    n.state === 'done' && nodes[i + 1].state !== 'pending'
                                        ? COLOR_MAP[n.color]
                                        : 'rgba(255,255,255,0.09)',
                            }}
                        />
                    )}
                </React.Fragment>
            ))}
            {overlay === 'disputed' && (
                <View
                    testID="mini-tl-overlay-disputed"
                    style={{ marginLeft: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: COLOR_MAP.red }}
                />
            )}
        </View>
    );
}
