import React from 'react';
import { View, Text } from 'react-native';

interface PayHeroProps {
    amount?: number;
    minAmount?: number;
    maxAmount?: number;
    currency?: string;
    negotiable?: boolean;
    /**
     * Free-form aux text — defaults to "per artist". Override when the
     * gig has a specific shape, e.g. "per shoot · 3 looks".
     */
    auxLabel?: string;
}

/**
 * Plan 5 — gig detail v2 pay hero. Big serif-feel amount in brand orange,
 * left-aligned, no card. Aux line beneath it carries the per-unit context
 * + negotiable flag. Replaces the old "Total Compensation" sidebar block
 * on mobile (CompensationSidebar still renders on desktop).
 */
function formatINR(n: number): string {
    return n.toLocaleString('en-IN');
}

export const PayHero: React.FC<PayHeroProps> = ({
    amount,
    minAmount,
    maxAmount,
    currency = 'INR',
    negotiable,
    auxLabel = 'per artist',
}) => {
    let amountNode: React.ReactNode;
    let amountValueLabel: string;

    if (typeof amount === 'number' && amount > 0) {
        amountValueLabel = `₹${formatINR(amount)}`;
        amountNode = (
            <View className="flex-row items-baseline">
                <Text className="text-[22px] font-semibold text-orange-500 mr-1">₹</Text>
                <Text className="text-[40px] leading-[40px] font-black text-orange-500 tracking-tight">
                    {formatINR(amount)}
                </Text>
            </View>
        );
    } else if (typeof minAmount === 'number' && minAmount > 0) {
        const upper =
            typeof maxAmount === 'number' && maxAmount > minAmount
                ? maxAmount
                : null;
        amountValueLabel = upper
            ? `₹${formatINR(minAmount)} – ₹${formatINR(upper)}`
            : `From ₹${formatINR(minAmount)}`;
        amountNode = (
            <View className="flex-row items-baseline">
                <Text className="text-[22px] font-semibold text-orange-500 mr-1">₹</Text>
                <Text className="text-[34px] leading-[36px] font-black text-orange-500 tracking-tight">
                    {formatINR(minAmount)}
                    {upper ? ` – ${formatINR(upper)}` : ''}
                </Text>
            </View>
        );
    } else {
        amountValueLabel = 'To be discussed';
        amountNode = (
            <Text className="text-[24px] font-bold text-orange-400 tracking-tight">
                To be discussed
            </Text>
        );
    }

    return (
        <View
            className="mb-5"
            accessibilityLabel={`Pay ${amountValueLabel}, ${auxLabel}${
                negotiable ? ', negotiable' : ''
            }`}
            testID="pay-hero"
        >
            <Text className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500 mb-1.5">
                Pay
            </Text>

            {amountNode}

            <Text
                className="text-[12px] text-zinc-400 mt-1.5"
                testID="pay-hero-aux"
            >
                {auxLabel}
                {negotiable ? (
                    <>
                        {' · '}
                        <Text className="text-zinc-300 font-semibold">negotiable</Text>
                    </>
                ) : null}
            </Text>
        </View>
    );
};
