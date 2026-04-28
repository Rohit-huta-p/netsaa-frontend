// netsa-mobile/src/features/hirer-hub/components/HubTeamRowPayment.tsx
//
// Post contract-rollback team row — payment-driven instead of contract-
// driven. Restored layout (Apr 29):
//
//   [avatar] Priya Sharma                          [💬 contact]  [pill]
//            ₹50,000 · Lead dancer
//
//   - avatar + name + sub-line tap → artist profile
//   - whole-row tap (background) → team page (/gigs/[id]/team)
//   - contact button (MessageCircle) → ContactActionSheet (WA + call)
//   - status pill: PaymentStatusPill driven by useApplicationTransactions
//
// "Record payment" was moved out of the row into the team page per the
// Apr 29 product call (contact icon takes its place — keeps the row
// focused on at-a-glance state, not actions).

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { useApplicationTransactions } from '@/hooks/usePayments';
import { PaymentStatusPill } from './PaymentStatusPill';

const COLORS = {
    text0: '#F3EFE8',
    text2: '#6B6878',
    bg: '#16161F',
    contact: '#8B5CF6',
};

type Props = {
    application: any;
    /** The gig the application belongs to. Used for compensation amount. */
    gig: any;
    /** Fired when the hirer taps the contact button — Hub mounts the sheet. */
    onRequestContact: (application: any) => void;
};

function readTransactionsArray(raw: any): any[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.transactions)) return raw.transactions;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.data?.transactions)) return raw.data.transactions;
    return [];
}

export function HubTeamRowPayment({ application, gig, onRequestContact }: Props) {
    const router = useRouter();
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

    const goToProfile = () => {
        const artistId = application?.artistId;
        if (!artistId) return;
        try {
            router.push(`/(app)/profile/${artistId}` as any);
        } catch {
            /* noop in test */
        }
    };

    const goToTeamPage = () => {
        const gigId = gig?._id;
        if (!gigId) return;
        try {
            router.push(`/(app)/gigs/${gigId}/team` as any);
        } catch {
            /* noop in test */
        }
    };

    return (
        <TouchableOpacity
            onPress={goToTeamPage}
            accessibilityLabel={`team-row-${application?._id ?? ''}`}
            activeOpacity={0.7}
            style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {/* Avatar + name + sub-line. Tappable — short-circuits the
                    row-tap (which would route to the team page) and goes to
                    the artist's profile instead. */}
                <TouchableOpacity
                    onPress={goToProfile}
                    accessibilityLabel={`Open profile for ${displayName}`}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 }}>
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
                            {artistType ? (
                                <>
                                    <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.text2 }} />
                                    <Text style={{ color: COLORS.text2, fontSize: 12 }}>{artistType}</Text>
                                </>
                            ) : null}
                            {hasTransactions ? (
                                <PaymentStatusPill transactions={transactions} />
                            ) : null}
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Contact button — opens ContactActionSheet at hub level. */}
                <TouchableOpacity
                    onPress={() => onRequestContact(application)}
                    accessibilityLabel={`Contact ${displayName}`}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: 'rgba(139,92,246,0.12)',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                    <MessageCircle size={16} color={COLORS.contact} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

export default HubTeamRowPayment;
