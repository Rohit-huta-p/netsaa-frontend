import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { ArrowUpRight, ArrowDownLeft, Smartphone } from 'lucide-react-native';
import { useUserTransactions } from '@/hooks/usePayments';
import useAuthStore from '@/stores/authStore';

const STATUS_COLORS: Record<string, string> = {
    created: '#6B7280', paid: '#3B82F6', confirmed: '#34D399',
    completed: '#34D399', disputed: '#EF4444', refunded: '#6B7280', failed: '#EF4444',
};

function TransactionItem({ tx, userId }: { tx: any; userId: string }) {
    const isSender = tx.fromUserId === userId;
    const statusColor = STATUS_COLORS[tx.status] || '#6B7280';
    const isOffline = tx.type === 'offline_record';

    return (
        <View style={styles.txCard}>
            <View style={[styles.txIcon, { backgroundColor: isSender ? 'rgba(249,115,22,0.1)' : 'rgba(52,211,153,0.1)' }]}>
                {isOffline ? (
                    <Smartphone size={16} color="#F59E0B" />
                ) : isSender ? (
                    <ArrowUpRight size={16} color="#F97316" />
                ) : (
                    <ArrowDownLeft size={16} color="#34D399" />
                )}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.txTitle}>{isSender ? 'Payment sent' : 'Payment received'}</Text>
                <Text style={styles.txMeta}>
                    {tx.type.replace('_', ' ')} · {new Date(tx.createdAt).toLocaleDateString()}
                </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.txAmount, { color: isSender ? '#F0ECE6' : '#34D399' }]}>
                    {isSender ? '-' : '+'}Rs. {tx.amount.toLocaleString('en-IN')}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.txStatus, { color: statusColor }]}>{tx.status}</Text>
                </View>
            </View>
        </View>
    );
}

export default function PaymentHistoryScreen() {
    const userId = (useAuthStore((s) => s.user) as any)?.id || (useAuthStore((s) => s.user) as any)?._id;
    const { data, isLoading } = useUserTransactions();
    const transactions = data?.data?.transactions || [];

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Payment History</Text>

            {isLoading ? (
                <ActivityIndicator color="#F97316" style={{ marginTop: 40 }} />
            ) : transactions.length === 0 ? (
                <View style={styles.empty}>
                    <ArrowDownLeft size={48} color="#4A4656" strokeWidth={1} />
                    <Text style={styles.emptyTitle}>No payments yet</Text>
                    <Text style={styles.emptyDesc}>Your payment history will appear here after your first booking.</Text>
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => <TransactionItem tx={item} userId={userId} />}
                    contentContainerStyle={{ gap: 8 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A10', padding: 20 },
    heading: { fontFamily: 'Outfit-Bold', fontSize: 24, color: '#F0ECE6', marginBottom: 20 },
    txCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#121018', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    txTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#F0ECE6' },
    txMeta: { fontFamily: 'Outfit-Regular', fontSize: 11, color: '#6B6878', marginTop: 2 },
    txAmount: { fontFamily: 'Outfit-Bold', fontSize: 16 },
    statusDot: { width: 5, height: 5, borderRadius: 3 },
    txStatus: { fontFamily: 'Outfit-Medium', fontSize: 10, textTransform: 'capitalize' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 18, color: '#F0ECE6' },
    emptyDesc: { fontFamily: 'Outfit-Regular', fontSize: 14, color: '#6B6878', textAlign: 'center', maxWidth: 280 },
});
