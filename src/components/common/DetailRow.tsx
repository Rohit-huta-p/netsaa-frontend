import React from 'react';
import { View, Text } from 'react-native';

interface DetailRowProps {
    label: string;
    value: string;
    /** If true, omits the bottom border */
    noBorder?: boolean;
    /** Custom value style override */
    valueClassName?: string;
    children?: React.ReactNode;
}

/**
 * Reusable label/value row for detail sections (e.g. "Start Date → 12 Mar 2026").
 * Used 15+ times across gig detail tabs.
 */
export const DetailRow: React.FC<DetailRowProps> = ({
    label,
    value,
    noBorder = false,
    valueClassName,
    children,
}) => (
    <View
        className={`flex-row justify-between items-center py-3 ${noBorder ? '' : 'border-b border-white/5'}`}
    >
        <Text className="text-sm text-zinc-400">{label}</Text>
        {children || (
            <Text className={valueClassName || 'text-base font-black text-white capitalize'}>
                {value}
            </Text>
        )}
    </View>
);
