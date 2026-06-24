import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApplyToGig } from '../../hooks/useGigApplications';
import { useEventFunnelSource } from '../../hooks/useEventFunnelSource';
import { X, Link as LinkIcon, Plus, Trash2, Check, Shield, FileText, Save } from 'lucide-react-native';
import { ProfileCompletionModal } from '../common/ProfileCompletionModal';
import { draftService, generateDraftId, type ApplicationDraft } from '../../services/draftService';
// CONTRACTS-DISABLED: Phase 4C contract PDF preview imports retained below
// for fast revert when the contract artifact is restored.
// import { useContractPdf } from '@/features/contract-pdf/hooks/useContractPdf';
// import { buildFromGig } from '@/features/contract-pdf/utils/buildContractData';

/**
 * PRD v4 Gig Application Flow — Stage 1: Artist Applies
 *
 * Three-tiered contract ceremony based on gig amount:
 * - Quick (<Rs.10K): Single checkbox, one tap
 * - Standard (Rs.10K-1L): Scrollable terms + explicit agreement
 * - Premium (>Rs.1L): Full terms, must scroll to bottom, explicit agreement
 *   (OTP verification happens at Stage 3 when artist confirms booking)
 *
 * Fields: Cover note, portfolio links, proposed rate (if negotiable)
 * Output: Application with status "Applied (Terms Acknowledged)"
 */

type ContractTier = 'quick' | 'standard' | 'premium';

function getContractTier(amount: number): ContractTier {
    if (amount < 10000) return 'quick';
    if (amount <= 100000) return 'standard';
    return 'premium';
}

function getTierLabel(tier: ContractTier): string {
    return tier === 'quick' ? 'Quick Agreement' : tier === 'standard' ? 'Standard Agreement' : 'Premium Agreement';
}

interface GigApplyModalProps {
    visible: boolean;
    onClose: () => void;
    gigId: string;
    gigTitle: string;
    gigAmount?: number;
    isNegotiable?: boolean;
    termsAndConditions?: string;
    /**
     * Phase 4C — full gig object enables PDF contract preview.
     * When present, Step 2 shows a "View full contract" button that
     * generates the PDF on-device using the Phase 4B-Lite template.
     * When absent, Step 2 falls back to the legacy text-terms flow.
     */
    gig?: any;
    onViewTerms?: () => void;
    hasTerms?: boolean;
    /**
     * Plan 2, Task 17 — if present, the modal loads the draft via
     * draftService.get() and prefills the form fields. When the user taps
     * "Save as draft", the same draftId is reused for the upsert so the
     * round-trip is stable.
     */
    draftId?: string;
}

