// netsa-mobile/src/features/hirer-hub/components/HubTeamRowPayment.tsx
//
// Compact team row for the Project Hub. Shows artist + amount + role +
// Contact icon. Whole-row tap opens the per-gig TeamPage.
//
// PAYMENTS-DISABLED (Apr 29): payment-status pill + transaction lookup
// removed until on-platform Razorpay ships. Card was previously wired
// to useApplicationTransactions to show recorded/confirmed/disputed
// states inline; that's all gone now.

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
// PAYMENTS-DISABLED imports retained for fast revert:
// import { useApplicationTransactions } from '@/hooks/usePayments';
// import { PaymentStatusPill } from './PaymentStatusPill';

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

export function HubTeamRowPayment({ application, gig, onRequestContact }: Props) {
    const router = useRouter();

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

    // Apr 30: dedicated team page removed; team is a Hub section now.
    // Whole-row tap routes to the artist's profile (same as the
    // avatar/name tap). Slightly redundant with `goToProfile` but keeps
    // the entire row tappable, not just the left half.
    const goToTeamPage = goToProfile;

    return (
        <TouchableOpacity
            onPress={goToTeamPage}
            accessibilityLabel={`team-row-${application?._id ?? ''}`}
            activeOpacity={0.7}
            style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
                            {/* PAYMENTS-DISABLED: PaymentStatusPill + transactions hook removed. */}
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
