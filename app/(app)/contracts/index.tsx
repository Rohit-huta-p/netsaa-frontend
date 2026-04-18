import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, ChevronRight, Sparkles } from 'lucide-react-native';
import { useUserContracts, useCreateContract } from '@/hooks/usePayments';

const STATUS_COLORS: Record<string, string> = {
    draft: '#6B7280',
    sent: '#F97316',
    pending_artist_signature: '#F97316',
    pending_guardian_cosign: '#F59E0B',
    accepted: '#3B82F6',
    active: '#34D399',
    performed: '#8B5CF6',
    completed: '#34D399',
    declined: '#EF4444',
    disputed: '#EF4444',
    cancelled: '#6B7280',
    breached: '#EF4444',
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
                        {contract.terms?.location?.city}{contract.terms?.dates?.start ? ` · ${new Date(contract.terms.dates.start).toLocaleDateString()}` : ''}
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

// Dev-only hardcoded payload that exercises the Slice 2 + 3 surface
// (contract detail, payment method selector, switch flow).
// NOTE: the signed-in user becomes hirer; the artistId is a dummy ObjectId.
// To exercise the ARTIST sign ceremony, log in as the artist account —
// an in-app impersonate path will come in a later dev-tooling slice.
const SEED_CONTRACT_PAYLOAD = () => ({
    gigId: '000000000000000000000001',
    artistId: '000000000000000000000002',
    paymentMethod: 'on_platform' as const,
    terms: {
        gigTitle: 'Test contract (dev seed)',
        dates: { start: new Date(Date.now() + 7 * 86_400_000).toISOString() },
        location: { venue: 'Blue Note', city: 'Pune', state: 'Maharashtra' },
        scopeOfWork:
            '45-minute classical performance, 2 sets with a 10-minute interval. Sound + lights provided by venue.',
        amount: 15000,
        paymentStructure: 'full' as const,
    },
});

export default function ContractsListScreen() {
    const router = useRouter();
    const { data, isLoading } = useUserContracts();
    const createMutation = useCreateContract();
    const contracts = data?.data?.contracts || [];

    const handleSeed = () => {
        createMutation.mutate(SEED_CONTRACT_PAYLOAD(), {
            onSuccess: (res: any) => {
                const id = res?.data?._id;
                if (id) router.push(`/(app)/contracts/${id}` as any);
            },
            onError: (err: any) => {
                const msg = err?.response?.data?.message || err?.message || 'Seed failed';
                Alert.alert('Seed failed', msg);
            },
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>My Contracts</Text>

            {isLoading ? (
                <ActivityIndicator color="#F97316" style={{ marginTop: 40 }} />
            ) : contracts.length === 0 ? (
                <View style={styles.empty}>
                    <View style={styles.emptyIconWrap}>
                        <FileText size={40} color="#F97316" strokeWidth={1.2} />
                    </View>
                    <Text style={styles.emptyTitle}>No contracts yet</Text>
                    <Text style={styles.emptyDesc}>
                        When you book an artist or get booked for a gig, signed contracts appear here.
                    </Text>

                    {__DEV__ && (
                        <Pressable
                            onPress={handleSeed}
                            disabled={createMutation.isPending}
                            style={({ pressed }) => [pressed && { opacity: 0.9 }, { marginTop: 24 }]}
                        >
                            <LinearGradient
                                colors={['#EC4899', '#F97316']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.seedBtn}
                            >
                                {createMutation.isPending ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Sparkles size={16} color="#fff" />
                                        <Text style={styles.seedBtnText}>Create sample contract (dev)</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </Pressable>
                    )}
                    {__DEV__ && (
                        <Text style={styles.devNote}>
                            You&apos;ll be the hirer. To exercise the artist sign ceremony,
                            log in as the artist account.
                        </Text>
                    )}
                </View>
            ) : (
                <FlatList
                    data={contracts}
                    keyExtractor={(item: any) => item._id}
                    renderItem={({ item }) => (
                        <ContractCard
                            contract={item}
                            onPress={() => router.push(`/(app)/contracts/${item._id}` as any)}
                        />
                    )}
                    contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
                    ListFooterComponent={
                        __DEV__ ? (
                            <Pressable
                                onPress={handleSeed}
                                disabled={createMutation.isPending}
                                style={({ pressed }) => [pressed && { opacity: 0.9 }, { marginTop: 16 }]}
                            >
                                <View style={styles.seedBtnOutline}>
                                    {createMutation.isPending ? (
                                        <ActivityIndicator color="#F97316" />
                                    ) : (
                                        <>
                                            <Sparkles size={14} color="#F97316" />
                                            <Text style={styles.seedBtnOutlineText}>
                                                Seed another sample contract
                                            </Text>
                                        </>
                                    )}
                                </View>
                            </Pressable>
                        ) : null
                    }
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
        paddingHorizontal: 16,
    },
    emptyIconWrap: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(249,115,22,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(249,115,22,0.2)',
        marginBottom: 20,
    },
    emptyTitle: {
        fontFamily: 'Outfit-SemiBold',
        fontSize: 20,
        color: '#F0ECE6',
        marginBottom: 8,
    },
    emptyDesc: {
        fontFamily: 'Outfit-Regular',
        fontSize: 14,
        color: '#8F8B9E',
        textAlign: 'center',
        maxWidth: 300,
        lineHeight: 20,
    },
    seedBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 22,
        paddingVertical: 14,
        borderRadius: 12,
    },
    seedBtnText: {
        fontFamily: 'Outfit-Bold',
        fontSize: 14,
        color: '#fff',
    },
    seedBtnOutline: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(249,115,22,0.3)',
        backgroundColor: 'rgba(249,115,22,0.06)',
    },
    seedBtnOutlineText: {
        fontFamily: 'Outfit-SemiBold',
        fontSize: 13,
        color: '#F97316',
    },
    devNote: {
        fontFamily: 'Outfit-Regular',
        fontSize: 11,
        color: '#6B6878',
        textAlign: 'center',
        marginTop: 16,
        maxWidth: 280,
        lineHeight: 16,
        fontStyle: 'italic',
    },
});