export const GigApplyModal: React.FC<GigApplyModalProps> = ({
    visible, onClose, gigId, gigTitle,
    gigAmount = 0, isNegotiable = false,
    termsAndConditions, gig, onViewTerms, hasTerms,
    draftId,
}) => {
    // step 1 = form · 2 = terms · 'success' = post-submit confirmation.
    // 'success' renders an inline confirmation panel inside the same
    // Modal so the user gets unmissable feedback even on Android (where
    // an Alert dialog stacked on top of a Modal can fail to render).
    const [step, setStep] = useState<1 | 2 | 'success'>(1);
    const [coverNote, setCoverNote] = useState('');
    const [portfolioLinks, setPortfolioLinks] = useState<string[]>(['']);
    const [proposedRate, setProposedRate] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [profileModalData, setProfileModalData] = useState<{ score: number; missing: string[] }>({ score: 0, missing: [] });

    const applyMutation = useApplyToGig();
    const router = useRouter();
    // Plan 7 Task 18 — reads ?from=event:<id> query param when the artist
    // enters the apply flow from an event context (e.g. a related-gig CTA).
    // Forwarded to gigApplication.source on the backend (Plan 6 Task 21).
    const funnelSource = useEventFunnelSource();
    // CONTRACTS-DISABLED: Phase 4C PDF generation hook + handler retained below for fast revert.
    // const pdf = useContractPdf();

    const tier = useMemo(() => getContractTier(gigAmount), [gigAmount]);

    /*
    const handleViewContractPdf = async () => {
        if (!gig) return;
        try {
            const hirerName =
                gig.organizerSnapshot?.displayName ??
                gig.organizerId?.displayName ??
                'The hirer';
            const data = buildFromGig(gig, {
                hirerName,
                artistName: 'You (the artist)',
            });
            await pdf.generateAndShare(data);
        } catch (err: any) {
            Alert.alert('Could not generate contract', err?.message ?? 'Try again.');
        }
    };
    */

    // Plan 2, Task 17 — draft prefill + save-as-draft wiring.
    // Track whether we've already consumed the draftId so prefill runs
    // exactly once per modal open. Without this guard, typing in the form
    // would get clobbered on re-renders.
    const prefilledDraftRef = useRef<string | null>(null);
    // The resolved draft id this modal is operating on. If we loaded one at
    // mount we keep it; if the user taps Save-as-draft without an incoming
    // draftId we allocate a new one and stash it here so subsequent saves
    // in the same session update the same record.
    const [activeDraftId, setActiveDraftId] = useState<string | null>(
        draftId ?? null
    );
    const [savingDraft, setSavingDraft] = useState(false);

    useEffect(() => {
        // Only prefill when:
        //   (a) modal is visible (reset-and-close clears ref on close)
        //   (b) a draftId prop was passed
        //   (c) we haven't already prefilled for this draftId
        if (!visible) return;
        if (!draftId) return;
        if (prefilledDraftRef.current === draftId) return;
        prefilledDraftRef.current = draftId;
        setActiveDraftId(draftId);

        draftService
            .get(draftId)
            .then((d) => {
                if (!d) {
                    console.log('[GigApplyModal] No draft found for id', draftId);
                    return;
                }
                // Draft field -> form state. ApplicationDraft.pitch is the
                // cover-note equivalent; availability/quotedRate are kept on
                // the draft but do not have form fields in this modal yet,
                // so we only prefill what the UI renders.
                if (typeof d.pitch === 'string') setCoverNote(d.pitch);
                if (typeof d.quotedRate === 'number') {
                    setProposedRate(String(d.quotedRate));
                }
            })
            .catch((err) => {
                console.warn('[GigApplyModal] Draft load failed:', err);
            });
    }, [visible, draftId]);

    const handleSaveDraft = async () => {
        if (savingDraft) return;
        setSavingDraft(true);
        try {
            const id = activeDraftId ?? generateDraftId();
            const draft: ApplicationDraft = {
                draftId: id,
                gigId,
                gigTitle,
                pitch: coverNote,
                quotedRate: proposedRate ? parseInt(proposedRate, 10) : undefined,
                updatedAt: new Date().toISOString(),
            };
            await draftService.upsert(draft);
            setActiveDraftId(id);
            Alert.alert('Draft saved', 'Pick up where you left off anytime.', [
                { text: 'OK', onPress: resetAndClose },
            ]);
        } catch (err) {
            console.warn('[GigApplyModal] Save draft failed:', err);
            Alert.alert('Could not save draft', 'Please try again.');
        } finally {
            setSavingDraft(false);
        }
    };

    const handleLinkChange = (text: string, index: number) => {
        const updated = [...portfolioLinks];
        updated[index] = text;
        setPortfolioLinks(updated);
    };

    const addLinkField = () => setPortfolioLinks([...portfolioLinks, '']);

    const removeLinkField = (index: number) => {
        const updated = [...portfolioLinks];
        updated.splice(index, 1);
        setPortfolioLinks(updated);
    };

    const handleNext = () => {
        if (!coverNote.trim()) {
            Alert.alert('Required', 'Please add a cover note to introduce yourself.');
            return;
        }
        setStep(2);
    };

    const handleSubmit = () => {
        if (!termsAccepted) {
            Alert.alert('Required', 'Please agree to the booking terms to apply.');
            return;
        }

        // For premium tier, user must scroll to bottom first
        if (tier === 'premium' && !hasScrolledToBottom) {
            Alert.alert('Please Read Terms', 'Scroll to the bottom of the terms to continue.');
            return;
        }

        const validLinks = portfolioLinks.filter(link => link.trim() !== '');

        applyMutation.mutate(
            {
                gigId,
                payload: {
                    coverNote,
                    portfolioLinks: validLinks,
                    proposedRate: proposedRate ? parseInt(proposedRate) : undefined,
                    termsAcknowledged: true,
                    contractTier: tier,
                    // Plan 7 Task 18 — funnel source wiring. Undefined when
                    // the artist navigates directly (no ?from= param); omitted
                    // from the API body in that case (backend treats absent
                    // source as organic / direct).
                    source: funnelSource,
                }
            },
            {
                onSuccess: () => {
                    // Plan 5 — inline success step instead of Alert.alert.
                    // RN Alerts stacked on top of an open Modal can fail
                    // to render on some Android builds (200 status comes
                    // back, but the user sees nothing). Switching to an
                    // in-modal success panel removes that whole class
                    // of bug + gives a more on-brand confirmation.
                    setStep('success');
                },
                onError: (error: any) => {
                    const meta = error.response?.data?.meta;
                    if (meta?.message === 'PROFILE_INCOMPLETE') {
                        setProfileModalData({ score: meta.score ?? 0, missing: meta.missing ?? [] });
                        setProfileModalVisible(true);
                        return;
                    }
                    Alert.alert('Error', meta?.message || 'Failed to submit application');
                }
            }
        );
    };

    /*
     * Auto-close the modal 3.5s after the success panel mounts. Long
     * enough for the user to read the confirmation, short enough to
     * respect their flow. They can tap "Done" to close immediately.
     * The cleanup clears the timer if the modal is dismissed earlier
     * by some other path (e.g. parent unmounts the modal).
     */
    useEffect(() => {
        if (step !== 'success') return;
        const t = setTimeout(() => {
            resetAndClose();
        }, 3500);
        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    const resetAndClose = () => {
        setCoverNote('');
        setPortfolioLinks(['']);
        setProposedRate('');
        setTermsAccepted(false);
        setHasScrolledToBottom(false);
        setStep(1);
        // Plan 2, Task 17 — clear the draft-prefill guard so the next open
        // (same draftId or not) prefills fresh.
        prefilledDraftRef.current = null;
        setActiveDraftId(null);
        onClose();
    };

    const handleTermsScroll = (event: any) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
        if (isBottom) setHasScrolledToBottom(true);
    };

    // The hirer-authored Terms & Conditions from the gig form (Page 4).
    // Empty when the hirer left the field blank; the modal renders a clear
    // "no specific terms" note in that case rather than fake boilerplate.
    const hirerTerms = (termsAndConditions ?? '').trim();
    const hasHirerTerms = hirerTerms.length > 0;

    return (
        <>
            <Modal visible={visible} animationType="slide" transparent onRequestClose={resetAndClose}>
                <View style={styles.overlay}>
                    <View style={styles.sheet}>

                        {/* Header */}
                        <View style={styles.header}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.headerTitle}>
                                    {step === 1
                                        ? 'Apply for Gig'
                                        : step === 'success'
                                            ? 'Application sent'
                                            : getTierLabel(tier)}
                                </Text>
                                <Text style={styles.headerSub} numberOfLines={1}>{gigTitle}</Text>
                            </View>
                            {/* Step indicator (hidden on success) */}
                            {step !== 'success' && (
                                <View style={styles.stepIndicator}>
                                    <View style={[styles.stepDot, (step === 1 || step === 2) && styles.stepDotActive]} />
                                    <View style={[styles.stepDot, step === 2 && styles.stepDotActive]} />
                                </View>
                            )}
                            <TouchableOpacity onPress={resetAndClose} style={styles.closeBtn}>
                                <X size={20} color="#F0ECE6" />
                            </TouchableOpacity>
                        </View>

                        {step === 'success' ? (
                            /* ═══════ SUCCESS PANEL ═══════
                               Replaces the Alert.alert flow that some
                               Android builds were swallowing. Renders
                               inside the same Modal so it's guaranteed
                               visible regardless of OS-level dialog
                               layering quirks. */
                            <View
                                testID="apply-success-panel"
                                style={{ paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center' }}
                            >
                                <View
                                    style={{
                                        width: 72, height: 72, borderRadius: 36,
                                        backgroundColor: 'rgba(74,222,128,0.12)',
                                        borderWidth: 1, borderColor: 'rgba(74,222,128,0.32)',
                                        alignItems: 'center', justifyContent: 'center',
                                        marginBottom: 18,
                                    }}
                                >
                                    <Check size={36} color="#4ADE80" strokeWidth={2.5} />
                                </View>
                                <Text
                                    style={{
                                        fontSize: 18, fontWeight: '700', color: '#F0ECE6',
                                        textAlign: 'center', marginBottom: 8,
                                    }}
                                >
                                    Application sent
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 13, color: '#A89578', textAlign: 'center',
                                        lineHeight: 19, marginBottom: 24, paddingHorizontal: 12,
                                    }}
                                >
                                    The hirer will review it and you'll be notified the moment they respond.
                                </Text>
                                <TouchableOpacity
                                    onPress={resetAndClose}
                                    activeOpacity={0.85}
                                    style={{
                                        backgroundColor: '#FF6B35',
                                        paddingVertical: 14, paddingHorizontal: 36,
                                        borderRadius: 10, minWidth: 160, alignItems: 'center',
                                    }}
                                    testID="apply-success-done"
                                >
                                    <Text style={{ color: '#1A0A04', fontWeight: '700', fontSize: 14 }}>
                                        Done
                                    </Text>
                                </TouchableOpacity>
                                <Text style={{ fontSize: 11, color: '#57524C', marginTop: 14 }}>
                                    Closing automatically…
                                </Text>
                            </View>
                        ) : step === 1 ? (
                            /* ═══════ STEP 1: Application Form ═══════ */
                            <>
                                <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 20 }}>
                                    {/* Cover Note */}
                                    <Text style={styles.label}>Cover Note <Text style={{ color: '#EF4444' }}>*</Text></Text>
                                    <Text style={styles.hint}>Tell the hirer why you're a great fit for this gig</Text>
                                    <TextInput
                                        multiline
                                        numberOfLines={5}
                                        textAlignVertical="top"
                                        placeholder="I have 5 years of experience in Kathak and have performed at 50+ sangeet events..."
                                        placeholderTextColor="#4A4656"
                                        style={styles.textArea}
                                        value={coverNote}
                                        onChangeText={setCoverNote}
                                    />

                                    {/* Proposed Rate (if negotiable) */}
                                    {isNegotiable && (
                                        <View style={{ marginTop: 20 }}>
                                            <Text style={styles.label}>Your Proposed Rate</Text>
                                            <Text style={styles.hint}>
                                                Listed: Rs. {gigAmount.toLocaleString('en-IN')} (negotiable). Suggest your rate.
                                            </Text>
                                            <View style={styles.rateInput}>
                                                <Text style={styles.ratePrefix}>Rs.</Text>
                                                <TextInput
                                                    placeholder={gigAmount.toLocaleString('en-IN')}
                                                    placeholderTextColor="#4A4656"
                                                    style={styles.rateField}
                                                    keyboardType="numeric"
                                                    value={proposedRate}
                                                    onChangeText={setProposedRate}
                                                />
                                            </View>
                                        </View>
                                    )}

                                    {/* Portfolio Links */}
                                    <View style={{ marginTop: 20 }}>
                                        <Text style={styles.label}>Portfolio Links</Text>
                                        <Text style={styles.hint}>YouTube, Instagram, or personal website</Text>

                                        {portfolioLinks.map((link, i) => (
                                            <View key={i} style={styles.linkRow}>
                                                <View style={styles.linkInput}>
                                                    <LinkIcon size={14} color="#6B6878" />
                                                    <TextInput
                                                        placeholder="https://..."
                                                        placeholderTextColor="#4A4656"
                                                        style={styles.linkField}
                                                        value={link}
                                                        onChangeText={(t) => handleLinkChange(t, i)}
                                                        autoCapitalize="none"
                                                        keyboardType="url"
                                                    />
                                                </View>
                                                {portfolioLinks.length > 1 && (
                                                    <TouchableOpacity onPress={() => removeLinkField(i)} style={styles.removeLink}>
                                                        <Trash2 size={16} color="#EF4444" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ))}

                                        <TouchableOpacity onPress={addLinkField} style={styles.addLink}>
                                            <Plus size={14} color="#F97316" />
                                            <Text style={styles.addLinkText}>Add Another Link</Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>

                                {/* Next + Save-as-draft buttons */}
                                <View style={styles.footer}>
                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        <TouchableOpacity
                                            onPress={handleSaveDraft}
                                            disabled={savingDraft}
                                            style={styles.secondaryBtn}
                                            accessibilityRole="button"
                                            accessibilityLabel="Save as draft"
                                            testID="apply-save-draft-btn"
                                        >
                                            {savingDraft ? (
                                                <ActivityIndicator size="small" color="#F0ECE6" />
                                            ) : (
                                                <>
                                                    <Save size={16} color="#F0ECE6" />
                                                    <Text style={styles.secondaryBtnText}>Save draft</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={handleNext} activeOpacity={0.9} style={{ flex: 2 }}>
                                            <LinearGradient colors={['#EC4899', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                                                <Text style={styles.primaryBtnText}>Review Terms</Text>
                                                <FileText size={18} color="#fff" />
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        ) : (
                            /* ═══════ STEP 2: Terms Acknowledgment (Tiered) ═══════ */
                            <>
                                <ScrollView
                                    style={styles.body}
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                    onScroll={tier === 'premium' ? handleTermsScroll : undefined}
                                    scrollEventThrottle={100}
                                >
                                    {/* Tier badge */}
                                    <View style={styles.tierBadge}>
                                        <Shield size={14} color={tier === 'premium' ? '#EAB308' : tier === 'standard' ? '#3B82F6' : '#34D399'} />
                                        <Text style={[styles.tierText, {
                                            color: tier === 'premium' ? '#EAB308' : tier === 'standard' ? '#3B82F6' : '#34D399'
                                        }]}>
                                            {tier === 'quick' ? 'Quick Agreement (<Rs.10K)' :
                                                tier === 'standard' ? 'Standard Agreement (Rs.10K-1L)' :
                                                    'Premium Agreement (>Rs.1L)'}
                                        </Text>
                                    </View>

                                    {/* Booking summary */}
                                    <View style={styles.summaryCard}>
                                        <Text style={styles.summaryTitle}>{gigTitle}</Text>
                                        <View style={styles.summaryRow}>
                                            <Text style={styles.summaryLabel}>Amount</Text>
                                            <Text style={styles.summaryValue}>Rs. {gigAmount.toLocaleString('en-IN')}</Text>
                                        </View>
                                        {proposedRate && parseInt(proposedRate) !== gigAmount && (
                                            <View style={styles.summaryRow}>
                                                <Text style={styles.summaryLabel}>Your proposed rate</Text>
                                                <Text style={[styles.summaryValue, { color: '#F97316' }]}>Rs. {parseInt(proposedRate).toLocaleString('en-IN')}</Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* CONTRACTS-DISABLED: Phase 4C contract PDF preview hidden
                                        until the contract artifact is restored. Apply Stage 1
                                        ceremony (T&C scroll + agreement checkbox below) still
                                        runs against gig.termsAndConditions. */}
                                    {/* preserved JSX skipped for brevity — see git history pre-rollback */}

                                    {/* Terms & Conditions — always-visible section. Renders the
                                        hirer's authored T&C from Page 4 of the gig form. When the
                                        hirer left the field blank we show a clear "no specific
                                        terms" note instead of fake boilerplate so the artist
                                        knows the gig has none. The premium-tier scroll-gate still
                                        applies (must scroll to bottom before the agreement
                                        checkbox enables). */}
                                    <View style={styles.termsBox} accessibilityLabel="apply-terms-section">
                                        <Text style={styles.termsHeading}>Terms & Conditions</Text>
                                        {hasHirerTerms ? (
                                            <Text style={styles.termsText}>{hirerTerms}</Text>
                                        ) : (
                                            <Text style={[styles.termsText, { fontStyle: 'italic' }]}>
                                                The hirer hasn't set specific terms for this gig. Standard NETSA platform terms apply.
                                            </Text>
                                        )}
                                        {tier === 'premium' && hasHirerTerms && !hasScrolledToBottom && (
                                            <Text style={styles.scrollHint}>Scroll to bottom to continue</Text>
                                        )}
                                    </View>

                                    {/* Agreement checkbox */}
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (tier === 'premium' && !hasScrolledToBottom) {
                                                Alert.alert('Please Read Terms', 'Scroll to the bottom of the terms first.');
                                                return;
                                            }
                                            setTermsAccepted(!termsAccepted);
                                        }}
                                        style={styles.checkboxRow}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                                            {termsAccepted && <Check size={14} color="#fff" />}
                                        </View>
                                        <Text style={styles.checkboxLabel}>
                                            {tier === 'quick'
                                                ? 'I agree to the booking terms'
                                                : 'I have read and agree to all booking terms'}
                                        </Text>
                                    </TouchableOpacity>

                                    {/* What happens next */}
                                    <View style={styles.nextSteps}>
                                        <Text style={styles.nextStepsTitle}>What happens after you apply?</Text>
                                        <Text style={styles.nextStepsItem}>1. The hirer reviews your application</Text>
                                        <Text style={styles.nextStepsItem}>2. If selected, you'll get a booking confirmation to review</Text>
                                        <Text style={styles.nextStepsItem}>3. You confirm the booking and payment is processed</Text>
                                    </View>
                                </ScrollView>

                                {/* Footer */}
                                <View style={styles.footer}>
                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                                            <Text style={styles.backBtnText}>Back</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={handleSubmit}
                                            disabled={applyMutation.isPending || !termsAccepted}
                                            style={{ flex: 2 }}
                                            activeOpacity={0.9}
                                        >
                                            <LinearGradient
                                                colors={termsAccepted ? ['#EC4899', '#F97316'] : ['#4A4656', '#4A4656']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.primaryBtn}
                                            >
                                                {applyMutation.isPending ? (
                                                    <ActivityIndicator color="#fff" />
                                                ) : (
                                                    <Text style={styles.primaryBtnText}>Submit Application</Text>
                                                )}
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            <ProfileCompletionModal
                visible={profileModalVisible}
                onClose={() => setProfileModalVisible(false)}
                onGoToProfile={() => {
                    setProfileModalVisible(false);
                    onClose();
                    router.push('/(app)/profile?highlight=true');
                }}
                score={profileModalData.score}
                missing={profileModalData.missing}
            />
        </>
    );
};

const styles = {
    overlay: {
        flex: 1,
        justifyContent: 'flex-end' as const,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sheet: {
        backgroundColor: '#121018',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%' as any,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    header: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
        gap: 12,
    },
    headerTitle: {
        fontFamily: 'Outfit-Bold',
        fontSize: 18,
        color: '#F0ECE6',
    },
    headerSub: {
        fontFamily: 'Outfit-Regular',
        fontSize: 13,
        color: '#6B6878',
        marginTop: 2,
    },
    stepIndicator: {
        flexDirection: 'row' as const,
        gap: 4,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    stepDotActive: {
        backgroundColor: '#F97316',
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    body: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    label: {
        fontFamily: 'Outfit-SemiBold',
        fontSize: 15,
        color: '#F0ECE6',
        marginBottom: 4,
    },
    hint: {
        fontFamily: 'Outfit-Regular',
        fontSize: 12,
        color: '#6B6878',
        marginBottom: 10,
    },
    textArea: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: 16,
        color: '#F0ECE6',
        fontFamily: 'Outfit-Regular',
        fontSize: 14,
        minHeight: 120,
        textAlignVertical: 'top' as const,
    },
    rateInput: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 48,
    },
    ratePrefix: {
        fontFamily: 'Outfit-Bold',
        fontSize: 16,
        color: '#F0ECE6',
        marginRight: 8,
    },
    rateField: {
        flex: 1,
        fontFamily: 'Outfit-Medium',
        fontSize: 16,
        color: '#F0ECE6',
    },
    linkRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        marginBottom: 8,
        gap: 8,
    },
    linkInput: {
        flex: 1,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 44,
        gap: 10,
    },
    linkField: {
        flex: 1,
        fontFamily: 'Outfit-Regular',
        fontSize: 13,
        color: '#F0ECE6',
    },
    removeLink: {
        padding: 10,
        backgroundColor: 'rgba(239,68,68,0.08)',
        borderRadius: 10,
    },
    addLink: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        padding: 12,
        borderWidth: 1,
        borderStyle: 'dashed' as const,
        borderColor: 'rgba(249,115,22,0.25)',
        borderRadius: 12,
        marginTop: 4,
        gap: 6,
    },
    addLinkText: {
        fontFamily: 'Outfit-SemiBold',
        fontSize: 13,
        color: '#F97316',
    },
    // Step 2 styles
    tierBadge: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 100,
        alignSelf: 'flex-start' as const,
        marginBottom: 20,
    },
    tierText: {
        fontFamily: 'Outfit-SemiBold',
        fontSize: 11,
        letterSpacing: 0.5,
    },
    summaryCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    summaryTitle: {
        fontFamily: 'Outfit-SemiBold',
        fontSize: 16,
        color: '#F0ECE6',
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        paddingVertical: 6,
    },
    summaryLabel: {
        fontFamily: 'Outfit-Regular',
        fontSize: 13,
        color: '#6B6878',
    },
    summaryValue: {
        fontFamily: 'Outfit-Bold',
        fontSize: 14,
        color: '#F0ECE6',
    },
    termsToggle: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
        marginBottom: 12,
    },
    termsToggleText: {
        fontFamily: 'Outfit-Medium',
        fontSize: 14,
        color: '#6B6878',
    },
    termsBox: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
    },
    termsHeading: {
        fontFamily: 'Outfit-SemiBold',
        fontSize: 14,
        color: '#F0ECE6',
        marginBottom: 12,
    },
    termsText: {
        fontFamily: 'Outfit-Regular',
        fontSize: 13,
        color: '#6B6878',
        lineHeight: 22,
    },
    scrollHint: {
        fontFamily: 'Outfit-Medium',
        fontSize: 12,
        color: '#EAB308',
        textAlign: 'center' as const,
        marginTop: 12,
        fontStyle: 'italic' as const,
    },
    checkboxRow: {
        flexDirection: 'row' as const,
        alignItems: 'flex-start' as const,
        gap: 12,
        marginBottom: 24,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#6B6878',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginTop: 1,
    },
    checkboxChecked: {
        backgroundColor: '#F97316',
        borderColor: '#F97316',
    },
    checkboxLabel: {
        flex: 1,
        fontFamily: 'Outfit-Regular',
        fontSize: 14,
        color: '#F0ECE6',
        lineHeight: 22,
    },
    nextSteps: {
        backgroundColor: 'rgba(249,115,22,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(249,115,22,0.1)',
        borderRadius: 14,
        padding: 16,
    },
    nextStepsTitle: {
        fontFamily: 'Outfit-SemiBold',
        fontSize: 13,
        color: '#F97316',
        marginBottom: 8,
    },
    nextStepsItem: {
        fontFamily: 'Outfit-Regular',
        fontSize: 12,
        color: '#6B6878',
        lineHeight: 20,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    primaryBtn: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        gap: 8,
        paddingVertical: 16,
        borderRadius: 14,
    },
    primaryBtnText: {
        fontFamily: 'Outfit-Bold',
        fontSize: 16,
        color: '#fff',
    },
    backBtn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    backBtnText: {
        fontFamily: 'Outfit-SemiBold',
        fontSize: 14,
        color: '#6B6878',
    },
    // Plan 2, Task 17 — Save-as-draft secondary button
    secondaryBtn: {
        flex: 1,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        gap: 6,
        paddingVertical: 16,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    secondaryBtnText: {
        fontFamily: 'Outfit-SemiBold',
        fontSize: 14,
        color: '#F0ECE6',
    },
    // Phase 4C — Contract PDF preview card
    contractPreviewCard: {
        backgroundColor: '#0F0F16',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    contractPreviewHeader: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
        marginBottom: 6,
    },
    contractPreviewTitle: {
        color: '#F3EFE8',
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 18,
        letterSpacing: -0.2,
    },
    contractPreviewSubtitle: {
        color: '#B8B1A6',
        fontSize: 12,
        lineHeight: 18,
        marginBottom: 14,
    },
    contractPreviewGrid: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        marginBottom: 14,
    },
    contractPreviewCell: {
        width: '50%' as const,
        paddingVertical: 8,
    },
    contractPreviewCellLabel: {
        color: '#6B6878',
        fontSize: 9,
        fontWeight: '700' as const,
        letterSpacing: 1.5,
        textTransform: 'uppercase' as const,
    },
    contractPreviewCellValue: {
        color: '#F3EFE8',
        fontSize: 14,
        fontWeight: '700' as const,
        marginTop: 4,
    },
    contractPreviewCellSub: {
        color: '#6B6878',
        fontSize: 11,
        marginTop: 2,
    },
    contractPdfBtn: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        gap: 8,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderStyle: 'dashed' as const,
        borderColor: 'rgba(255,107,53,0.40)',
        backgroundColor: 'rgba(255,107,53,0.06)',
    },
    contractPdfBtnText: {
        color: '#FF6B35',
        fontSize: 13,
        fontWeight: '700' as const,
    },
};
