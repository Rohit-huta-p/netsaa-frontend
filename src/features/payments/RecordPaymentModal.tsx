// netsa-mobile/src/features/payments/RecordPaymentModal.tsx
//
// Hirer records an off-platform payment they made to an artist. Backend
// idempotency-keys the row by canonicalized payload so double-taps don't
// duplicate; rate-limited to 3 records per week per hirer; writes a
// `recorded` Transaction with payment details + audit timeline.
//
// The artist sees a matching ConfirmPaymentModal on their side once the
// row exists.

import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { X, Wallet, AlertTriangle } from 'lucide-react-native';
import { useRecordOfflinePayment } from '@/hooks/usePayments';

type PaymentMethodKey = 'upi' | 'bank_transfer' | 'cash' | 'google_pay' | 'credit_card' | 'debit_card' | 'other';

const METHOD_OPTIONS: Array<{ key: PaymentMethodKey; label: string }> = [
    { key: 'upi', label: 'UPI' },
    { key: 'google_pay', label: 'GPay' },
    { key: 'bank_transfer', label: 'Bank' },
    { key: 'cash', label: 'Cash' },
    { key: 'credit_card', label: 'Credit card' },
    { key: 'debit_card', label: 'Debit card' },
    { key: 'other', label: 'Other' },
];

export interface RecordPaymentModalProps {
    visible: boolean;
    onClose: () => void;
    /** Application this payment settles. Required. */
    applicationId: string;
    /** Payee — the artist receiving the money. Required. */
    artistId: string;
    /** Default amount to prefill (typically the agreed hire amount). */
    defaultAmount?: number;
    /** Optional gig ref for backend join + display. */
    gigId?: string;
    /** Optional artist display name for the modal header. */
    artistName?: string;
    /** Fired after the record is created. */
    onRecorded?: () => void;
}

