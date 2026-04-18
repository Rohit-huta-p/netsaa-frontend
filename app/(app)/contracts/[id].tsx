import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, XCircle, FileText, MapPin, Calendar, DollarSign } from 'lucide-react-native';
import { useContract, useSignContract, useDeclineContract } from '@/hooks/usePayments';
import useAuthStore from '@/stores/authStore';
import TrustBadge from '@/components/ui/TrustBadge';

export default function ContractDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const userId = useAuthStore((s) => s.user as any)?.id || useAuthStore((s) => s.user as any)?._id;
    const { data, isLoading } = useContract(id || '');
    const signMutation = useSignContract();
    const declineMutation = useDeclineContract();

    const contract = data?.data;

    if (isLoading) return <View style={styles.container}><ActivityIndicator color="#F97316" /></View>;
    if (!contract) return <View style={styles.container}><Text style={styles.errorText}>Contract not found</Text></View>;

    const isArtist = contract.artistId === userId;
    const isHirer = contract.hirerId === userId;
    const canSign = isArtist && contract.status === 'sent';
    const canPay = isHirer && contract.status === 'accepted';

    const handleSign = () => {
        Alert.alert(
            'Sign Contract',
            `Confirm booking for "${contract.terms.gigTitle}" at Rs. ${contract.terms.amount.toLocaleString('en-IN')}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign & Accept',
                    onPress: () => signMutation.mutate({ id: contract._id }),
                },
            ]
        );
    };

    const handleDecline = () => {
        Alert.alert('Decline Contract', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Decline',
                style: 'destructive',
                onPress: () => {
                    declineMutation.mutate(contract._id);
                    router.back();
                },
            },
        ]);
    };

    const handlePay = () => {
        router.push(`/(app)/payments/checkout?contractId=${contract._id}`);
    };

    const tierLabel = contract.tier === 'quick' ? 'Quick (<Rs.10K)' : contract.tier === 'standard' ? 'Standard' : 'Premium';

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Status bar */}
            <View style={[styles.statusBar, { backgroundColor: STATUS_COLORS[contract.status] + '15' }]}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[contract.status] }]} />
                <Text style={[styles.statusLabel, { color: STATUS_COLORS[contract.status] }]}>
                    {contract.status.toUpperCase()}
                </Text>
                <Text style={styles.tierLabel}>{tierLabel}</Text>
            </View>

            {/* Terms */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>CONTRACT TERMS</Text>

                <View style={styles.termRow}>
                    <FileText size={16} color="#6B6878" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.termLabel}>Gig</Text>
                        <Text style={styles.termValue}>{contract.terms.gigTitle}</Text>
                    </View>
                </View>

                <View style={styles.termRow}>
                    <Calendar size={16} color="#6B6878" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.termLabel}>Date</Text>
                        <Text style={styles.termValue}>
                            {new Date(contract.terms.dates.start).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </Text>
                    </View>
                </View>

                <View style={styles.termRow}>
                    <MapPin size={16} color="#6B6878" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.termLabel}>Location</Text>
                        <Text style={styles.termValue}>
                            {contract.terms.location.venue ? `${contract.terms.location.venue}, ` : ''}{contract.terms.location.city}
                        </Text>
                    </View>
                </View>

                <View style={styles.termRow}>
                    <DollarSign size={16} color="#6B6878" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.termLabel}>Compensation</Text>
                        <Text style={styles.amountValue}>Rs. {contract.terms.amount.toLocaleString('en-IN')}</Text>
                        <Text style={styles.feeNote}>
                            Artist receives: Rs. {contract.terms.artistReceives.toLocaleString('en-IN')} (platform fee: {(contract.terms.platformFeeRate * 100).toFixed(0)}%)
                        </Text>
                    </View>
                </View>

                {contract.terms.scopeOfWork && (
                    <View style={styles.scopeBox}>
                        <Text style={styles.termLabel}>Scope of Work</Text>
                        <Text style={styles.scopeText}>{contract.terms.scopeOfWork}</Text>
                    </View>
                )}
            </View>

            {/* Signatures */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>SIGNATURES</Text>
                <View style={styles.sigRow}>
                    <Text style={styles.sigParty}>Hirer</Text>
                    {contract.hirerSignature ? (
                        <View style={styles.sigDone}>
                            <CheckCircle size={14} color="#34D399" />
                            <Text style={styles.sigDate}>Signed {new Date(contract.hirerSignature.signedAt).toLocaleDateString()}</Text>
                        </View>
                    ) : (
                        <Text style={styles.sigPending}>Pending</Text>
                    )}
                </View>
                <View style={styles.sigRow}>
                    <Text style={styles.sigParty}>Artist</Text>
                    {contract.artistSignature ? (
                        <View style={styles.sigDone}>
                            <CheckCircle size={14} color="#34D399" />
                            <Text style={styles.sigDate}>Signed {new Date(contract.artistSignature.signedAt).toLocaleDateString()}</Text>
                        </View>
                    ) : (
                        <Text style={styles.sigPending}>Pending</Text>
                    )}
                </View>
            </View>

            {/* Actions */}
            {canSign && (
                <View style={styles.actions}>
                    <Pressable onPress={handleSign} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
                        <LinearGradient colors={['#EC4899', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                            <CheckCircle size={18} color="#fff" />
                            <Text style={styles.primaryBtnText}>Sign & Accept</Text>
                        </LinearGradient>
                    </Pressable>
                    <Pressable onPress={handleDecline} style={styles.dangerBtn}>
                        <XCircle size={18} color="#EF4444" />
                        <Text style={styles.dangerBtnText}>Decline</Text>
                    </Pressable>
                </View>
            )}

            {canPay && (
                <View style={styles.actions}>
                    <Pressable onPress={handlePay} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
                        <LinearGradient colors={['#EC4899', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                            <DollarSign size={18} color="#fff" />
                            <Text style={styles.primaryBtnText}>Pay Now</Text>
                        </LinearGradient>
                    </Pressable>
                </View>
            )}
        </ScrollView>
    );
}

const STATUS_COLORS: Record<string, string> = {
    draft: '#6B7280', sent: '#F97316', accepted: '#3B82F6', active: '#34D399',
    performed: '#8B5CF6', completed: '#34D399', declined: '#EF4444', disputed: '#EF4444',
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A10', padding: 20 },
    errorText: { fontFamily: 'Outfit-Regular', fontSize: 16, color: '#EF4444', textAlign: 'center', marginTop: 40 },
    statusBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 24 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusLabel: { fontFamily: 'Outfit-Bold', fontSize: 12, letterSpacing: 1 },
    tierLabel: { fontFamily: 'Outfit-Regular', fontSize: 11, color: '#6B6878', marginLeft: 'auto' },
    section: { marginBottom: 24 },
    sectionLabel: { fontFamily: 'Outfit-SemiBold', fontSize: 10, letterSpacing: 3, color: '#6B6878', marginBottom: 16 },
    termRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
    termLabel: { fontFamily: 'Outfit-Regular', fontSize: 11, color: '#6B6878', marginBottom: 2 },
    termValue: { fontFamily: 'Outfit-Medium', fontSize: 15, color: '#F0ECE6' },
    amountValue: { fontFamily: 'Outfit-Bold', fontSize: 22, color: '#FFFFFF' },
    feeNote: { fontFamily: 'Outfit-Regular', fontSize: 11, color: '#6B6878', marginTop: 2 },
    scopeBox: { marginTop: 16, padding: 16, backgroundColor: '#121018', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    scopeText: { fontFamily: 'Outfit-Regular', fontSize: 14, color: '#F0ECE6', lineHeight: 22, marginTop: 4 },
    sigRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
    sigParty: { fontFamily: 'Outfit-Medium', fontSize: 14, color: '#F0ECE6' },
    sigDone: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    sigDate: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#34D399' },
    sigPending: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#6B6878' },
    actions: { gap: 12, marginTop: 8 },
    primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12 },
    primaryBtnText: { fontFamily: 'Outfit-Bold', fontSize: 16, color: '#fff' },
    dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.3)' },
    dangerBtnText: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#EF4444' },
});
