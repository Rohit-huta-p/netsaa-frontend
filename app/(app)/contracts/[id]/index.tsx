import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, XCircle, FileText, MapPin, Calendar, DollarSign, ShieldAlert, Zap, HandCoins, Pencil, X } from 'lucide-react-native';
import { useContract, useDeclineContract, useSwitchContractPaymentMethod } from '@/hooks/usePayments';
import useAuthStore from '@/stores/authStore';
import PaymentMethodSelector from '@/components/payments/PaymentMethodSelector';
import type { ContractPaymentMethod } from '@/services/paymentService';

export default function ContractDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const userId = useAuthStore((s) => s.user as any)?.id || useAuthStore((s) => s.user as any)?._id;
    const { data, isLoading } = useContract(id || '');
    const declineMutation = useDeclineContract();
    const switchMutation = useSwitchContractPaymentMethod();

    const [methodModalOpen, setMethodModalOpen] = useState(false);
    const [pendingMethod, setPendingMethod] = useState<ContractPaymentMethod>('on_platform');

    const contract = data?.data;

    if (isLoading) return <View style={styles.container}><ActivityIndicator color="#F97316" /></View>;
    if (!contract) return <View style={styles.container}><Text style={styles.errorText}>Contract not found</Text></View>;

    const isArtist = contract.artistId === userId;
    const isHirer = contract.hirerId === userId;
    const canSign = isArtist && contract.status === 'sent';
    const canPay = isHirer && contract.status === 'accepted';
    const awaitingGuardian = contract.status === 'pending_guardian_cosign';

    const currentMethod: ContractPaymentMethod = contract.paymentMethod ?? 'on_platform';
    const switchableStatuses = ['draft', 'sent', 'pending_artist_signature'];
    const methodEditable = isHirer && !contract.artistSignature && switchableStatuses.includes(contract.status);

    const openMethodModal = () => {
        setPendingMethod(currentMethod);
        setMethodModalOpen(true);
    };

    const confirmSwitchMethod = () => {
        if (pendingMethod === currentMethod) {
            setMethodModalOpen(false);
            return;
        }
        switchMutation.mutate(
            { id: contract._id, paymentMethod: pendingMethod },
            {
                onSuccess: () => setMethodModalOpen(false),
                onError: (err: any) => {
                    const msg = err?.response?.data?.message || 'Could not switch payment method';
                    Alert.alert('Error', msg);
                },
            }
        );
    };

    const handleSign = () => {
        // Full ceremony (scroll-to-bottom + double-confirm + audit capture) lives on
        // the dedicated sign page — an inline Alert does not satisfy PRD §9.3.
        router.push(`/(app)/contracts/${contract._id}/sign`);
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

            {/* Payment Method */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
                <View style={styles.methodCard}>
                    <View style={[
                        styles.methodIconCircle,
                        currentMethod === 'on_platform' ? { backgroundColor: 'rgba(249,115,22,0.15)' } : { backgroundColor: 'rgba(139,92,246,0.15)' },
                    ]}>
                        {currentMethod === 'on_platform' ? (
                            <Zap size={18} color="#F97316" />
                        ) : (
                            <HandCoins size={18} color="#8B5CF6" />
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.methodTitle}>
                            {currentMethod === 'on_platform' ? 'On-platform' : 'Off-platform'}
                        </Text>
                        <Text style={styles.methodSub}>
                            {currentMethod === 'on_platform'
                                ? 'Razorpay Route · instant split'
                                : 'Cash · UPI · bank · recorded later'}
                        </Text>
                    </View>
                    {methodEditable && (
                        <Pressable onPress={openMethodModal} style={styles.changeBtn}>
                            <Pencil size={12} color="#C4B8E3" />
                            <Text style={styles.changeBtnText}>Change</Text>
                        </Pressable>
                    )}
                </View>
                {!methodEditable && isHirer && contract.artistSignature && (
                    <Text style={styles.methodLockedNote}>
                        Payment method is locked after the artist signs.
                    </Text>
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

            {awaitingGuardian && (
                <View style={styles.guardianBanner}>
                    <ShieldAlert size={18} color="#F59E0B" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.guardianTitle}>Awaiting guardian co-signature</Text>
                        <Text style={styles.guardianSub}>
                            This contract is on hold until the artist&apos;s guardian confirms. You&apos;ll be notified when it&apos;s ready.
                        </Text>
                    </View>
                </View>
            )}

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

            <Modal
                visible={methodModalOpen}
                animationType="slide"
                transparent
                onRequestClose={() => setMethodModalOpen(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change payment method</Text>
                            <Pressable onPress={() => setMethodModalOpen(false)} hitSlop={12}>
                                <X size={20} color="#8F8B9E" />
                            </Pressable>
                        </View>
                        <Text style={styles.modalSub}>
                            You can switch until the artist signs. After that it&apos;s locked.
                        </Text>
                        <PaymentMethodSelector
                            value={pendingMethod}
                            onChange={setPendingMethod}
                            disabled={switchMutation.isPending}
                        />
                        <Pressable
                            onPress={confirmSwitchMethod}
                            disabled={switchMutation.isPending}
                            style={({ pressed }) => [pressed && { opacity: 0.9 }]}
                        >
                            <LinearGradient
                                colors={['#EC4899', '#F97316']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.primaryBtn, { marginTop: 16 }]}
                            >
                                {switchMutation.isPending ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.primaryBtnText}>
                                        {pendingMethod === currentMethod ? 'Close' : 'Confirm change'}
                                    </Text>
                                )}
                            </LinearGradient>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

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
    guardianBanner: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
        padding: 14,
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(245,158,11,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.25)',
    },
    guardianTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#F59E0B', marginBottom: 2 },
    guardianSub: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#D1B37A', lineHeight: 18 },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#121018',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    methodIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    methodTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#F0ECE6' },
    methodSub: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#8F8B9E', marginTop: 2 },
    changeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(196,184,227,0.2)',
    },
    changeBtnText: { fontFamily: 'Outfit-Medium', fontSize: 11, color: '#C4B8E3' },
    methodLockedNote: {
        fontFamily: 'Outfit-Regular',
        fontSize: 11,
        color: '#6B6878',
        marginTop: 8,
        fontStyle: 'italic',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: '#0E0C14',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 36,
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    modalTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 17, color: '#F0ECE6' },
    modalSub: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#8F8B9E', marginBottom: 16 },
});
