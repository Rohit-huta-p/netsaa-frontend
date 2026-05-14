import React from 'react';
import { View, Text } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';

interface TrustStripInlineProps {
    isVerified?: boolean;
}

/**
 * Plan 5 v2 — single-pill trust strip directly below the producer card.
 * Mirrors the mockup's standalone "Verified producer" badge. Renders
 * nothing when the producer isn't verified — keeps the page quiet
 * for unverified hirers while still giving verified ones earned trust.
 */
export const TrustStripInline: React.FC<TrustStripInlineProps> = ({
    isVerified,
}) => {
    if (!isVerified) return null;

    return (
        <View
            className="flex-row mb-5"
            testID="trust-strip-inline"
        >
            <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/10">
                <ShieldCheck size={11} color="#10B981" />
                <Text className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-400">
                    Verified producer
                </Text>
            </View>
        </View>
    );
};
