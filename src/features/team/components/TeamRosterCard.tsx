// netsa-mobile/src/features/team/components/TeamRosterCard.tsx
//
// Full-width artist card on the team page. Renders the per-artist payment
// state via computePaymentSummary + deriveRecordPaymentState (Apr 29 fix
// for the over-record bug).
//
// State matrix (visible CTA / signal):
//   - record         → "Record ₹{remaining}" button (modal prefilled with remaining)
//   - pending        → "Awaiting confirmation" pill, button hidden
//   - paid_in_full   → "Paid in full ✓" badge, button hidden
//   - disputed       → "Disputed — resolve first" pill, button hidden
//   - no_amount_set  → button hidden (gig has ₹0 or null amount)

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Check, MessageCircle, Wallet, AlertTriangle } from 'lucide-react-native';
import { useApplicationTransactions } from '@/hooks/usePayments';
import { PaymentStatusPill } from '@/features/hirer-hub/components/PaymentStatusPill';
import { computePaymentSummary, deriveRecordPaymentState } from '../utils/paymentSummary';

const COLORS = {
    text0: '#F3EFE8',
    text2: '#6B6878',
    line: 'rgba(255,255,255,0.05)',
    cardBg: 'rgba(255,255,255,0.03)',
    cardBorder: 'rgba(255,255,255,0.06)',
    contact: '#8B5CF6',
    pay: '#FF6B35',
    paid: '#22C55E',
    pending: '#F59E0B',
    disputed: '#EF4444',
};

function readTransactionsArray(raw: any): any[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.transactions)) return raw.transactions;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.data?.transactions)) return raw.data.transactions;
    return [];
}

export interface TeamRosterCardProps {
    application: any;
    gig: any;
    onContact: (application: any) => void;
    /** Modal opens prefilled with the REMAINING amount, not full gig amount. */
    onRecordPayment: (application: any, defaultAmount: number) => void;
    onOpenProfile: (artistId: string) => void;
}

