// netsa-mobile/src/features/hirer-hub/components/HubTeamRowPayment.tsx
//
// Post contract-rollback team row. Replaces HubTeamRow's contract-driven
// rendering with a payment-driven row keyed off the GigApplication.
//
// Contracts may come back later — when they do, restore HubTeamRow + flip
// HubTeamSection back to use it. Search CONTRACTS-DISABLED markers.
//
// Behavior:
//   - No transactions yet → "Record payment" CTA opens RecordPaymentModal
//   - Transactions exist  → status pill shows latest state; row taps no-op
//                            (a future Phase 3B-full ledger panel will route
//                            here).

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useApplicationTransactions } from '@/hooks/usePayments';
import { PaymentStatusPill } from './PaymentStatusPill';

const COLORS = {
    text0: '#F3EFE8',
    text2: '#6B6878',
    bg: '#16161F',
    orange: '#FF6B35',
    gold: '#F59E0B',
};

type Props = {
    application: any;
    /** The gig the application belongs to. Used for compensation amount. */
    gig: any;
    /** Fired when the hirer taps "Record payment" — Hub mounts the modal. */
    onRequestRecordPayment: (application: any) => void;
};

function readTransactionsArray(raw: any): any[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    // Normalize a few common envelope shapes the API might return.
    if (Array.isArray(raw.transactions)) return raw.transactions;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.data?.transactions)) return raw.data.transactions;
    return [];
}

export function HubTeamRowPayment({ application, gig, onRequestRecordPayment }: Props) {
    const txQuery = useApplicationTransactions(application?._id);
    const transactions = readTransactionsArray(txQuery.data);
    const hasTransactions = transactions.length > 0;

    const displayName = ((application?.artistSnapshot?.displayName ?? '') as string).trim() || 'Artist';
    const initials = displayName
        .split(/\s+/)
        .map((s: string) => s[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'A';

    const amount =
        gig?.compensation?.amount ??
        gig?.compensation?.maxAmount ??
        gig?.compensation?.minAmount ??
        0;

    return (
        <View
            accessibilityLabel={`team-row-${application?._id ?? ''}`}
            style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {/* Avatar + name + amount */}
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <View
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: COLORS.bg,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                        <Text style={{ color: COLORS.text0, fontWeight: '700', fontSize: 13 }}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ color: COLORS.text0, fontSize: 14, fontWeight: '700' }}>
                            {displayName}
                        </Text>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                                marginTop: 4,
                            }}>
                            <Text style={{ color: COLORS.text2, fontSize: 12 }}>
                                ₹{amount.toLocaleString('en-IN')}
                            </Text>
                            {hasTransactions ? (
                                <PaymentStatusPill transactions={transactions} />
                            ) : null}
                        </View>
                    </View>
                </View>

                {/* CTA: only when no transaction yet — "Record payment" */}
                {!hasTransactions && (
                    <TouchableOpacity
                        onPress={() => onRequestRecordPayment(application)}
                        accessibilityLabel={`Record payment to ${displayName}`}
                        style={{
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                            backgroundColor: COLORS.gold,
                        }}>
                        <Text style={{ color: '#0A0A0F', fontSize: 12, fontWeight: '700' }}>
                            Record payment
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

export default HubTeamRowPayment;
