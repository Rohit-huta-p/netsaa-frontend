import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    StyleSheet,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Image,
    Alert,
} from 'react-native';
import {
    X,
    Check,
    AlertTriangle,
    Calendar,
    MapPin,
    Wallet,
    Shield,
    HandCoins,
    User as UserIcon,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateContract } from '@/hooks/usePayments';
import { useUpdateApplicationStatus } from '@/hooks/useGigApplications';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type PaymentMethod = 'on_platform' | 'off_platform';

interface HireConfirmModalProps {
    visible: boolean;
    gig: any;
    application:
        | {
              _id: string;
              artistId: string;
              artistSnapshot?: {
                  displayName?: string;
                  profileImageUrl?: string;
              };
          }
        | null;
    onClose: () => void;
    onHired?: (contractId: string) => void;
}

const formatINR = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

const formatDateRange = (start?: string | Date, end?: string | Date) => {
    if (!start) return 'Date TBD';
    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) return 'Date TBD';
    const opts: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    };
    const startStr = startDate.toLocaleDateString('en-IN', opts);
    if (!end) return startStr;
    const endDate = new Date(end);
    if (isNaN(endDate.getTime())) return startStr;
    if (startDate.toDateString() === endDate.toDateString()) return startStr;
    const endStr = endDate.toLocaleDateString('en-IN', opts);
    return `${startStr} – ${endStr}`;
};

