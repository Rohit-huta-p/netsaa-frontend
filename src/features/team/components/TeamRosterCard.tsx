// netsa-mobile/src/features/team/components/TeamRosterCard.tsx
//
// Full-width artist card on the team page. Richer than the Hub row:
// includes payment-status pill + per-artist Record-payment CTA + Contact
// CTA + tap-to-profile. Reads transactions per-row via React Query.

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MessageCircle, Wallet } from 'lucide-react-native';
import { useApplicationTransactions } from '@/hooks/usePayments';
import { PaymentStatusPill } from '@/features/hirer-hub/components/PaymentStatusPill';

const COLORS = {
    text0: '#F3EFE8',
    text2: '#6B6878',
    line: 'rgba(255,255,255,0.05)',
    cardBg: 'rgba(255,255,255,0.03)',
    cardBorder: 'rgba(255,255,255,0.06)',
    contact: '#8B5CF6',
    pay: '#FF6B35',
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
    onRecordPayment: (application: any) => void;
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
    const hasTransactions = transactions.length > 0;

    const displayName = ((application?.artistSnapshot?.displayName ?? '') as string).trim() || 'Artist';
    const artistType = ((application?.artistSnapshot?.artistType ?? '') as string).trim();
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
                            ₹{amount.toLocaleString('en-IN')}
                            {artistType ? ` · ${artistType}` : ''}
                        </Text>
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
                <TouchableOpacity
                    onPress={() => onRecordPayment(application)}
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
                        Record payment
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default TeamRosterCard;
