/**
 * PaymentsStrip — hirer dashboard spend overview.
 *
 * Post Phase 3B-skeleton: wired to real off-platform transactions via
 * useUserTransactions. Shows total paid / pending count / recent records.
 * On-platform Razorpay rows will appear here automatically once Phase 3B-full
 * lands (same hook, same shape).
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import SectionCard from '../SectionCard';
import { useUserTransactions } from '@/hooks/usePayments';

const TONES: Record<string, string> = {
    recorded: '#F59E0B',
    confirmed: '#22C55E',
    completed: '#22C55E',
    disputed: '#EF4444',
    refunded: '#A1A1AA',
    expired: '#A1A1AA',
};

function readTransactionsArray(raw: any): any[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.transactions)) return raw.transactions;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.data?.transactions)) return raw.data.transactions;
    return [];
}

export default function PaymentsStrip() {
    const { data, isLoading } = useUserTransactions();
    const transactions = readTransactionsArray(data);

    if (isLoading) {
        return (
            <SectionCard title="Spend overview">
                <View style={styles.empty} accessibilityLabel="payments-loading">
                    <ActivityIndicator size="small" color="#FF6B35" />
                </View>
            </SectionCard>
        );
    }

    if (transactions.length === 0) {
        return (
            <SectionCard title="Spend overview">
                <View style={styles.empty} accessibilityLabel="payments-empty">
                    <Text style={styles.headline}>No payments yet</Text>
                    <Text style={styles.sub}>
                        Records appear here once you pay an artist on or off platform.
                    </Text>
                </View>
            </SectionCard>
        );
    }

    const totalPaid = transactions
        .filter((t) => ['confirmed', 'completed'].includes(String(t.status)))
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const pendingCount = transactions.filter((t) => String(t.status) === 'recorded').length;

    const recent = [...transactions]
        .sort((a, b) => {
            const aT = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bT = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bT - aT;
        })
        .slice(0, 3);

    return (
        <SectionCard title="Spend overview">
            <View style={styles.summary}>
                <View style={styles.summaryCell}>
                    <Text style={styles.summaryLabel}>Total paid</Text>
                    <Text style={styles.summaryValue}>₹{totalPaid.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.summaryCell}>
                    <Text style={styles.summaryLabel}>Pending</Text>
                    <Text style={[styles.summaryValue, pendingCount > 0 && { color: '#F59E0B' }]}>
                        {pendingCount}
                    </Text>
                </View>
                <View style={styles.summaryCell}>
                    <Text style={styles.summaryLabel}>Records</Text>
                    <Text style={styles.summaryValue}>{transactions.length}</Text>
                </View>
            </View>

            <View style={styles.recentList}>
                {recent.map((t, i) => {
                    const tone = TONES[String(t.status)] ?? '#A1A1AA';
                    return (
                        <View
                            key={t._id ?? i}
                            accessibilityLabel={`payment-recent-${i}`}
                            style={styles.recentRow}>
                            <View style={[styles.statusDot, { backgroundColor: tone }]} />
                            <Text style={styles.recentAmount}>
                                ₹{(Number(t.amount) || 0).toLocaleString('en-IN')}
                            </Text>
                            <Text style={styles.recentMethod} numberOfLines={1}>
                                {t.offlineDetails?.method ?? t.type ?? 'payment'}
                            </Text>
                            <Text style={styles.recentStatus}>{t.status}</Text>
                        </View>
                    );
                })}
            </View>
        </SectionCard>
    );
}

const styles = StyleSheet.create({
    empty: { paddingVertical: 16, alignItems: 'center' },
    headline: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#A1A1AA' },
    sub: {
        marginTop: 6,
        fontFamily: 'Outfit-Regular',
        fontSize: 13,
        color: '#71717A',
        textAlign: 'center',
    },
    summary: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 8,
    },
    summaryCell: { flex: 1 },
    summaryLabel: {
        color: '#71717A',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    summaryValue: {
        color: '#F0ECE6',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: -0.3,
    },
    recentList: {
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
        gap: 8,
    },
    recentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    recentAmount: { color: '#F0ECE6', fontSize: 13, fontWeight: '700', minWidth: 84 },
    recentMethod: { color: '#A1A1AA', fontSize: 12, flex: 1, textTransform: 'uppercase' },
    recentStatus: {
        color: '#71717A',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
});
