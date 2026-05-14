import React from 'react';
import { View, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import { SectionHeading } from './SectionHeading';

interface CompensationPerksSectionProps {
    amount?: number;
    minAmount?: number;
    maxAmount?: number;
    perks?: string[];
}

/**
 * Plan 5 v2 — inline "Compensation" recap below the page-top PayHero.
 * Repeats the headline pay (smaller now) and lists the perks/benefits
 * the hirer included with the gig.
 *
 * No more "30/70 SPLIT" bar, no "PAID VIA NETSA" eyebrow — those were
 * explicitly removed per the v2 mockup.
 *
 * Auto-hides when there's no pay AND no perks.
 */
function formatINR(n: number): string {
    return n.toLocaleString('en-IN');
}

function payLabel(props: CompensationPerksSectionProps): string | null {
    const { amount, minAmount, maxAmount } = props;
    if (typeof amount === 'number' && amount > 0) return `₹${formatINR(amount)}`;
    if (typeof minAmount === 'number' && minAmount > 0) {
        if (typeof maxAmount === 'number' && maxAmount > minAmount) {
            return `₹${formatINR(minAmount)} – ₹${formatINR(maxAmount)}`;
        }
        return `From ₹${formatINR(minAmount)}`;
    }
    return null;
}

export const CompensationPerksSection: React.FC<
    CompensationPerksSectionProps
> = (props) => {
    const { perks } = props;
    const pay = payLabel(props);
    const hasPerks = Array.isArray(perks) && perks.length > 0;

    if (!pay && !hasPerks) return null;

    return (
        <View className="mb-7" testID="compensation-section">
            <SectionHeading>Compensation</SectionHeading>

            {pay ? (
                <View className="flex-row items-baseline gap-2 mb-4">
                    <Text className="text-[22px] font-black text-white tracking-tight">
                        {pay}
                    </Text>
                    <Text className="text-[12px] text-zinc-400 font-light">
                        per artist
                    </Text>
                </View>
            ) : null}

            {hasPerks ? (
                <View testID="compensation-perks">
                    <Text className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-2.5">
                        Includes
                    </Text>
                    <View className="flex-row flex-wrap gap-1.5">
                        {perks!.map((perk, idx) => (
                            <View
                                key={`${idx}-${perk.slice(0, 16)}`}
                                className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-white/10 bg-white/[0.03]"
                            >
                                <Check size={11} color="#10B981" />
                                <Text className="text-[11px] font-medium text-zinc-300">
                                    {perk}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            ) : null}
        </View>
    );
};
