import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    Modal,
    Platform,
    Alert,
    NativeScrollEvent,
    NativeSyntheticEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ArrowLeft,
    CheckCircle,
    ChevronDown,
    FileText,
    Calendar,
    MapPin,
    ShieldAlert,
    Wallet,
} from 'lucide-react-native';
import { useContract, useSignContract } from '@/hooks/usePayments';
import useAuthStore from '@/stores/authStore';

/**
 * Contract ceremony sign page (PRD v4 §9.3).
 *
 * UX contract:
 *   1. Artist must scroll the terms panel to the bottom before the primary CTA
 *      activates — captured as `scrollEndedAt`.
 *   2. Primary CTA opens a double-confirm modal; final confirm captures
 *      `doubleConfirmedAt` and submits.
 *   3. Ceremony timestamps are forwarded to the backend as part of the artist
 *      signature audit trail.
 *   4. If the signer is a minor, the backend transitions the contract to
 *      `pending_guardian_cosign` instead of `accepted`; this page renders the
 *      guardian-wait confirmation afterwards.
 *   5. Tamper detection: if the backend returns a 409 "tampered" error, we show
 *      an explicit warning instead of allowing retry.
 */

const SCROLL_BOTTOM_EPS = 24; // pixels from bottom that count as "reached end"

export default function ContractSignScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const userId = useAuthStore((s) => s.user as any)?.id || useAuthStore((s) => s.user as any)?._id;

    const { data, isLoading } = useContract(id || '');
    const signMutation = useSignContract();

    const [scrollEndedAt, setScrollEndedAt] = useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingGuardian, setPendingGuardian] = useState(false);
    const scrollRef = useRef<ScrollView>(null);

    const contract = data?.data;

    const onTermsScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (scrollEndedAt) return;
        const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
        const atBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - SCROLL_BOTTOM_EPS;
        if (atBottom) {
            setScrollEndedAt(new Date().toISOString());
        }
    }, [scrollEndedAt]);

    const paymentMethodLabel = useMemo(() => {
        if (!contract) return '';
        return contract.paymentMethod === 'off_platform'
            ? 'Off-platform (recorded payment — weaker trust signal)'
            : 'On-platform (Razorpay instant split)';
    }, [contract]);

    const tierLabel = useMemo(() => {
        if (!contract) return '';
        if (contract.tier === 'quick') return 'Quick (<Rs.10K)';
        if (contract.tier === 'standard') return 'Standard';
        return 'Premium';
    }, [contract]);

    if (isLoading || !contract) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color="#F97316" />
            </View>
        );
    }

    const isArtist = contract.artistId === userId;
    const canSign = isArtist && contract.status === 'sent';

    // Anyone who reaches this page who isn't the artist-for-signable-status is
    // kicked back to the detail page. No silent side-effects — visible bounce.
    if (!canSign) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorTitle}>This contract isn&apos;t awaiting your signature.</Text>
                <Pressable onPress={() => router.replace(`/(app)/contracts/${contract._id}`)} style={styles.backBtn}>
                    <ArrowLeft size={16} color="#F0ECE6" />
                    <Text style={styles.backBtnText}>Back to contract</Text>
                </Pressable>
            </View>
        );
    }

    if (pendingGuardian) {
        return (
            <View style={styles.centered}>
                <View style={styles.guardianCard}>
                    <ShieldAlert size={28} color="#F59E0B" />
                    <Text style={styles.guardianHeading}>Guardian co-signature needed</Text>
                    <Text style={styles.guardianBody}>
                        You&apos;re under 18, so under the Indian Contract Act your guardian must
                        co-sign this booking. We&apos;ve queued the request — you&apos;ll get a
                        notification the moment it&apos;s confirmed.
                    </Text>
                    <Pressable
                        onPress={() => router.replace(`/(app)/contracts/${contract._id}`)}
                        style={({ pressed }) => [pressed && { opacity: 0.9 }]}
                    >
                        <LinearGradient
                            colors={['#EC4899', '#F97316']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.primaryBtn}
                        >
                            <Text style={styles.primaryBtnText}>View contract</Text>
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>
        );
    }

    const submit = () => {
        const doubleConfirmedAt = new Date().toISOString();
        signMutation.mutate(
            {
                id: contract._id,
                data: {
                    scrollEndedAt: scrollEndedAt ?? undefined,
                    doubleConfirmedAt,
                    deviceInfo: Platform.OS + ' / ' + Platform.Version,
                },
            },
            {
                onSuccess: (result: any) => {
                    setConfirmOpen(false);
                    const next = result?.data?.status;
                    if (next === 'pending_guardian_cosign') {
                        setPendingGuardian(true);
                    } else {
                        router.replace(`/(app)/contracts/${contract._id}`);
                    }
                },
                onError: (err: any) => {
                    setConfirmOpen(false);
                    const msg = err?.response?.data?.meta?.message ?? 'Could not sign contract. Please try again.';
                    // Tamper detection has a specific treatment — block retry until refresh.
                    if (typeof msg === 'string' && msg.toLowerCase().includes('tampered')) {
                        Alert.alert(
                            'Contract changed',
                            'The terms of this contract have been modified. Please refresh and review them before signing.',
                            [
                                {
                                    text: 'Refresh',
                                    onPress: () => router.replace(`/(app)/contracts/${contract._id}`),
                                },
                            ],
                        );
                        return;
                    }
                    Alert.alert('Could not sign', msg);
                },
            },
        );
    };

    const scrolled = !!scrollEndedAt;
    const submitting = signMutation.isPending;

    return (
        <View style={styles.container}>
            <Pressable style={styles.back} onPress={() => router.back()}>
                <ArrowLeft size={22} color="#F0ECE6" />
            </Pressable>

            <Text style={styles.header}>Review &amp; sign</Text>
            <Text style={styles.subheader}>
                {contract.terms.gigTitle} · {tierLabel}
            </Text>

            <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>YOU RECEIVE</Text>
                <Text style={styles.amountValue}>
                    Rs. {contract.terms.artistReceives.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.amountHint}>
                    Total Rs. {contract.terms.amount.toLocaleString('en-IN')} · Platform fee{' '}
                    {(contract.terms.platformFeeRate * 100).toFixed(0)}%
                </Text>
            </View>

            <View style={styles.methodRow}>
                <Wallet size={14} color="#8B5CF6" />
                <Text style={styles.methodText}>{paymentMethodLabel}</Text>
            </View>

            <View style={styles.termsPanel}>
                <View style={styles.termsHead}>
                    <FileText size={14} color="#6B6878" />
                    <Text style={styles.termsHeading}>THE FULL AGREEMENT</Text>
                </View>
                <ScrollView
                    ref={scrollRef}
                    style={styles.termsScroll}
                    contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
                    onScroll={onTermsScroll}
                    scrollEventThrottle={64}
                >
                    <TermRow icon={<Calendar size={14} color="#6B6878" />} label="Performance date">
                        {new Date(contract.terms.dates.start).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </TermRow>
                    <TermRow icon={<MapPin size={14} color="#6B6878" />} label="Location">
                        {[contract.terms.location.venue, contract.terms.location.city, contract.terms.location.state]
                            .filter(Boolean)
                            .join(', ')}
                    </TermRow>
                    <TermRow icon={<FileText size={14} color="#6B6878" />} label="Scope of work">
                        {contract.terms.scopeOfWork}
                    </TermRow>
                    {contract.terms.cancellationTerms ? (
                        <TermRow label="Cancellation">{contract.terms.cancellationTerms}</TermRow>
                    ) : null}
                    {contract.terms.customTerms ? (
                        <TermRow label="Additional terms">{contract.terms.customTerms}</TermRow>
                    ) : null}

                    <View style={styles.legalBox}>
                        <Text style={styles.legalTitle}>By signing, you agree that:</Text>
                        <Text style={styles.legalBody}>
                            • The terms above form a binding booking agreement between you and the hirer.{'\n'}
                            • NETSA is a neutral platform. Payment flows through{' '}
                            {contract.paymentMethod === 'off_platform' ? 'your chosen offline rail' : 'Razorpay'}{' '}
                            — NETSA never holds your money.{'\n'}
                            • Changes to the terms require a mutually-accepted amendment round.{'\n'}
                            • A cryptographic fingerprint of these terms is locked to your signature.
                        </Text>
                    </View>
                </ScrollView>
                {!scrolled && (
                    <View style={styles.scrollHint} pointerEvents="none">
                        <ChevronDown size={14} color="#F0ECE6" />
                        <Text style={styles.scrollHintText}>Scroll to the end to continue</Text>
                    </View>
                )}
            </View>

            <Pressable
                onPress={() => scrolled && !submitting && setConfirmOpen(true)}
                disabled={!scrolled || submitting}
                style={({ pressed }) => [pressed && scrolled && { opacity: 0.9 }]}
            >
                <LinearGradient
                    colors={scrolled ? ['#EC4899', '#F97316'] : ['#2A2635', '#211E29']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryBtn}
                >
                    <CheckCircle size={18} color={scrolled ? '#fff' : '#6B6878'} />
                    <Text style={[styles.primaryBtnText, !scrolled && { color: '#6B6878' }]}>
                        {scrolled ? 'Sign &amp; accept' : 'Read to the end to sign'}
                    </Text>
                </LinearGradient>
            </Pressable>

            <Modal
                visible={confirmOpen}
                transparent
                animationType="fade"
                onRequestClose={() => !submitting && setConfirmOpen(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalHeading}>Final confirmation</Text>
                        <Text style={styles.modalBody}>
                            You&apos;re about to sign a binding contract for{' '}
                            <Text style={styles.bold}>Rs. {contract.terms.amount.toLocaleString('en-IN')}</Text>.
                            This cannot be undone without an amendment.
                        </Text>
                        <View style={styles.modalActions}>
                            <Pressable
                                onPress={() => !submitting && setConfirmOpen(false)}
                                style={styles.modalCancel}
                                disabled={submitting}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                onPress={submit}
                                disabled={submitting}
                                style={({ pressed }) => [pressed && { opacity: 0.9 }]}
                            >
                                <LinearGradient
                                    colors={['#EC4899', '#F97316']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.modalConfirm}
                                >
                                    {submitting ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.modalConfirmText}>Yes, sign &amp; confirm</Text>
                                    )}
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function TermRow({
    icon,
    label,
    children,
}: {
    icon?: React.ReactNode;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <View style={styles.termRow}>
            {icon ? <View style={styles.termIcon}>{icon}</View> : <View style={{ width: 18 }} />}
            <View style={{ flex: 1 }}>
                <Text style={styles.termLabel}>{label}</Text>
                <Text style={styles.termValue}>{children}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A10', padding: 20 },
    centered: { flex: 1, backgroundColor: '#0A0A10', alignItems: 'center', justifyContent: 'center', padding: 24 },
    back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    header: { fontFamily: 'DMSerifDisplay-Regular', fontSize: 28, color: '#F0ECE6', marginBottom: 4 },
    subheader: { fontFamily: 'Outfit-Regular', fontSize: 13, color: '#8F8B9E', marginBottom: 20 },
    amountBox: {
        backgroundColor: '#121018',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        padding: 18,
        marginBottom: 12,
    },
    amountLabel: { fontFamily: 'Outfit-SemiBold', fontSize: 10, letterSpacing: 3, color: '#6B6878', marginBottom: 6 },
    amountValue: { fontFamily: 'Outfit-Bold', fontSize: 30, color: '#FFFFFF' },
    amountHint: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#8F8B9E', marginTop: 4 },
    methodRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    methodText: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#C4B8E3' },
    termsPanel: {
        backgroundColor: '#121018',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
        marginBottom: 16,
        flex: 1,
    },
    termsHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 16 },
    termsHeading: { fontFamily: 'Outfit-SemiBold', fontSize: 10, letterSpacing: 3, color: '#6B6878' },
    termsScroll: { maxHeight: 320 },
    termRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 10 },
    termIcon: { width: 18, alignItems: 'center', marginTop: 2 },
    termLabel: { fontFamily: 'Outfit-Regular', fontSize: 11, color: '#6B6878', marginBottom: 2, letterSpacing: 0.5 },
    termValue: { fontFamily: 'Outfit-Regular', fontSize: 14, color: '#F0ECE6', lineHeight: 22 },
    legalBox: {
        marginTop: 16,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(139,92,246,0.22)',
        backgroundColor: 'rgba(139,92,246,0.06)',
    },
    legalTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 13, color: '#F0ECE6', marginBottom: 6 },
    legalBody: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#C4B8E3', lineHeight: 20 },
    scrollHint: {
        position: 'absolute',
        bottom: 8,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        backgroundColor: 'rgba(10,10,16,0.9)',
    },
    scrollHintText: { fontFamily: 'Outfit-Regular', fontSize: 11, color: '#F0ECE6' },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 14,
    },
    primaryBtnText: { fontFamily: 'Outfit-Bold', fontSize: 15, color: '#fff' },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    modalCard: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#121018',
        borderRadius: 16,
        padding: 22,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    modalHeading: { fontFamily: 'Outfit-Bold', fontSize: 18, color: '#F0ECE6', marginBottom: 10 },
    modalBody: { fontFamily: 'Outfit-Regular', fontSize: 14, color: '#C4B8E3', lineHeight: 22, marginBottom: 18 },
    bold: { fontFamily: 'Outfit-Bold', color: '#FFFFFF' },
    modalActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
    modalCancel: { paddingHorizontal: 16, paddingVertical: 12 },
    modalCancelText: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#8F8B9E' },
    modalConfirm: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, minWidth: 180, alignItems: 'center' },
    modalConfirmText: { fontFamily: 'Outfit-Bold', fontSize: 14, color: '#fff' },
    errorTitle: { fontFamily: 'Outfit-Medium', fontSize: 15, color: '#F0ECE6', marginBottom: 16, textAlign: 'center' },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    backBtnText: { fontFamily: 'Outfit-SemiBold', fontSize: 13, color: '#F0ECE6' },
    guardianCard: {
        maxWidth: 380,
        padding: 24,
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#121018',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.25)',
    },
    guardianHeading: { fontFamily: 'Outfit-Bold', fontSize: 20, color: '#F59E0B', textAlign: 'center' },
    guardianBody: { fontFamily: 'Outfit-Regular', fontSize: 13, color: '#C4B8E3', lineHeight: 20, textAlign: 'center' },
});
