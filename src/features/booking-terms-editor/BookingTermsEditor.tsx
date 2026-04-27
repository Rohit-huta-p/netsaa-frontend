// src/features/booking-terms-editor/BookingTermsEditor.tsx
//
// Focused single-screen editor for the gig's master booking terms.
// Save patches only dirty fields. Cancel-while-dirty triggers a discard
// prompt. Preview link opens BookingTermsPreviewModal.

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useGig } from '@/hooks/useGigs';
import { useBookingTermsEdit } from './hooks/useBookingTermsEdit';
import { PaymentStructurePicker } from './components/PaymentStructurePicker';
import { CancellationPicker } from './components/CancellationPicker';
import { NegotiableToggle } from './components/NegotiableToggle';
import { BookingTermsPreviewModal } from './components/BookingTermsPreviewModal';
import { CustomClausesEditor } from './components/CustomClausesEditor';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878', text3: '#3F3D4A',
    bg0: '#07070B', bg1: '#0F0F16', line: 'rgba(255,255,255,0.05)',
    orange: '#FF6B35', purple: '#8B5CF6',
};

type Props = { gigId: string };

export function BookingTermsEditor({ gigId }: Props) {
    const router = useRouter();
    const { data: gig, isLoading } = useGig(gigId);
    const [previewOpen, setPreviewOpen] = useState(false);

    const edit = useBookingTermsEdit(gigId, {
        paymentStructure: gig?.paymentStructure,
        cancellationPolicy: gig?.cancellationPolicy,
        cancellationForfeitPct: gig?.cancellationForfeitPct,
        customClauses: gig?.customClauses,
        negotiable: gig?.compensation?.negotiable,
    });

    if (isLoading || !gig) {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.bg0, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={COLORS.orange} size="large" />
            </View>
        );
    }

    const handleCancel = () => {
        if (!edit.isDirty) {
            router.back();
            return;
        }
        Alert.alert(
            'Discard changes?',
            'Your edits to the booking terms will be lost.',
            [
                { text: 'Keep editing', style: 'cancel' },
                { text: 'Discard', style: 'destructive', onPress: () => router.back() },
            ]
        );
    };

    const handleSave = async () => {
        try {
            await edit.save();
            Alert.alert('Saved', 'Booking terms updated · applies to new hires.', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (err: any) {
            Alert.alert('Save failed', err?.message ?? 'Could not update terms. Try again.');
        }
    };

    const compensationAmount = gig.compensation?.amount ?? 0;

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.bg0 }}>
            {/* Header */}
            <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={handleCancel} accessibilityLabel="Cancel">
                    <Text style={{ color: COLORS.text1, fontSize: 14 }}>Cancel</Text>
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Edit</Text>
                    <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '700', letterSpacing: -0.1 }}>Booking terms</Text>
                </View>
                <TouchableOpacity onPress={handleSave} disabled={!edit.isDirty || edit.isSaving} accessibilityLabel="Save">
                    <Text style={{ color: edit.isDirty ? COLORS.orange : COLORS.text3, fontSize: 14, fontWeight: '700', opacity: edit.isSaving ? 0.5 : 1 }}>
                        {edit.isSaving ? 'Saving…' : 'Save'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Hero */}
                <View style={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20 }}>
                    <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, color: COLORS.text0, letterSpacing: -0.5, lineHeight: 32 }}>
                        What every hire agrees to
                    </Text>
                    <Text style={{ marginTop: 8, color: COLORS.text2, fontSize: 13, lineHeight: 20 }}>
                        These are the standard terms. Each artist signs a copy at hire time.
                        <Text style={{ color: COLORS.text1 }}> Edits apply to new hires only.</Text>
                    </Text>
                </View>

                {/* Section: Payment structure */}
                <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
                    <SectionHeader title="Payment structure" />
                    <PaymentStructurePicker
                        value={edit.paymentStructure}
                        amount={compensationAmount}
                        onChange={edit.setPaymentStructure}
                    />
                </View>

                <Divider />

                {/* Section: Cancellation */}
                <View style={{ paddingHorizontal: 24, paddingTop: 28, marginBottom: 28 }}>
                    <SectionHeader title="Cancellation" />
                    <CancellationPicker
                        value={edit.cancellationPolicy}
                        onChange={edit.setCancellationPolicy}
                        forfeitPct={edit.cancellationForfeitPct}
                        onForfeitPctChange={edit.setCancellationForfeitPct}
                    />
                </View>

                <Divider />

                {/* Section: Custom clauses */}
                <View style={{ paddingHorizontal: 24, paddingTop: 28, marginBottom: 28 }}>
                    <SectionHeaderOptional title="Custom clauses" />
                    <CustomClausesEditor
                        clauses={edit.customClauses}
                        onChange={edit.setCustomClauses}
                    />
                </View>

                <Divider />

                {/* Section: Negotiable */}
                <View style={{ paddingHorizontal: 24, paddingTop: 28, marginBottom: 28 }}>
                    <SectionHeader title="Negotiation" />
                    <NegotiableToggle value={edit.negotiable} onChange={edit.setNegotiable} />
                </View>
            </ScrollView>

            {/* Sticky footer: Preview link */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, backgroundColor: COLORS.bg0, borderTopWidth: 1, borderTopColor: COLORS.line }}>
                <TouchableOpacity onPress={() => setPreviewOpen(true)} accessibilityLabel="Preview as artists see">
                    <Text style={{ color: COLORS.purple, fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                        Preview as artists see →
                    </Text>
                </TouchableOpacity>
            </View>

            <BookingTermsPreviewModal
                visible={previewOpen}
                paymentStructure={edit.paymentStructure}
                cancellationPolicy={edit.cancellationPolicy}
                cancellationForfeitPct={edit.cancellationForfeitPct}
                customClauses={edit.customClauses}
                amount={compensationAmount}
                negotiable={edit.negotiable}
                termsAndConditions={gig.termsAndConditions}
                onClose={() => setPreviewOpen(false)}
            />
        </View>
    );
}

function SectionHeader({ title }: { title: string }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: COLORS.text0, letterSpacing: -0.2 }}>{title}</Text>
            <Text style={{ fontSize: 9, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Required</Text>
        </View>
    );
}

function SectionHeaderOptional({ title }: { title: string }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: '#F3EFE8', letterSpacing: -0.2 }}>{title}</Text>
            <Text style={{ fontSize: 9, color: '#6B6878', fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Optional</Text>
        </View>
    );
}

function Divider() {
    return <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24 }} />;
}