export function RecordPaymentModal({
    visible,
    onClose,
    applicationId,
    artistId,
    defaultAmount = 0,
    gigId,
    artistName,
    onRecorded,
}: RecordPaymentModalProps) {
    const [amountText, setAmountText] = useState(String(defaultAmount || ''));
    const [method, setMethod] = useState<PaymentMethodKey>('upi');
    const [referenceId, setReferenceId] = useState('');
    const [note, setNote] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const recordMutation = useRecordOfflinePayment();

    const reset = () => {
        setAmountText(String(defaultAmount || ''));
        setMethod('upi');
        setReferenceId('');
        setNote('');
        setErrorMessage(null);
    };

    const handleClose = () => {
        if (recordMutation.isPending) return;
        reset();
        onClose();
    };

    const handleRecord = async () => {
        const amount = Number(amountText);
        if (!Number.isFinite(amount) || amount <= 0) {
            setErrorMessage('Enter a valid amount.');
            return;
        }
        setErrorMessage(null);

        try {
            await recordMutation.mutateAsync({
                applicationId,
                gigId,
                toUserId: artistId,
                amount,
                method,
                referenceId: referenceId.trim() || undefined,
                note: note.trim() || undefined,
            });
            try {
                Alert.alert(
                    'Payment recorded',
                    artistName
                        ? `${artistName} will be asked to confirm receipt.`
                        : 'The artist will be asked to confirm receipt.'
                );
            } catch {
                /* noop in test */
            }
            reset();
            onClose();
            onRecorded?.();
        } catch (err: any) {
            const status = err?.response?.status;
            const msg =
                err?.response?.data?.meta?.message ||
                err?.message ||
                'Could not record payment.';
            if (status === 429) {
                setErrorMessage('Limit reached: 3 offline records per week.');
            } else {
                setErrorMessage(msg);
            }
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <View style={styles.backdrop}>
                <View style={styles.sheet}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerIconWrap}>
                            <Wallet size={18} color="#FF6B35" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.eyebrow}>Record payment</Text>
                            <Text style={styles.title}>
                                {artistName ? `Paid ${artistName}` : 'Record off-platform payment'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleClose}
                            disabled={recordMutation.isPending}
                            accessibilityLabel="close-record-payment"
                            style={styles.closeBtn}
                        >
                            <X size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                        {/* Amount */}
                        <Text style={styles.fieldLabel}>Amount</Text>
                        <View style={styles.amountWrap}>
                            <Text style={styles.amountPrefix}>₹</Text>
                            <TextInput
                                style={styles.amountInput}
                                value={amountText}
                                onChangeText={setAmountText}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor="#52525B"
                                accessibilityLabel="payment-amount"
                            />
                        </View>

                        {/* Method picker */}
                        <Text style={styles.fieldLabel}>Method</Text>
                        <View style={styles.methodRow}>
                            {METHOD_OPTIONS.map((opt) => {
                                const selected = method === opt.key;
                                return (
                                    <TouchableOpacity
                                        key={opt.key}
                                        onPress={() => setMethod(opt.key)}
                                        accessibilityRole="button"
                                        accessibilityLabel={`payment-method-${opt.key}`}
                                        accessibilityState={{ selected }}
                                        style={[styles.methodChip, selected && styles.methodChipSelected]}
                                    >
                                        <Text style={[styles.methodLabel, selected && styles.methodLabelSelected]}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Reference ID */}
                        <Text style={styles.fieldLabel}>Reference</Text>
                        <Text style={styles.fieldHint}>UPI ref / bank txn / "cash" — used for matching later.</Text>
                        <TextInput
                            style={styles.textInput}
                            value={referenceId}
                            onChangeText={setReferenceId}
                            placeholder="e.g. UPI/123456789"
                            placeholderTextColor="#52525B"
                            accessibilityLabel="payment-reference"
                        />

                        {/* Note */}
                        <Text style={styles.fieldLabel}>Note (optional)</Text>
                        <TextInput
                            style={[styles.textInput, styles.noteInput]}
                            value={note}
                            onChangeText={setNote}
                            placeholder="Anything the artist should know"
                            placeholderTextColor="#52525B"
                            multiline
                            maxLength={500}
                            accessibilityLabel="payment-note"
                        />

                        {/* Error chip */}
                        {errorMessage && (
                            <View style={styles.errorChip}>
                                <AlertTriangle size={14} color="#EF4444" />
                                <Text style={styles.errorText}>{errorMessage}</Text>
                            </View>
                        )}

                        {/* Disclaimer */}
                        <View style={styles.disclaimerCard}>
                            <Text style={styles.disclaimerText}>
                                NETSA didn't process this payment. The artist will confirm or
                                dispute the record. Off-platform records have weaker trust
                                weighting than on-platform payments.
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            onPress={handleClose}
                            disabled={recordMutation.isPending}
                            style={styles.cancelBtn}
                            accessibilityLabel="cancel-record-payment"
                        >
                            <Text style={styles.cancelTxt}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={recordMutation.isPending ? undefined : handleRecord}
                            disabled={recordMutation.isPending}
                            accessibilityLabel="submit-record-payment"
                            style={[styles.submitBtn, recordMutation.isPending && styles.submitBtnDisabled]}
                        >
                            <Text style={styles.submitTxt}>
                                {recordMutation.isPending ? 'Recording…' : 'Record payment'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export default RecordPaymentModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#0A0A0E',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '92%',
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,107,53,0.10)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    eyebrow: {
        color: '#FF6B35',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: -0.3,
        marginTop: 2,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
    fieldLabel: {
        color: '#A1A1AA',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginTop: 14,
        marginBottom: 6,
    },
    fieldHint: {
        color: '#71717A',
        fontSize: 11,
        marginBottom: 6,
    },
    amountWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    amountPrefix: {
        color: '#FF6B35',
        fontSize: 22,
        fontWeight: '900',
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        color: '#fff',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    methodRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    methodChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    methodChipSelected: {
        backgroundColor: 'rgba(255,107,53,0.10)',
        borderColor: 'rgba(255,107,53,0.40)',
    },
    methodLabel: {
        color: '#A1A1AA',
        fontSize: 12,
        fontWeight: '700',
    },
    methodLabelSelected: {
        color: '#FF6B35',
    },
    textInput: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: 12,
        color: '#fff',
        fontSize: 14,
    },
    noteInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    errorChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 14,
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(239,68,68,0.10)',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.25)',
    },
    errorText: { color: '#FCA5A5', fontSize: 12, flex: 1 },
    disclaimerCard: {
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(245,158,11,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.20)',
    },
    disclaimerText: {
        color: '#D6D3D1',
        fontSize: 12,
        lineHeight: 18,
    },
    footer: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelTxt: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    submitBtn: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#FF6B35',
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnDisabled: { backgroundColor: 'rgba(255,107,53,0.4)' },
    submitTxt: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
});
