// netsa-mobile/src/features/payments/ConfirmPaymentModal.tsx
//
// Artist (payee) confirms or disputes an off-platform payment record
// the hirer created. Confirm flips the transaction to 'confirmed' on the
// backend; dispute opens a 'disputed' state with a reason. Both actions
// are atomic on the server side (state-machine guarded).

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
import { X, Check, AlertTriangle, Calendar, Hash } from 'lucide-react-native';
import { useConfirmOfflinePayment, useDisputeOfflinePayment } from '@/hooks/usePayments';

const METHOD_LABEL: Record<string, string> = {
    upi: 'UPI',
    google_pay: 'GPay',
    bank_transfer: 'Bank transfer',
    cash: 'Cash',
    credit_card: 'Credit card',
    debit_card: 'Debit card',
    other: 'Other',
};

export interface PaymentRecordSummary {
    _id: string;
    amount: number;
    offlineDetails?: {
        method?: string;
        referenceId?: string;
        note?: string;
        paidAt?: string;
        userReportedPaidAt?: string;
    };
    createdAt?: string;
    status?: string;
}

export interface ConfirmPaymentModalProps {
    visible: boolean;
    onClose: () => void;
    transaction: PaymentRecordSummary | null;
    /** Hirer's display name (the one who recorded the payment). */
    hirerName?: string;
    /** Fired after a successful confirm. */
    onConfirmed?: () => void;
    /** Fired after a successful dispute. */
    onDisputed?: () => void;
}

const formatINR = (n?: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

const formatDate = (iso?: string) => {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return '—';
    }
};

