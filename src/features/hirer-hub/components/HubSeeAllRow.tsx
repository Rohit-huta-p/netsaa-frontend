// src/features/hirer-hub/components/HubSeeAllRow.tsx
//
// The "See all {N} →" row shown under a capped stage preview on the hub. Tapping
// it opens the full paginated list (GigApplicantsAllScreen).

import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { ArrowRight } from 'lucide-react-native';

type Props = {
    count: number;
    label?: string;
    onPress?: () => void;
};

export function HubSeeAllRow({ count, label = 'applicants', onPress }: Props) {
    return (
        <TouchableOpacity
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`See all ${count} ${label}`}
            activeOpacity={0.8}
            style={{
                marginTop: 6,
                height: 46,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.09)',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
            }}>
            <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 13, color: '#B8B1A6' }}>
                See all {count}
            </Text>
            <ArrowRight size={15} color="#B8B1A6" strokeWidth={2} />
        </TouchableOpacity>
    );
}

export default HubSeeAllRow;
