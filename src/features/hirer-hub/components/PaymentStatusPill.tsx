// netsa-mobile/src/features/hirer-hub/components/PaymentStatusPill.tsx
//
// Small status chip used on Hub team rows to summarize the current
// off-platform payment state. Reads the latest transaction's status
// from the array (most-recent createdAt) and maps to a tone + label.
//
// Status map:
//   no transactions  → null (caller renders the "Record payment" CTA instead)
//   recorded         → orange · "Pending confirmation"
//   confirmed        → green  · "Confirmed"
//   completed        → green  · "Paid"
//   disputed         → red    · "Disputed"
//   refunded/expired → grey   · status as label

import React from 'react';
import { Text, View } from 'react-native';

const TONES: Record<string, { bg: string; fg: string; label: string }> = {
    recorded:  { bg: 'rgba(245,158,11,0.10)', fg: '#F59E0B', label: 'Pending confirmation' },
    confirmed: { bg: 'rgba(34,197,94,0.10)',  fg: '#22C55E', label: 'Confirmed' },
    completed: { bg: 'rgba(34,197,94,0.10)',  fg: '#22C55E', label: 'Paid' },
    disputed:  { bg: 'rgba(239,68,68,0.10)',  fg: '#EF4444', label: 'Disputed' },
    refunded:  { bg: 'rgba(255,255,255,0.05)', fg: '#A1A1AA', label: 'Refunded' },
    expired:   { bg: 'rgba(255,255,255,0.05)', fg: '#A1A1AA', label: 'Expired' },
};

export interface PaymentStatusPillProps {
    /** All transactions for this application; we read the most recent. */
    transactions?: Array<{ status?: string; createdAt?: string; amount?: number }> | null;
}

function pickLatest(
    transactions: PaymentStatusPillProps['transactions']
): { status?: string; amount?: number } | null {
    if (!transactions || transactions.length === 0) return null;
    // Sort by createdAt desc; first row wins.
    const sorted = [...transactions].sort((a, b) => {
        const aT = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bT = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bT - aT;
    });
    return sorted[0];
}

export function PaymentStatusPill({ transactions }: PaymentStatusPillProps) {
    const latest = pickLatest(transactions);
    if (!latest || !latest.status) return null;

    const tone = TONES[latest.status];
    if (!tone) return null;

    return (
        <View
            accessibilityLabel={`payment-status-${latest.status}`}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: tone.bg,
                gap: 6,
            }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tone.fg }} />
            <Text style={{ color: tone.fg, fontSize: 11, fontWeight: '700', letterSpacing: 0.3 }}>
                {tone.label}
            </Text>
        </View>
    );
}

export default PaymentStatusPill;