export function ConfirmPaymentModal({
    visible,
    onClose,
    transaction,
    hirerName,
    onConfirmed,
    onDisputed,
}: ConfirmPaymentModalProps) {
    const [showDisputeReason, setShowDisputeReason] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const confirmMutation = useConfirmOfflinePayment();
    const disputeMutation = useDisputeOfflinePayment();

    const isPending = confirmMutation.isPending || disputeMutation.isPending;

    const reset = () => {
        setShowDisputeReason(false);
        setDisputeReason('');
        setErrorMessage(null);
    };

    const handleClose = () => {
        if (isPending) return;
        reset();
        onClose();
    };

    const handleConfirm = async () => {
        if (!transaction) return;
        setErrorMessage(null);
        try {
            await confirmMutation.mutateAsync(transaction._id);
            try {
                Alert.alert('Confirmed', 'Payment marked as received.');
            } catch {
                /* noop in test */
            }
            reset();
            onClose();
            onConfirmed?.();
        } catch (err: any) {
            const msg =
                err?.response?.data?.meta?.message ||
                err?.message ||
                'Could not confirm payment.';
            setErrorMessage(msg);
        }
    };

    const handleSubmitDispute = async () => {
        if (!transaction) return;
        const reason = disputeReason.trim();
        if (reason.length < 1) {
            setErrorMessage('Tell us briefly what went wrong.');
            return;
        }
        setErrorMessage(null);
        try {
            await disputeMutation.mutateAsync({ id: transaction._id, reason });
            try {
                Alert.alert('Dispute opened', 'NETSA support will review this within 48 hours.');
            } catch {
                /* noop in test */
            }
            reset();
            onClose();
            onDisputed?.();
        } catch (err: any) {
            const msg =
                err?.response?.data?.meta?.message ||
                err?.message ||
                'Could not open dispute.';
            setErrorMessage(msg);
        }
    };

    if (!transaction) return null;
    const offline = transaction.offlineDetails ?? {};
    const methodLabel = offline.method ? METHOD_LABEL[offline.method] ?? offline.method : '—';
    const reportedDate = offline.userReportedPaidAt ?? offline.paidAt;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <View style={styles.backdrop}>
                <View style={styles.sheet}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerIconWrap}>
                            <Check size={18} color="#22C55E" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.eyebrow}>Payment recorded</Text>
                            <Text style={styles.title}>
                                {hirerName ? `${hirerName} says they paid you` : 'Hirer recorded a payment'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleClose}
                            disabled={isPending}
                            accessibilityLabel="close-confirm-payment"
                            style={styles.closeBtn}
                        >
                            <X size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                        {/* Amount */}
                        <View style={styles.amountCard}>
                            <Text style={styles.amountLabel}>Amount paid</Text>
                            <Text style={styles.amountValue} accessibilityLabel="confirm-amount">
                                {formatINR(transaction.amount)}
                            </Text>
                        </View>

                        {/* Method + reference + dates */}
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Method</Text>
                            <Text style={styles.detailValue}>{methodLabel}</Text>
                        </View>
                        {offline.referenceId ? (
                            <View style={styles.detailRow}>
                                <View style={styles.detailLabelRow}>
                                    <Hash size={11} color="#71717A" />
                                    <Text style={styles.detailLabel}>Reference</Text>
                                </View>
                                <Text style={styles.detailValue} numberOfLines={1}>
                                    {offline.referenceId}
                                </Text>
                            </View>
                        ) : null}
                        <View style={styles.detailRow}>
                            <View style={styles.detailLabelRow}>
                                <Calendar size={11} color="#71717A" />
                                <Text style={styles.detailLabel}>Paid on</Text>
                            </View>
                            <Text style={styles.detailValue}>{formatDate(reportedDate)}</Text>
                        </View>
                        {offline.note ? (
                            <View style={styles.noteCard}>
                                <Text style={styles.noteLabel}>Note from hirer</Text>
                                <Text style={styles.noteText}>{offline.note}</Text>
                            </View>
                        ) : null}

                        {/* Dispute reason input (when expanded) */}
                        {showDisputeReason && (
                            <View style={{ marginTop: 16 }}>
                                <Text style={styles.fieldLabel}>What's wrong?</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={disputeReason}
                                    onChangeText={setDisputeReason}
                                    placeholder="e.g. Wrong amount, didn't receive yet"
                                    placeholderTextColor="#52525B"
                                    multiline
                                    maxLength={500}
                                    accessibilityLabel="dispute-reason"
                                />
                            </View>
                        )}

                        {/* Error chip */}
                        {errorMessage && (
                            <View style={styles.errorChip}>
                                <AlertTriangle size={14} color="#EF4444" />
                                <Text style={styles.errorText}>{errorMessage}</Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    {!showDisputeReason ? (
                        <View style={styles.footer}>
                            <TouchableOpacity
                                onPress={() => setShowDisputeReason(true)}
                                disabled={isPending}
                                style={styles.disputeBtn}
                                accessibilityLabel="open-dispute"
                            >
                                <Text style={styles.disputeTxt}>Dispute</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={isPending ? undefined : handleConfirm}
                                disabled={isPending}
                                style={[styles.confirmBtn, isPending && styles.confirmBtnDisabled]}
                                accessibilityLabel="confirm-payment-received"
                            >
                                <Text style={styles.confirmTxt}>
                                    {confirmMutation.isPending ? 'Confirming…' : 'Confirm received'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.footer}>
                            <TouchableOpacity
                                onPress={() => setShowDisputeReason(false)}
                                disabled={isPending}
                                style={styles.cancelBtn}
                                accessibilityLabel="cancel-dispute"
                            >
                                <Text style={styles.cancelTxt}>Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={isPending ? undefined : handleSubmitDispute}
                                disabled={isPending}
                                style={[styles.disputeSubmitBtn, isPending && styles.confirmBtnDisabled]}
                                accessibilityLabel="submit-dispute"
                            >
                                <Text style={styles.confirmTxt}>
                                    {disputeMutation.isPending ? 'Opening…' : 'Submit dispute'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

export default ConfirmPaymentModal;

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
        maxHeight: '90%',
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
        backgroundColor: 'rgba(34,197,94,0.10)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    eyebrow: {
        color: '#22C55E',
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
    amountCard: {
        backgroundColor: 'rgba(34,197,94,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(34,197,94,0.20)',
        borderRadius: 18,
        padding: 16,
        alignItems: 'center',
    },
    amountLabel: {
        color: '#71717A',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    amountValue: {
        color: '#22C55E',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: -0.5,
        marginTop: 4,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    detailLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailLabel: {
        color: '#71717A',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    detailValue: {
        color: '#E4E4E7',
        fontSize: 13,
        fontWeight: '600',
        flexShrink: 1,
        marginLeft: 12,
    },
    noteCard: {
        marginTop: 14,
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    noteLabel: {
        color: '#71717A',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    noteText: { color: '#D6D3D1', fontSize: 13, lineHeight: 19 },
    fieldLabel: {
        color: '#A1A1AA',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    textInput: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: 12,
        color: '#fff',
        fontSize: 14,
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
    disputeBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: 'rgba(239,68,68,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disputeTxt: {
        color: '#FCA5A5',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    disputeSubmitBtn: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtn: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#22C55E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtnDisabled: { opacity: 0.5 },
    confirmTxt: {
        color: '#000',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
});
