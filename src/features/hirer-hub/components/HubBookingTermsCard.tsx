// src/features/hirer-hub/components/HubBookingTermsCard.tsx
//
// Read-only summary of the gig's master/template booking terms.
// Phase 2A: Edit + Preview both wired.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Eye, Edit3, Info } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BookingTermsPreviewModal } from '@/features/booking-terms-editor/components/BookingTermsPreviewModal';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878',
    bg1: '#0F0F16', line: 'rgba(255,255,255,0.05)',
    orange: '#FF6B35', purple: '#8B5CF6',
};

type Props = {
    gigId: string;
    paymentStructure?: 'full' | 'advance_balance';
    cancellationPolicy?: string;
    leadAmount?: number;
    subArtistAmount?: number;
    customClausesCount?: number;
    activeContractsCount: number;
    negotiable?: boolean;
    termsAndConditions?: string;
};

const STRUCTURE_LABEL: Record<string, string> = {
    full: 'Full upfront',
    advance_balance: '30/70 advance',
};

export function HubBookingTermsCard({
    gigId,
    paymentStructure = 'advance_balance',
    cancellationPolicy = '48h',
    leadAmount = 0,
    subArtistAmount,
    customClausesCount = 0,
    activeContractsCount,
    negotiable = false,
    termsAndConditions,
}: Props) {
    const router = useRouter();
    const [previewOpen, setPreviewOpen] = useState(false);

    return (
        <>
            <View style={{ paddingHorizontal: 24, paddingTop: 36 }}>
                <View style={{ marginBottom: 20, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 24, color: COLORS.text0, letterSpacing: -0.4 }}>
                        Booking terms
                    </Text>
                    <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                        Template · {activeContractsCount} sealed
                    </Text>
                </View>

                <View style={{ borderRadius: 16, padding: 20, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.line }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        <View style={{ width: '50%', marginBottom: 16 }}>
                            <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Pay structure</Text>
                            <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '700', marginTop: 4 }}>{STRUCTURE_LABEL[paymentStructure]}</Text>
                        </View>
                        <View style={{ width: '50%', marginBottom: 16 }}>
                            <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Cancellation</Text>
                            <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '700', marginTop: 4 }}>{cancellationPolicy} notice</Text>
                        </View>
                        <View style={{ width: '50%' }}>
                            <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Compensation</Text>
                            <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '700', marginTop: 4 }}>
                                ₹{(leadAmount).toLocaleString('en-IN')}{subArtistAmount ? ` · ₹${subArtistAmount.toLocaleString('en-IN')} ea` : ''}
                            </Text>
                        </View>
                        <View style={{ width: '50%' }}>
                            <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Custom clauses</Text>
                            <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '700', marginTop: 4 }}>
                                {customClausesCount === 0 ? 'None' : `${customClausesCount} added`}
                            </Text>
                        </View>
                    </View>

                    <View style={{ height: 1, backgroundColor: COLORS.line, marginTop: 4, marginBottom: 16 }} />

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                            onPress={() => setPreviewOpen(true)}
                            accessibilityLabel="Preview as artists see"
                            style={{
                                flex: 1, paddingVertical: 10, borderRadius: 8,
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                                backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.20)',
                            }}>
                            <Eye size={12} color={COLORS.purple} />
                            <Text style={{ color: COLORS.purple, fontSize: 12, fontWeight: '700' }}>Preview as artists see</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push(`/(app)/gigs/${gigId}/booking-terms` as any)}
                            accessibilityLabel="Edit terms"
                            style={{
                                flex: 1, paddingVertical: 10, borderRadius: 8,
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                                backgroundColor: 'rgba(255,107,53,0.08)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.25)',
                            }}>
                            <Edit3 size={12} color={COLORS.orange} />
                            <Text style={{ color: COLORS.orange, fontSize: 12, fontWeight: '700' }}>Edit terms</Text>
                        </TouchableOpacity>
                    </View>

                    {activeContractsCount > 0 && (
                        <View style={{ marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.02)', flexDirection: 'row', gap: 8 }}>
                            <Info size={11} color={COLORS.text2} style={{ marginTop: 2 }} />
                            <Text style={{ flex: 1, fontSize: 11, color: COLORS.text2, lineHeight: 16 }}>
                                Edits apply to <Text style={{ color: COLORS.text1 }}>new hires only</Text>. {activeContractsCount} existing contract{activeContractsCount === 1 ? '' : 's'} keep sealed terms unless you push an amendment.
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <BookingTermsPreviewModal
                visible={previewOpen}
                paymentStructure={paymentStructure}
                cancellationPolicy={cancellationPolicy as any}
                amount={leadAmount}
                negotiable={negotiable}
                termsAndConditions={termsAndConditions}
                onClose={() => setPreviewOpen(false)}
            />
        </>
    );
}
