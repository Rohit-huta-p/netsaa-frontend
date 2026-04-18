import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, ChevronRight } from 'lucide-react-native';
import { useUserContracts } from '@/hooks/usePayments';
import TrustBadge from '@/components/ui/TrustBadge';

const STATUS_COLORS: Record<string, string> = {
    draft: '#6B7280',
    sent: '#F97316',
    accepted: '#3B82F6',
    active: '#34D399',
    performed: '#8B5CF6',
    completed: '#34D399',
    declined: '#EF4444',
    disputed: '#EF4444',
};

function ContractCard({ contract, onPress }: { contract: any; onPress: () => void }) {
    const statusColor = STATUS_COLORS[contract.status] || '#6B7280';

    return (
        <Pressable onPress={onPress} style={styles.card}>
            <View style={styles.cardHeader}>
                <FileText size={18} color="#F97316" strokeWidth={1.8} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{contract.terms?.gigTitle || 'Untitled Gig'}</Text>
                    <Text style={styles.cardMeta}>
                        {contract.terms?.location?.city} {contract.terms?.dates?.start ? `· ${new Date(contract.terms.dates.start).toLocaleDateString()}` : ''}
                    </Text>
                </View>
                <ChevronRight size={16} color="#6B6878" />
            </View>
            <View style={styles.cardFooter}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>{contract.status.toUpperCase()}</Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.amount}>Rs. {(contract.terms?.amount || 0).toLocaleString('en-IN')}</Text>
            </View>
        </Pressable>
    );
}

export default function ContractsListScreen() {
    const router = useRouter();
    const { data, isLoading } = useUserContracts();
    const contracts = data?.data?.contracts || [];

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>My Contracts</Text>

            {isLoading ? (
                <ActivityIndicator color="#F97316" style={{ marginTop: 40 }} />
            ) : contracts.length === 0 ? (
                <View style={styles.empty}>
                    <FileText size={48} color="#4A4656" strokeWidth={1} />
                    <Text style={styles.emptyTitle}>No contracts yet</Text>
                    <Text style={styles.emptyDesc}>When you book or get booked for a gig, contracts appear here.</Text>
                </View>
            ) : (
                <FlatList
                    data={contracts}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <ContractCard
                            contract={item}
                            onPress={() => router.push(`/(app)/contracts/${item._id}`)}
                        />
                    )}
                    contentContainerStyle={{ gap: 12 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A10',
        padding: 20,
    },
    heading: {
        fontFamily: 'Outfit-Bold',
        fontSize: 24,
        color: '#F0ECE6',
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#121018',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    cardTitle: {
        fontFamily: 'Outfit-SemiBold',
        fontSize: 16,
        color: '#F0ECE6',
    },
    cardMeta: {
        fontFamily: 'Outfit-Regular',
        fontSize: 12,
        color: '#6B6878',
        marginTop: 2,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontFamily: 'Outfit-SemiBold',
        fontSize: 10,
        letterSpacing: 1,
    },
    amount: {
        fontFamily: 'Outfit-Bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    emptyTitle: {
        fontFamily: 'Outfit-SemiBold',
        fontSize: 18,
        color: '#F0ECE6',
    },
    emptyDesc: {
        fontFamily: 'Outfit-Regular',
        fontSize: 14,
        color: '#6B6878',
        textAlign: 'center',
        maxWidth: 280,
    },
});
