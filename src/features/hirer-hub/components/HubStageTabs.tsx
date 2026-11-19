// src/features/hirer-hub/components/HubStageTabs.tsx
//
// The three-stage segmented control (Applied / Shortlisted / Hired) with
// per-stage counts. Extracted from HubOverview so the hub and the "See all"
// screen (GigApplicantsAllScreen) render the identical control. Neutral-grey
// variant A — tokens shared via hubTabTokens.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TAB_ON, TAB_OFF, TAB_LINE } from './hubTabTokens';
import type { HubStage } from '../hooks/useGigHubData';

const TEXT0 = '#F3EFE8';
const TEXT2 = '#6B6878';

const STAGE_ORDER: { key: HubStage; label: string }[] = [
    { key: 'applied', label: 'Applied' },
    { key: 'shortlisted', label: 'Shortlisted' },
    { key: 'hired', label: 'Hired' },
];

type Props = {
    counts: { applied: number; shortlisted: number; hired: number };
    activeStage: HubStage;
    onSelectStage: (stage: HubStage) => void;
    marginHorizontal?: number;
    marginTop?: number;
};

export function HubStageTabs({ counts, activeStage, onSelectStage, marginHorizontal = 24, marginTop = 10 }: Props) {
    return (
        <View style={{ flexDirection: 'row', marginHorizontal, marginTop, backgroundColor: TAB_OFF, borderWidth: 1, borderColor: TAB_LINE, borderRadius: 12, overflow: 'hidden' }}>
            {STAGE_ORDER.map(({ key, label }, i) => {
                const on = key === activeStage;
                return (
                    <TouchableOpacity
                        key={key}
                        onPress={() => onSelectStage(key)}
                        accessibilityLabel={`${label} stage`}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: on }}
                        activeOpacity={0.8}
                        style={{
                            flex: 1, paddingVertical: 9, paddingHorizontal: 8,
                            alignItems: 'center',
                            backgroundColor: on ? TAB_ON : 'transparent',
                            borderLeftWidth: i === 0 ? 0 : 1, borderLeftColor: TAB_LINE,
                        }}>
                        <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 17, color: TEXT0 }}>
                            {counts[key]}
                        </Text>
                        <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 7.5, letterSpacing: 0.7, textTransform: 'uppercase', marginTop: 3, color: on ? TEXT0 : TEXT2 }}>
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

export default HubStageTabs;
