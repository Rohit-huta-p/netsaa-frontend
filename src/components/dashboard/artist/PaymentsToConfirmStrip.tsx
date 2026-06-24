/**
 * PaymentsToConfirmStrip — artist dashboard widget.
 *
 * Lists offline-recorded transactions where the artist is the payee and
 * the row is in 'recorded' state — i.e. waiting for the artist to confirm
 * receipt. Tapping a row opens ConfirmPaymentModal which fires the confirm
 * (or dispute) backend action.
 *
 * Returns null when there are no pending confirmations so the dashboard
 * stays tight on quiet days.
 */
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SectionCard from '../SectionCard';
import { useUserTransactions } from '@/hooks/usePayments';
import { ConfirmPaymentModal, type PaymentRecordSummary } from '@/features/payments/ConfirmPaymentModal';
import { useAuthStore } from '@/stores/authStore';

function readTransactionsArray(raw: any): any[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.transactions)) return raw.transactions;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.data?.transactions)) return raw.data.transactions;
    return [];
}

export default function PaymentsToConfirmStrip() {
    const currentUserId = useAuthStore((s: any) => s.user?._id);
    const { data, isLoading } = useUserTransactions({ status: 'recorded' });
    const [target, setTarget] = useState<PaymentRecordSummary | null>(null);

    if (isLoading) {
        return (
            <SectionCard title="Payments to confirm">
                <View style={styles.empty} accessibilityLabel="payments-to-confirm-loading">
                    <ActivityIndicator size="small" color="#FF6B35" />
                </View>
            </SectionCard>
        );
    }

    const all = readTransactionsArray(data);
    // Belt-and-braces filter: only rows where the artist is the payee and
    // the status is 'recorded' (waiting on us). Server filter does most of
    // the work; this drops cross-user noise if any leaks through.
    const pending = all.filter(
        (t) =>
            String(t.status) === 'recorded' &&
            (!currentUserId || String(t.toUserId) === String(currentUserId))
    );

    if (pending.length === 0) {
        // Don't render an empty card — keep the dashboard tight when nothing's pending.
        return null;
    }

    return (
        <>
            <SectionCard title="Payments to confirm">
                <View style={styles.list}>
                    {pending.map((t, i) => (
                        <TouchableOpacity
                            key={t._id ?? i}
                            onPress={() => setTarget(t as PaymentRecordSummary)}
                            accessibilityLabel={`payment-to-confirm-${i}`}
                            style={styles.row}>
                            <View style={styles.dot} />
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={styles.rowAmount}>
                                    ₹{(Number(t.amount) || 0).toLocaleString('en-IN')}
                                </Text>
                                <Text style={styles.rowMeta} numberOfLines={1}>
                                    {(t.offlineDetails?.method ?? 'payment').toString().toUpperCase()}
                                    {t.offlineDetails?.referenceId ? ` · ${t.offlineDetails.referenceId}` : ''}
                                </Text>
                            </View>
                            <Text style={styles.rowAction}>Review</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </SectionCard>

            <ConfirmPaymentModal
                visible={!!target}
                onClose={() => setTarget(null)}
                transaction={target}
                onConfirmed={() => setTarget(null)}
                onDisputed={() => setTarget(null)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    empty: { paddingVertical: 16, alignItems: 'center' },
    list: { paddingTop: 4, gap: 10 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 4,
    },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' },
    rowAmount: { color: '#F0ECE6', fontSize: 14, fontWeight: '700' },
    rowMeta: { color: '#A1A1AA', fontSize: 11, marginTop: 3 },
    rowAction: {
        color: '#FF6B35',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});