export const HireConfirmModal: React.FC<HireConfirmModalProps> = ({
    visible,
    gig,
    application,
    onClose,
    onHired,
}) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('on_platform');
    const [offPlatformAck, setOffPlatformAck] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const createContract = useCreateContract();
    const updateApplicationStatus = useUpdateApplicationStatus();

    // Reset local state every time the modal becomes visible
    useEffect(() => {
        if (visible) {
            setPaymentMethod('on_platform');
            setOffPlatformAck(false);
            setIsCreating(false);
            setErrorMessage(null);
        }
    }, [visible]);

    // Slide-up animation
    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                damping: 22,
                stiffness: 180,
            }).start();
        } else {
            slideAnim.setValue(SCREEN_HEIGHT);
        }
    }, [visible]);

    // Derived booking summary fields — defensive against partial gig shapes
    const summary = useMemo(() => {
        const artistName =
            application?.artistSnapshot?.displayName || 'this artist';
        const avatar = application?.artistSnapshot?.profileImageUrl;
        const gigTitle = gig?.title || 'Untitled gig';
        const startDate =
            gig?.schedule?.startDate || gig?.startDate || undefined;
        const endDate = gig?.schedule?.endDate || gig?.endDate || undefined;
        const city = gig?.location?.city || '';
        const state = gig?.location?.state;
        const venue = gig?.location?.venueName || gig?.location?.venue;
        const cityLine = city
            ? state
                ? `${city}, ${state}`
                : city
            : 'Location TBD';
        const amount =
            gig?.compensation?.amount ||
            gig?.compensation?.maxAmount ||
            gig?.compensation?.minAmount ||
            0;

        // Phase 2C: read booking terms from the gig (set via the
        // /gigs/:id/booking-terms editor) so per-hire contracts inherit
        // the master/template values instead of hardcoded defaults.
        const paymentStructure: 'full' | 'advance_balance' =
            gig?.paymentStructure ?? 'full';
        const cancellationPolicy: '24h' | '48h' | '72h' =
            gig?.cancellationPolicy ?? '48h';
        const forfeitPct: number =
            typeof gig?.cancellationForfeitPct === 'number'
                ? gig.cancellationForfeitPct
                : 100;

        const cancellationTerms =
            gig?.cancellationTerms ??
            `Cancellations within ${cancellationPolicy} of event date forfeit ${forfeitPct}% of the booking amount. Artist keeps any portion already paid.`;

        return {
            artistName,
            avatar,
            gigTitle,
            startDate,
            endDate,
            city,
            state,
            venue,
            cityLine,
            amount,
            paymentStructure,
            cancellationPolicy,
            forfeitPct,
            cancellationTerms,
        };
    }, [gig, application]);

    const confirmDisabled =
        isCreating ||
        !application ||
        (paymentMethod === 'off_platform' && !offPlatformAck);

    const handleConfirmHire = async () => {
        if (!application || !gig) return;
        setIsCreating(true);
        setErrorMessage(null);

        const terms = {
            gigTitle: summary.gigTitle,
            dates: {
                start:
                    typeof summary.startDate === 'string'
                        ? summary.startDate
                        : summary.startDate
                          ? new Date(summary.startDate).toISOString()
                          : new Date().toISOString(),
                end: summary.endDate
                    ? typeof summary.endDate === 'string'
                        ? summary.endDate
                        : new Date(summary.endDate).toISOString()
                    : undefined,
            },
            location: {
                city: summary.city || '',
                state: summary.state || undefined,
                venue: summary.venue || undefined,
            },
            scopeOfWork: gig?.description || summary.gigTitle,
            amount: summary.amount,
            paymentStructure: summary.paymentStructure,
            cancellationTerms: summary.cancellationTerms,
        };

        let createdContractId: string | undefined;
        try {
            const res = await createContract.mutateAsync({
                gigId: gig._id,
                artistId: application.artistId,
                paymentMethod,
                terms,
            });
            // Endpoint returns { meta, data: contract, errors } — pull id from data
            const contract = res?.data || res;
            createdContractId = contract?._id || contract?.id;
        } catch (err: any) {
            const status =
                err?.response?.status ??
                err?.status ??
                err?.response?.data?.meta?.status;
            const data = err?.response?.data?.data ?? err?.data;

            if (status === 409) {
                // Already-hired branch: friendly recovery UX. The artist
                // already has a non-terminal contract for this gig, so the
                // backend dedup guard fired. Offer to view it instead of
                // dead-ending on an error chip.
                setIsCreating(false);
                // Refresh caches so the stale applicants list drops the
                // already-hired artist on next render.
                queryClient.invalidateQueries({ queryKey: ['gigApplications', gig._id] });
                queryClient.invalidateQueries({ queryKey: ['contracts'] });

                const artistName =
                    application.artistSnapshot?.displayName ?? 'This artist';
                if (data?.existingContractId) {
                    try {
                        Alert.alert(
                            'Already hired',
                            `${artistName} is already on your team for this gig.`,
                            [
                                { text: 'OK', style: 'cancel' },
                                {
                                    text: 'View contract',
                                    onPress: () => {
                                        onClose();
                                        try {
                                            router?.push?.(
                                                `/(app)/contracts/${data.existingContractId}` as any,
                                            );
                                        } catch {
                                            /* navigation optional in tests */
                                        }
                                    },
                                },
                            ],
                        );
                    } catch {
                        /* noop in test environments */
                    }
                } else {
                    // Backend not yet enriched with existingContractId —
                    // generic friendly fallback.
                    try {
                        Alert.alert(
                            'Already hired',
                            `${artistName} is already hired for this gig. Refresh to see them under Your team.`,
                        );
                    } catch {
                        /* noop */
                    }
                }
                return;
            }

            const msg =
                err?.response?.data?.meta?.message ||
                err?.message ||
                'Unknown error';
            setErrorMessage(`Couldn't create contract: ${msg}. Try again.`);
            setIsCreating(false);
            return;
        }

        // Contract created — now update the application status
        try {
            await updateApplicationStatus.mutateAsync({
                applicationId: application._id,
                status: 'hired',
            });
        } catch (err: any) {
            // Contract is the source of truth — close modal but warn.
            // Cache invalidation still matters: contract IS created, so the
            // hub's contracts list must refresh even if the application-status
            // update side-failed.
            queryClient.invalidateQueries({ queryKey: ['gigApplications', gig._id] });
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            setIsCreating(false);
            onClose();
            try {
                Alert.alert(
                    'Contract created',
                    "Contract created but couldn't update application. Refresh to sync.",
                );
            } catch {
                /* noop in test environments */
            }
            if (createdContractId && onHired) onHired(createdContractId);
            return;
        }

        // All good — invalidate both query keys so the just-hired artist
        // drops off the pending applicants section in the gig hub and
        // shows up under "Your team" / contracts list.
        queryClient.invalidateQueries({ queryKey: ['gigApplications', gig._id] });
        queryClient.invalidateQueries({ queryKey: ['contracts'] });

        setIsCreating(false);
        onClose();
        try {
            Alert.alert('Hired!', `Contract sent to ${summary.artistName}`);
        } catch {
            /* noop */
        }
        if (createdContractId) {
            if (onHired) onHired(createdContractId);
            try {
                router?.push?.(`/contracts/${createdContractId}` as any);
            } catch {
                /* navigation optional */
            }
        }
    };

    if (!visible || !application) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.flex}
            >
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={isCreating ? undefined : onClose}
                />

                <Animated.View
                    style={[
                        styles.sheet,
                        { transform: [{ translateY: slideAnim }] },
                    ]}
                >
                    <LinearGradient
                        colors={['#0F0F10', '#000000']}
                        style={styles.gradientBg}
                    >
                        {/* Drag handle */}
                        <View style={styles.handleWrap}>
                            <View style={styles.handle} />
                        </View>

                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.headerTextWrap}>
                                <Text style={styles.eyebrow}>Confirm Hire</Text>
                                <Text style={styles.title}>
                                    You're hiring {summary.artistName}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={isCreating ? undefined : onClose}
                                disabled={isCreating}
                                style={styles.closeBtn}
                            >
                                <X size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.scroll}
                            contentContainerStyle={{ paddingBottom: 32 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* ── Section A: Booking Summary ── */}
                            <View style={styles.sectionLabelWrap}>
                                <Text style={styles.sectionLabel}>
                                    Booking Summary
                                </Text>
                            </View>
                            <View style={styles.summaryCard}>
                                {/* Artist row */}
                                <View style={styles.artistRow}>
                                    <View style={styles.avatarWrap}>
                                        {summary.avatar ? (
                                            <Image
                                                source={{ uri: summary.avatar }}
                                                style={styles.avatarImg}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={styles.avatarFallback}>
                                                <UserIcon
                                                    size={20}
                                                    color="#71717A"
                                                />
                                            </View>
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.artistName}>
                                            {summary.artistName}
                                        </Text>
                                        <Text style={styles.gigTitle}>
                                            {summary.gigTitle}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                {/* Amount */}
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>
                                        Amount
                                    </Text>
                                    <Text
                                        style={styles.summaryValueAmount}
                                        accessibilityLabel="hire-amount"
                                    >
                                        {formatINR(summary.amount)}
                                    </Text>
                                </View>

                                {/* Dates */}
                                <View style={styles.summaryRow}>
                                    <View style={styles.iconLabel}>
                                        <Calendar size={12} color="#71717A" />
                                        <Text style={styles.summaryLabel}>
                                            Dates
                                        </Text>
                                    </View>
                                    <Text style={styles.summaryValue}>
                                        {formatDateRange(
                                            summary.startDate,
                                            summary.endDate,
                                        )}
                                    </Text>
                                </View>

                                {/* Location */}
                                <View style={styles.summaryRow}>
                                    <View style={styles.iconLabel}>
                                        <MapPin size={12} color="#71717A" />
                                        <Text style={styles.summaryLabel}>
                                            Location
                                        </Text>
                                    </View>
                                    <Text style={styles.summaryValue}>
                                        {summary.cityLine}
                                    </Text>
                                </View>

                                <View style={styles.divider} />

                                {/* Cancellation */}
                                <Text style={styles.cancelLabel}>
                                    Cancellation policy
                                </Text>
                                <Text style={styles.cancelText}>
                                    {summary.cancellationTerms}
                                </Text>
                            </View>

                            {/* ── Section B: Payment Method ── */}
                            <View style={[styles.sectionLabelWrap, { marginTop: 24 }]}>
                                <Text style={styles.sectionLabel}>
                                    Payment Method
                                </Text>
                            </View>

                            {/* On-platform card */}
                            <TouchableOpacity
                                onPress={() => setPaymentMethod('on_platform')}
                                activeOpacity={0.85}
                                accessibilityRole="radio"
                                accessibilityState={{
                                    checked: paymentMethod === 'on_platform',
                                }}
                                accessibilityLabel="Pay through NETSA"
                                style={[
                                    styles.payCard,
                                    paymentMethod === 'on_platform' &&
                                        styles.payCardSelected,
                                ]}
                            >
                                <View style={styles.payHeaderRow}>
                                    <View style={styles.payIconWrap}>
                                        <Wallet size={16} color="#FF6B35" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={styles.titleRow}>
                                            <Text style={styles.payTitle}>
                                                Pay through NETSA
                                            </Text>
                                            <View style={styles.recommendedPill}>
                                                <Text style={styles.recommendedTxt}>
                                                    Recommended
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.payBullets}>
                                            ✓ UPI / GPay / cards / netbanking{'\n'}
                                            ✓ Instant receipt + downloadable
                                            contract{'\n'}
                                            ✓ Refund protection per cancellation
                                            policy
                                        </Text>
                                        <Text style={styles.payNote}>
                                            MVP: 0% platform fee. Razorpay
                                            processing fee 2%.
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.radio,
                                            paymentMethod === 'on_platform' &&
                                                styles.radioSelected,
                                        ]}
                                    >
                                        {paymentMethod === 'on_platform' && (
                                            <View style={styles.radioDot} />
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {/* Off-platform card */}
                            <TouchableOpacity
                                onPress={() => setPaymentMethod('off_platform')}
                                activeOpacity={0.85}
                                accessibilityRole="radio"
                                accessibilityState={{
                                    checked: paymentMethod === 'off_platform',
                                }}
                                accessibilityLabel={`Pay ${summary.artistName} directly`}
                                style={[
                                    styles.payCard,
                                    paymentMethod === 'off_platform' &&
                                        styles.payCardSelected,
                                ]}
                            >
                                <View style={styles.payHeaderRow}>
                                    <View style={styles.payIconWrap}>
                                        <HandCoins size={16} color="#A1A1AA" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.payTitle}>
                                            Pay {summary.artistName} directly
                                        </Text>
                                        <Text style={styles.payBullets}>
                                            • Cash / UPI / bank / card — your
                                            choice{'\n'}
                                            • Record payment in NETSA after{'\n'}
                                            ⚠ No platform protection on this
                                            path
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.radio,
                                            paymentMethod === 'off_platform' &&
                                                styles.radioSelected,
                                        ]}
                                    >
                                        {paymentMethod === 'off_platform' && (
                                            <View style={styles.radioDot} />
                                        )}
                                    </View>
                                </View>

                                {paymentMethod === 'off_platform' && (
                                    <TouchableOpacity
                                        onPress={() =>
                                            setOffPlatformAck((v) => !v)
                                        }
                                        activeOpacity={0.7}
                                        accessibilityRole="checkbox"
                                        accessibilityLabel="off-platform-ack"
                                        accessibilityState={{
                                            checked: offPlatformAck,
                                        }}
                                        style={styles.ackRow}
                                    >
                                        <View
                                            style={[
                                                styles.checkbox,
                                                offPlatformAck &&
                                                    styles.checkboxOn,
                                            ]}
                                        >
                                            {offPlatformAck && (
                                                <Check
                                                    size={12}
                                                    color="#000"
                                                    strokeWidth={3}
                                                />
                                            )}
                                        </View>
                                        <Text style={styles.ackText}>
                                            I understand NETSA will not process
                                            or hold this payment.
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>

                            {/* Inline error chip */}
                            {errorMessage && (
                                <View style={styles.errorChip}>
                                    <AlertTriangle size={14} color="#EF4444" />
                                    <Text style={styles.errorText}>
                                        {errorMessage}
                                    </Text>
                                </View>
                            )}
                        </ScrollView>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                onPress={isCreating ? undefined : onClose}
                                disabled={isCreating}
                                style={styles.cancelBtn}
                                accessibilityLabel="cancel-hire"
                            >
                                <Text style={styles.cancelTxt}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={
                                    confirmDisabled
                                        ? undefined
                                        : handleConfirmHire
                                }
                                disabled={confirmDisabled}
                                accessibilityLabel="confirm-hire"
                                accessibilityState={{ disabled: confirmDisabled }}
                                style={[
                                    styles.confirmBtn,
                                    confirmDisabled && styles.confirmBtnDisabled,
                                ]}
                            >
                                <Shield size={14} color="#000" strokeWidth={3} />
                                <Text style={styles.confirmTxt}>
                                    {isCreating
                                        ? 'Creating contract…'
                                        : 'Confirm Hire'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    flex: { flex: 1 },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: '92%',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
    },
    gradientBg: {
        flex: 1,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderBottomWidth: 0,
    },
    handleWrap: { width: '100%', alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerTextWrap: { flex: 1 },
    eyebrow: {
        color: '#FF6B35',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    title: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scroll: { flex: 1, paddingHorizontal: 20 },
    sectionLabelWrap: { paddingTop: 18, paddingBottom: 8 },
    sectionLabel: {
        color: '#71717A',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    summaryCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 20,
        padding: 16,
    },
    artistRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarWrap: {
        width: 48,
        height: 48,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#27272A',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    avatarImg: { width: '100%', height: '100%' },
    avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    artistName: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
    gigTitle: { color: '#A1A1AA', fontSize: 12, marginTop: 2 },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 14,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    iconLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    summaryLabel: {
        color: '#71717A',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    summaryValue: { color: '#E4E4E7', fontSize: 13, fontWeight: '600' },
    summaryValueAmount: { color: '#FF6B35', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    cancelLabel: {
        color: '#71717A',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    cancelText: { color: '#A1A1AA', fontSize: 12, lineHeight: 18 },
    payCard: {
        marginBottom: 12,
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 20,
    },
    payCardSelected: {
        borderColor: 'rgba(255,107,53,0.4)',
        backgroundColor: 'rgba(255,107,53,0.05)',
    },
    payHeaderRow: { flexDirection: 'row', gap: 12 },
    payIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    payTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
    recommendedPill: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: 'rgba(34,197,94,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(34,197,94,0.25)',
        borderRadius: 6,
    },
    recommendedTxt: {
        color: '#22C55E',
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    payBullets: { color: '#A1A1AA', fontSize: 12, marginTop: 6, lineHeight: 18 },
    payNote: { color: '#71717A', fontSize: 10, marginTop: 8, fontStyle: 'italic' },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: { borderColor: '#FF6B35' },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF6B35' },
    ackRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
        alignItems: 'flex-start',
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
    },
    checkboxOn: { backgroundColor: '#FBBF24', borderColor: '#FBBF24' },
    ackText: { color: '#E4E4E7', fontSize: 12, flex: 1, lineHeight: 18 },
    errorChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(239,68,68,0.1)',
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
        borderRadius: 16,
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
        letterSpacing: 2,
    },
    confirmBtn: {
        flex: 2,
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#10B981',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },
    confirmBtnDisabled: { backgroundColor: 'rgba(16,185,129,0.3)', shadowOpacity: 0 },
    confirmTxt: {
        color: '#000',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
});

export default HireConfirmModal;
