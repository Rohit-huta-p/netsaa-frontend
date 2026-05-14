import React from 'react';
import { View, Text } from 'react-native';
import { SectionHeading } from './SectionHeading';

interface WhatYoullDoSectionProps {
    responsibilities?: string[];
}

/**
 * Plan 5 v2 — bulleted "What you'll do" section. Sourced from the new
 * Gig.responsibilities[] field (1-8 short bullets the hirer writes when
 * posting). Auto-hides when no bullets are present so the page collapses
 * cleanly for legacy gigs that predate the field.
 */
export const WhatYoullDoSection: React.FC<WhatYoullDoSectionProps> = ({
    responsibilities,
}) => {
    if (!Array.isArray(responsibilities) || responsibilities.length === 0) {
        return null;
    }

    return (
        <View className="mb-7" testID="what-youll-do-section">
            <SectionHeading>What you'll do</SectionHeading>
            <View className="gap-3">
                {responsibilities.map((item, idx) => (
                    <View
                        key={`${idx}-${item.slice(0, 24)}`}
                        className="flex-row items-start gap-3"
                    >
                        {/* Round bullet mark — brand orange */}
                        <View className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-[7px]" />
                        <Text className="flex-1 text-[14px] leading-[22px] text-zinc-300 font-light">
                            {item}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
};
