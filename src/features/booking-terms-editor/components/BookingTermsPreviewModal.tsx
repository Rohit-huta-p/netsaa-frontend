// src/features/booking-terms-editor/components/BookingTermsPreviewModal.tsx
//
// Read-only modal that renders the artist-facing terms exactly as they
// appear in the Apply modal Stage 1 panel. Returns null when !visible.

import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878',
    bg0: '#07070B', bg1: '#0F0F16',
    line: 'rgba(255,255,255,0.05)',
    orange: '#FF6B35',
};

type Props = {
    visible: boolean;
    paymentStructure?: 'full' | 'advance_balance';
    cancellationPolicy?: '24h' | '48h' | '72h';
    cancellationForfeitPct?: number;
    customClauses?: string[];   // NEW
    amount: number;
    negotiable: boolean;
    termsAndConditions?: string;
    onClose: () => void;
};

const STRUCTURE_LABEL: Record<string, string> = {
    full: 'Full upfront',
    advance_balance: '30/70 advance',
};

function FieldRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</Text>
            <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '600', marginTop: 4 }}>{value}</Text>
        </View>
    );
}

export function BookingTermsPreviewModal({
    visible,
    paymentStructure = 'full',
    cancellationPolicy = '48h',
    cancellationForfeitPct,
    customClauses,
    amount,
    negotiable,
    termsAndConditions,
    onClose,
}: Props) {
    if (!visible) return null;

    const tc = (termsAndConditions ?? '').trim();
    const formattedAmount = `₹${(amount ?? 0).toLocaleString('en-IN')}${negotiable ? ' · negotiable' : ''}`;

    return (
        <Modal visible transparent animationType="slide" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: COLORS.bg0 }}>
                <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: COLORS.text1, fontWeight: '600' }}>Preview</Text>
                    <TouchableOpacity onPress={onClose} accessibilityLabel="Close preview">
                        <X size={20} color={COLORS.text1} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ padding: 24 }}>
                    <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 26, color: COLORS.text0, letterSpacing: -0.4, marginBottom: 8 }}>
                        What artists see when they apply
                    </Text>
                    <Text style={{ color: COLORS.text2, fontSize: 13, marginBottom: 24, lineHeight: 18 }}>
                        These are the booking terms attached to your gig. Each applicant signs a copy at hire time.
                    </Text>

                    <View style={{ borderRadius: 16, padding: 20, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.line }}>
                        <Text style={{ fontSize: 11, color: COLORS.orange, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>
                            Booking terms
                        </Text>
                        <FieldRow label="Pay" value={`${formattedAmount} · ${STRUCTURE_LABEL[paymentStructure]}`} />
                        <FieldRow label="Cancellation" value={`${cancellationPolicy} notice · ${cancellationForfeitPct ?? 100}% forfeit if within window`} />
                        {customClauses && customClauses.length > 0 && (
                            <View style={{ marginTop: 8 }}>
                                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                                    Custom clauses
                                </Text>
                                <View style={{ gap: 8 }}>
                                    {customClauses.map((clause, i) => (
                                        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                                            <Text style={{ color: COLORS.orange, fontSize: 12, fontWeight: '700', minWidth: 18 }}>
                                                {String(i + 1).padStart(2, '0')}
                                            </Text>
                                            <Text style={{ flex: 1, color: COLORS.text1, fontSize: 13, lineHeight: 20 }}>
                                                {clause}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                        {tc && (
                            <View style={{ marginTop: 8 }}>
                                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                                    Additional terms
                                </Text>
                                <Text style={{ fontSize: 14, color: COLORS.text1, lineHeight: 22 }}>
                                    {tc}
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}