export function TeamRosterCard({
    application,
    gig,
    onContact,
    onRecordPayment,
    onOpenProfile,
}: TeamRosterCardProps) {
    const txQuery = useApplicationTransactions(application?._id);
    const transactions = readTransactionsArray(txQuery.data);

    const displayName = ((application?.artistSnapshot?.displayName ?? '') as string).trim() || 'Artist';
    const artistType = ((application?.artistSnapshot?.artistType ?? '') as string).trim();
    const initials = displayName
        .split(/\s+/)
        .map((s: string) => s[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'A';
    const totalAmount =
        gig?.compensation?.amount ??
        gig?.compensation?.maxAmount ??
        gig?.compensation?.minAmount ??
        0;

    const summary = computePaymentSummary(transactions, totalAmount);
    const paymentState = deriveRecordPaymentState(summary, totalAmount);
    const hasTransactions = transactions.length > 0;

    return (
        <View
            accessibilityLabel={`roster-card-${application?._id ?? ''}`}
            style={{
                marginHorizontal: 20,
                marginTop: 12,
                padding: 16,
                borderRadius: 18,
                backgroundColor: COLORS.cardBg,
                borderWidth: 1,
                borderColor: COLORS.cardBorder,
            }}>
            {/* Header row: avatar + name + status pill */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity
                    onPress={() => onOpenProfile(application?.artistId)}
                    accessibilityLabel={`Open profile for ${displayName}`}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <View
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            backgroundColor: '#16161F',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                        <Text style={{ color: COLORS.text0, fontWeight: '700', fontSize: 14 }}>
                            {initials}
                        </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ color: COLORS.text0, fontSize: 15, fontWeight: '800' }}>
                            {displayName}
                        </Text>
                        <Text style={{ color: COLORS.text2, fontSize: 12, marginTop: 3 }}>
                            ₹{totalAmount.toLocaleString('en-IN')}
                            {artistType ? ` · ${artistType}` : ''}
                        </Text>
                        {/* Per-artist accumulation line — only when something has happened. */}
                        {hasTransactions ? (
                            <Text style={{ color: COLORS.text2, fontSize: 11, marginTop: 4 }}>
                                {paymentState === 'paid_in_full'
                                    ? `₹${summary.confirmed.toLocaleString('en-IN')} paid in full`
                                    : `₹${summary.confirmed.toLocaleString('en-IN')} of ₹${totalAmount.toLocaleString('en-IN')} paid`}
                                {summary.pending > 0
                                    ? ` · ₹${summary.pending.toLocaleString('en-IN')} pending`
                                    : ''}
                                {summary.disputed > 0
                                    ? ` · ₹${summary.disputed.toLocaleString('en-IN')} disputed`
                                    : ''}
                            </Text>
                        ) : null}
                    </View>
                </TouchableOpacity>
                {hasTransactions ? <PaymentStatusPill transactions={transactions} /> : null}
            </View>

            {/* Action row */}
            <View
                style={{
                    flexDirection: 'row',
                    gap: 10,
                    marginTop: 14,
                    paddingTop: 14,
                    borderTopWidth: 1,
                    borderTopColor: COLORS.line,
                }}>
                {/* Contact button — always visible (every team member can be reached). */}
                <TouchableOpacity
                    onPress={() => onContact(application)}
                    accessibilityLabel={`Contact ${displayName}`}
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: 'rgba(139,92,246,0.10)',
                        borderWidth: 1,
                        borderColor: 'rgba(139,92,246,0.30)',
                    }}>
                    <MessageCircle size={14} color={COLORS.contact} />
                    <Text style={{ color: COLORS.contact, fontSize: 12, fontWeight: '800' }}>
                        Contact
                    </Text>
                </TouchableOpacity>

                {/* Right side — varies by paymentState. */}
                {paymentState === 'record' && (
                    <TouchableOpacity
                        onPress={() => onRecordPayment(application, summary.remaining)}
                        accessibilityLabel={`Record payment to ${displayName}`}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            paddingVertical: 10,
                            borderRadius: 12,
                            backgroundColor: 'rgba(255,107,53,0.10)',
                            borderWidth: 1,
                            borderColor: 'rgba(255,107,53,0.30)',
                        }}>
                        <Wallet size={14} color={COLORS.pay} />
                        <Text style={{ color: COLORS.pay, fontSize: 12, fontWeight: '800' }}>
                            {summary.confirmed > 0
                                ? `Record ₹${summary.remaining.toLocaleString('en-IN')}`
                                : 'Record payment'}
                        </Text>
                    </TouchableOpacity>
                )}

                {paymentState === 'pending' && (
                    <View
                        accessibilityLabel={`payment-pending-${application?._id ?? ''}`}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            paddingVertical: 10,
                            borderRadius: 12,
                            backgroundColor: 'rgba(245,158,11,0.10)',
                            borderWidth: 1,
                            borderColor: 'rgba(245,158,11,0.30)',
                        }}>
                        <AlertTriangle size={14} color={COLORS.pending} />
                        <Text style={{ color: COLORS.pending, fontSize: 12, fontWeight: '800' }}>
                            Awaiting confirmation
                        </Text>
                    </View>
                )}

                {paymentState === 'paid_in_full' && (
                    <View
                        accessibilityLabel={`payment-paid-in-full-${application?._id ?? ''}`}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            paddingVertical: 10,
                            borderRadius: 12,
                            backgroundColor: 'rgba(34,197,94,0.10)',
                            borderWidth: 1,
                            borderColor: 'rgba(34,197,94,0.30)',
                        }}>
                        <Check size={14} color={COLORS.paid} strokeWidth={3} />
                        <Text style={{ color: COLORS.paid, fontSize: 12, fontWeight: '800' }}>
                            Paid in full
                        </Text>
                    </View>
                )}

                {paymentState === 'disputed' && (
                    <View
                        accessibilityLabel={`payment-disputed-${application?._id ?? ''}`}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            paddingVertical: 10,
                            borderRadius: 12,
                            backgroundColor: 'rgba(239,68,68,0.10)',
                            borderWidth: 1,
                            borderColor: 'rgba(239,68,68,0.30)',
                        }}>
                        <AlertTriangle size={14} color={COLORS.disputed} />
                        <Text style={{ color: COLORS.disputed, fontSize: 12, fontWeight: '800' }}>
                            Disputed
                        </Text>
                    </View>
                )}
                {/* paymentState === 'no_amount_set' → render nothing on the right side. */}
            </View>
        </View>
    );
}

export default TeamRosterCard;
