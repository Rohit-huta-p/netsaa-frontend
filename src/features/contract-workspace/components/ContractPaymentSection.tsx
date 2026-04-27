// src/features/contract-workspace/components/ContractPaymentSection.tsx
//
// Progress bar + per-installment row. CTAs (Pay / Record) wired by parent —
// this component is presentational.

import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878',
    bg1: '#0F0F16', bg3: '#1C1C28', line: 'rgba(255,255,255,0.05)',
    green: '#22C55E', gold: '#F59E0B', orange: '#FF6B35',
};

type Props = {
    amount: number;
    paidAmount: number;
    paymentStructure: 'full' | 'advance_balance';
    paymentMethod: 'on_platform' | 'off_platform';
    isHirer: boolean;
    eventDate?: string;
};

const STRUCTURE_LABEL: Record<string, string> = {
    full: 'Full upfront',
    advance_balance: '30/70 split',
};

function comingSoon() {
    Alert.alert('Coming soon', 'Payment flows ship in a follow-up release.');
}

export function ContractPaymentSection({
    amount, paidAmount, paymentStructure, paymentMethod, isHirer, eventDate,
}: Props) {
    const isAdvance = paymentStructure === 'advance_balance';
    const advanceCutoff = isAdvance ? amount * 0.3 : amount;
    const balance = amount - advanceCutoff;
    const advancePaid = paidAmount >= advanceCutoff;
    const fullyPaid = paidAmount >= amount;
    const pct = amount > 0 ? Math.min(100, Math.floor((paidAmount / amount) * 100)) : 0;
    const eventPast = !!eventDate && new Date(eventDate).getTime() < Date.now();

    return (
        <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>
            <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: COLORS.text0, letterSpacing: -0.2 }}>Payment</Text>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {STRUCTURE_LABEL[paymentStructure]}
                </Text>
            </View>

            {/* Progress bar */}
            <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: COLORS.text1, fontSize: 13 }}>
                        ₹{paidAmount.toLocaleString('en-IN')} of ₹{amount.toLocaleString('en-IN')} paid
                    </Text>
                    <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: COLORS.green }}>
                        {pct}%
                    </Text>
                </View>
                <View style={{ height: 8, borderRadius: 999, backgroundColor: COLORS.bg3, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${pct}%`, backgroundColor: COLORS.green, borderRadius: 999 }} />
                </View>
            </View>

            {/* Advance row */}
            <PaymentRow
                title={isAdvance ? 'Advance · 30%' : 'Total payment'}
                amount={advanceCutoff}
                paid={advancePaid}
                accent={advancePaid ? COLORS.green : COLORS.gold}
                ctaLabel={!advancePaid && isHirer ? (paymentMethod === 'off_platform' ? 'Record' : 'Pay via NETSA') : null}
                onCTA={comingSoon}
                statusText={advancePaid ? 'Paid' : 'Pending'}
            />

            {/* Balance row (only for advance_balance) */}
            {isAdvance && (
                <View style={{ marginTop: 8 }}>
                    <PaymentRow
                        title="Balance · 70%"
                        amount={balance}
                        paid={fullyPaid}
                        accent={fullyPaid ? COLORS.green : COLORS.gold}
                        ctaLabel={!fullyPaid && isHirer && eventPast ? 'Pay balance' : null}
                        onCTA={comingSoon}
                        statusText={fullyPaid ? 'Paid' : eventPast ? 'Due' : `Due after event`}
                    />
                </View>
            )}
        </View>
    );
}

function PaymentRow({
    title, amount, paid, accent, ctaLabel, onCTA, statusText,
}: {
    title: string;
    amount: number;
    paid: boolean;
    accent: string;
    ctaLabel: string | null;
    onCTA: () => void;
    statusText: string;
}) {
    return (
        <View style={{
            borderRadius: 12, padding: 12,
            backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.line,
            borderLeftWidth: 3, borderLeftColor: accent,
        }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.text0, fontSize: 13, fontWeight: '700' }}>{title}</Text>
                    <Text style={{ color: COLORS.text2, fontSize: 11, marginTop: 2 }}>{statusText}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: accent, fontSize: 14, fontWeight: '700' }}>
                        ₹{amount.toLocaleString('en-IN')}
                    </Text>
                </View>
            </View>
            {ctaLabel && (
                <TouchableOpacity onPress={onCTA} accessibilityLabel={ctaLabel} style={{
                    marginTop: 12, paddingVertical: 8, borderRadius: 8,
                    backgroundColor: accent, alignItems: 'center',
                }}>
                    <Text style={{ color: '#0A0A0F', fontSize: 12, fontWeight: '700' }}>{ctaLabel} →</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
