// netsa-mobile/src/features/team/components/TeamRosterCard.tsx
//
// PAYMENTS-DISABLED (Apr 29): off-platform Record/Confirm/Dispute flow
// rolled back from the UI until on-platform Razorpay ships. The 5-state
// matrix + per-artist payment accumulation line + Record-payment button
// are all hidden. Card now shows just the artist identity + Contact CTA.
//
// To revert: search "PAYMENTS-DISABLED" in this file (and across
// src/features/team/, src/features/payments/, dashboards) and re-enable.
// Backend offline.controller endpoints are preserved + still functional.

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
// PAYMENTS-DISABLED imports retained for fast revert:
// import { useApplicationTransactions } from '@/hooks/usePayments';
// import { PaymentStatusPill } from '@/features/hirer-hub/components/PaymentStatusPill';
// import { computePaymentSummary, deriveRecordPaymentState } from '../utils/paymentSummary';

const COLORS = {
    text0: '#F3EFE8',
    text2: '#6B6878',
    line: 'rgba(255,255,255,0.05)',
    cardBg: 'rgba(255,255,255,0.03)',
    cardBorder: 'rgba(255,255,255,0.06)',
    contact: '#8B5CF6',
};

export interface TeamRosterCardProps {
    application: any;
    gig: any;
    onContact: (application: any) => void;
    /**
     * PAYMENTS-DISABLED: kept on the prop type for backward compat with
     * TeamPage's interface, but no longer wired to a CTA. Will reactivate
     * when on-platform payments ship.
     */
    onRecordPayment?: (application: any, defaultAmount: number) => void;
    onOpenProfile: (artistId: string) => void;
}

export function TeamRosterCard({
    application,
    gig,
    onContact,
    onOpenProfile,
}: TeamRosterCardProps) {
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
            {/* Header row: avatar + name + amount + role */}
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
                    </View>
                </TouchableOpacity>
            </View>

            {/* Action row: Contact only (PAYMENTS-DISABLED hides Record-payment) */}
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
            </View>
        </View>
    );
}

export default TeamRosterCard;
