import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, Modal, TextInput, TouchableOpacity, Pressable, ScrollView,
    Alert, ActivityIndicator, Animated, PanResponder, StyleSheet,
} from 'react-native';
import { useApplyToGig } from '../../hooks/useGigApplications';
import { useEventFunnelSource } from '../../hooks/useEventFunnelSource';
import { X, Link as LinkIcon, Plus, Trash2, Check, Lock, ChevronDown, ArrowRight, Save } from 'lucide-react-native';
import { ProfileInterviewSheet, enrichMissing } from '@/components/profile/completion';
import { draftService, generateDraftId, type ApplicationDraft } from '../../services/draftService';
import { C, F } from './detail/ui';

/**
 * Gig Application — "make your case" sheet (V2 · Conversational).
 *
 * A single-screen bottom sheet, on the A·Minimal gig-detail system. The note
 * is the hero (addressed to the hirer), with portfolio + proposed-rate folded
 * into optional collapsible rows. The old two-step tiered CONTRACT CEREMONY
 * (Quick/Standard/Premium agreement keyed off the pay amount) is gone — we
 * disabled contracts, and pay is a fact, not the organizing principle of the
 * apply flow. `termsAcknowledged: true` is still sent silently so the API
 * contract holds while the (off-machine) gigs service is unverified.
 *
 * Kept: save-as-draft, the inline profile-completeness gate, `?from=event`
 * source tracking, and the inline success panel.
 */

interface GigApplyModalProps {
    visible: boolean;
    onClose: () => void;
    gigId: string;
    gigTitle: string;
    gigAmount?: number;
    isNegotiable?: boolean;
    termsAndConditions?: string;
    /** Full gig object — used here only to personalise ("to {hirer}"). */
    gig?: any;
    /** Closes the sheet and flips the detail to its Details tab (full T&C). */
    onViewTerms?: () => void;
    hasTerms?: boolean;
    /**
     * If present, the modal loads the draft via draftService.get() and
     * prefills the form. Save-as-draft reuses the same id so the round-trip
     * is stable.
     */
    draftId?: string;
}

const SHEET = '#17171D'; // one step above --canvas (#121216); wells sit above this

const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

const PROMPTS = [
    { key: 'fit', label: 'Why I fit', stub: "Why I'm a fit: " },
    { key: 'exp', label: 'My experience', stub: 'My experience: ' },
    { key: 'avail', label: 'Availability', stub: 'My availability: ' },
];

export const GigApplyModal: React.FC<GigApplyModalProps> = ({
    visible, onClose, gigId, gigTitle,
    gigAmount = 0, isNegotiable = false,
    termsAndConditions, gig, onViewTerms,
    draftId,
}) => {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [note, setNote] = useState('');
    const [portfolioLinks, setPortfolioLinks] = useState<string[]>(['']);
    const [proposedRate, setProposedRate] = useState('');
    const [portfolioOpen, setPortfolioOpen] = useState(false);
    const [rateOpen, setRateOpen] = useState(false);
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [profileModalData, setProfileModalData] = useState<{ score: number; missing: string[] }>({ score: 0, missing: [] });

    const applyMutation = useApplyToGig();
    // Reads ?from=event:<id> when the artist enters from an event context;
    // forwarded to gigApplication.source (absent => organic/direct).
    const funnelSource = useEventFunnelSource();

    // Personalisation. Prefer the person's name, fall back to the brand.
    const hirerRaw = (gig?.organizerSnapshot?.displayName || gig?.organizerSnapshot?.organizationName || '').trim();
    const hirerFirst = hirerRaw ? hirerRaw.split(/\s+/)[0] : '';
    const submitLabel = hirerFirst ? `Send to ${hirerFirst}` : 'Send application';

    const hirerTerms = (termsAndConditions ?? '').trim();
    const hasHirerTerms = hirerTerms.length > 0;

    const filledLinks = portfolioLinks.filter((l) => l.trim() !== '');

    // ── draft prefill + save-as-draft ──
    const prefilledDraftRef = useRef<string | null>(null);
    const [activeDraftId, setActiveDraftId] = useState<string | null>(draftId ?? null);
    const [savingDraft, setSavingDraft] = useState(false);

    useEffect(() => {
        if (!visible) return;
        if (!draftId) return;
        if (prefilledDraftRef.current === draftId) return;
        prefilledDraftRef.current = draftId;
        setActiveDraftId(draftId);
        draftService
            .get(draftId)
            .then((d) => {
                if (!d) return;
                if (typeof d.pitch === 'string') setNote(d.pitch);
                if (typeof d.quotedRate === 'number') {
                    setProposedRate(String(d.quotedRate));
                    setRateOpen(true);
                }
            })
            .catch((err) => console.warn('[GigApplyModal] Draft load failed:', err));
    }, [visible, draftId]);

    // ── drag-to-dismiss (grabber/header only; keeps the scroll body free) ──
    const dragY = useRef(new Animated.Value(0)).current;
    const closeRef = useRef<() => void>(() => {});
    const pan = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_e, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
            onPanResponderMove: (_e, g) => { if (g.dy > 0) dragY.setValue(g.dy); },
            onPanResponderRelease: (_e, g) => {
                if (g.dy > 120 || g.vy > 1.2) closeRef.current();
                else Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
            },
            onPanResponderTerminate: () => Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start(),
        })
    ).current;

    useEffect(() => { if (visible) dragY.setValue(0); }, [visible, dragY]);

    const resetAndClose = () => {
        setNote('');
        setPortfolioLinks(['']);
        setProposedRate('');
        setPortfolioOpen(false);
        setRateOpen(false);
        setStep('form');
        prefilledDraftRef.current = null;
        setActiveDraftId(null);
        dragY.setValue(0);
        onClose();
    };
    closeRef.current = resetAndClose;

    const handleSaveDraft = async () => {
        if (savingDraft) return;
        setSavingDraft(true);
        try {
            const id = activeDraftId ?? generateDraftId();
            const draft: ApplicationDraft = {
                draftId: id,
                gigId,
                gigTitle,
                pitch: note,
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

    const addPrompt = (stub: string) =>
        setNote((prev) => {
            if (prev.includes(stub.trim())) return prev;
            const base = prev.replace(/\s+$/, '');
            return base ? `${base}\n${stub}` : stub;
        });

    const handleLinkChange = (text: string, index: number) => {
        const updated = [...portfolioLinks];
        updated[index] = text;
        setPortfolioLinks(updated);
    };
    const addLinkField = () => setPortfolioLinks([...portfolioLinks, '']);
    const removeLinkField = (index: number) => {
        const updated = [...portfolioLinks];
        updated.splice(index, 1);
        setPortfolioLinks(updated.length ? updated : ['']);
    };

    const handleSubmit = () => {
        const validLinks = portfolioLinks.filter((l) => l.trim() !== '');
        applyMutation.mutate(
            {
                gigId,
                payload: {
                    coverNote: note.trim(),
                    portfolioLinks: validLinks,
                    proposedRate: proposedRate ? parseInt(proposedRate, 10) : undefined,
                    // Platform terms — kept so the API body stays valid while the
                    // tiered contract ceremony is retired and contracts are off.
                    termsAcknowledged: true,
                    source: funnelSource,
                },
            },
            {
                onSuccess: () => setStep('success'),
                onError: (error: any) => {
                    const meta = error.response?.data?.meta;
                    if (meta?.message === 'PROFILE_INCOMPLETE') {
                        setProfileModalData({ score: meta.score ?? 0, missing: meta.missing ?? [] });
                        setProfileModalVisible(true);
                        return;
                    }
                    Alert.alert('Error', meta?.message || 'Failed to submit application');
                },
            }
        );
    };

    // Auto-close 3.5s after the success panel mounts; "Done" closes sooner.
    useEffect(() => {
        if (step !== 'success') return;
        const t = setTimeout(() => resetAndClose(), 3500);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    return (
        <>
            <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={resetAndClose}>
                <View style={styles.overlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={resetAndClose} accessibilityRole="button" accessibilityLabel="Close" />

                    <Animated.View style={[styles.sheet, { transform: [{ translateY: dragY }] }]}>
                        {/* grabber + header share the drag handle */}
                        <View {...pan.panHandlers}>
                            <View style={styles.grab} />
                            {step === 'form' && (
                                <View style={styles.header}>
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                        <Text style={styles.hTitle}>Introduce yourself</Text>
                                        <Text style={styles.hSub} numberOfLines={1}>
                                            {hirerFirst ? `to ${hirerFirst} · ${gigTitle}` : gigTitle}
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={resetAndClose} style={styles.closeBtn} accessibilityLabel="Close">
                                        <X size={18} color={C.t3} />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {step === 'success' ? (
                            <View testID="apply-success-panel" style={styles.okWrap}>
                                <View style={styles.okRing}>
                                    <Check size={34} color={C.green} strokeWidth={2.6} />
                                </View>
                                <Text style={styles.okTitle}>Application sent</Text>
                                <Text style={styles.okBody}>
                                    {hirerFirst || 'The hirer'} will review it and you'll be notified the moment they respond. Pick it up anytime in your chats.
                                </Text>
                                <TouchableOpacity testID="apply-success-done" onPress={resetAndClose} activeOpacity={0.85} style={styles.okBtn}>
                                    <Text style={styles.okBtnTxt}>Done</Text>
                                </TouchableOpacity>
                                <Text style={styles.okAuto}>Closing automatically…</Text>
                            </View>
                        ) : (
                            <>
                                <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 22 }} keyboardShouldPersistTaps="handled">
                                    <Text style={styles.intro}>
                                        Tell {hirerFirst || 'the hirer'} why this gig is for you. They already see your full profile — this is your opening line.
                                    </Text>

                                    <TextInput
                                        multiline
                                        textAlignVertical="top"
                                        placeholder="I've performed at 50+ sangeet nights and I love building a set around the couple's story…"
                                        placeholderTextColor={C.t5}
                                        style={styles.note}
                                        value={note}
                                        onChangeText={setNote}
                                    />
                                    <View style={styles.promptRow}>
                                        {PROMPTS.map((p) => (
                                            <TouchableOpacity key={p.key} onPress={() => addPrompt(p.stub)} style={styles.pchip} activeOpacity={0.7}>
                                                <Plus size={11} color={C.orange} />
                                                <Text style={styles.pchipTxt}>{p.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Portfolio — optional, collapsed */}
                                    <TouchableOpacity style={styles.optrow} onPress={() => setPortfolioOpen((o) => !o)} activeOpacity={0.8}>
                                        <View style={styles.optIcon}><LinkIcon size={15} color={C.t3} /></View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.optTitle}>Portfolio links</Text>
                                            <Text style={styles.optHint}>
                                                {filledLinks.length > 0
                                                    ? `${filledLinks.length} added · tap to ${portfolioOpen ? 'hide' : 'manage'}`
                                                    : `Add links · tap to ${portfolioOpen ? 'hide' : 'add'}`}
                                            </Text>
                                        </View>
                                        <View style={{ transform: [{ rotate: portfolioOpen ? '180deg' : '0deg' }] }}>
                                            <ChevronDown size={18} color={C.t5} />
                                        </View>
                                    </TouchableOpacity>
                                    {portfolioOpen && (
                                        <View style={{ marginTop: 10 }}>
                                            {portfolioLinks.map((link, i) => (
                                                <View key={i} style={styles.linkRow}>
                                                    <LinkIcon size={14} color={C.t4} />
                                                    <TextInput
                                                        placeholder="https://…"
                                                        placeholderTextColor={C.t5}
                                                        style={styles.linkField}
                                                        value={link}
                                                        onChangeText={(t) => handleLinkChange(t, i)}
                                                        autoCapitalize="none"
                                                        keyboardType="url"
                                                    />
                                                    {portfolioLinks.length > 1 && (
                                                        <TouchableOpacity onPress={() => removeLinkField(i)} hitSlop={8}>
                                                            <Trash2 size={15} color={C.t5} />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            ))}
                                            <TouchableOpacity onPress={addLinkField} style={styles.addLink} activeOpacity={0.8}>
                                                <Plus size={13} color={C.orange} />
                                                <Text style={styles.addLinkTxt}>Add another link</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {/* Proposed rate — only when the gig is negotiable */}
                                    {isNegotiable && (
                                        <>
                                            <TouchableOpacity style={styles.optrow} onPress={() => setRateOpen((o) => !o)} activeOpacity={0.8}>
                                                <View style={styles.optIcon}><Text style={styles.rupee}>₹</Text></View>
                                                <View style={{ flex: 1 }}>
                                                    <View style={styles.optTitleRow}>
                                                        <Text style={styles.optTitle}>Suggest a rate</Text>
                                                        <Text style={styles.negTag}>NEGOTIABLE</Text>
                                                    </View>
                                                    <Text style={styles.optHint}>
                                                        {gigAmount > 0 ? `Listed ${money(gigAmount)} / performer` : 'Rate is open'}
                                                        {proposedRate ? ` · you: ${money(parseInt(proposedRate, 10) || 0)}` : ''}
                                                    </Text>
                                                </View>
                                                <View style={{ transform: [{ rotate: rateOpen ? '180deg' : '0deg' }] }}>
                                                    <ChevronDown size={18} color={C.t5} />
                                                </View>
                                            </TouchableOpacity>
                                            {rateOpen && (
                                                <View style={styles.rateWell}>
                                                    <Text style={styles.rupeeBig}>₹</Text>
                                                    <TextInput
                                                        placeholder={gigAmount > 0 ? gigAmount.toLocaleString('en-IN') : 'Your rate'}
                                                        placeholderTextColor={C.t5}
                                                        style={styles.rateField}
                                                        keyboardType="numeric"
                                                        value={proposedRate}
                                                        onChangeText={setProposedRate}
                                                    />
                                                    <Text style={styles.rateUnit}>/ performer</Text>
                                                </View>
                                            )}
                                        </>
                                    )}

                                    {/* Platform terms — one quiet line, no ceremony */}
                                    <View style={styles.terms}>
                                        <Lock size={13} color={C.t5} />
                                        <Text style={styles.termsTxt}>
                                            By applying you agree to NETSA's <Text style={styles.termsLink}>platform terms</Text>.
                                        </Text>
                                    </View>
                                    {hasHirerTerms && (
                                        <TouchableOpacity onPress={() => { resetAndClose(); onViewTerms?.(); }} activeOpacity={0.7}>
                                            <Text style={styles.termsMore}>This gig also lists its own terms — see Details.</Text>
                                        </TouchableOpacity>
                                    )}
                                </ScrollView>

                                <View style={styles.footer}>
                                    <TouchableOpacity
                                        onPress={handleSaveDraft}
                                        disabled={savingDraft}
                                        style={styles.ghostBtn}
                                        accessibilityRole="button"
                                        accessibilityLabel="Save as draft"
                                        testID="apply-save-draft-btn"
                                    >
                                        {savingDraft ? (
                                            <ActivityIndicator size="small" color={C.t2} />
                                        ) : (
                                            <>
                                                <Save size={15} color={C.t2} />
                                                <Text style={styles.ghostTxt}>Save draft</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleSubmit}
                                        disabled={applyMutation.isPending}
                                        style={styles.sendBtn}
                                        activeOpacity={0.9}
                                        testID="apply-submit-btn"
                                    >
                                        {applyMutation.isPending ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <>
                                                <Text style={styles.sendTxt}>{submitLabel}</Text>
                                                <ArrowRight size={16} color="#fff" />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </Animated.View>
                </View>
            </Modal>

            <ProfileInterviewSheet
                visible={profileModalVisible}
                fields={enrichMissing(profileModalData.missing)}
                onClose={() => setProfileModalVisible(false)}
                onComplete={() => {
                    setProfileModalVisible(false);
                    handleSubmit(); // re-run the same apply mutation; user stays in-flow
                }}
            />
        </>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.62)' },
    sheet: {
        backgroundColor: SHEET,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        maxHeight: '92%',
        borderTopWidth: 1,
        borderColor: C.hair,
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 40,
        shadowOffset: { width: 0, height: -16 },
    },
    grab: { width: 38, height: 4, borderRadius: 999, backgroundColor: C.wellb, alignSelf: 'center', marginTop: 10, marginBottom: 2 },
    header: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14,
        borderBottomWidth: 1, borderBottomColor: C.hair,
    },
    hTitle: { fontFamily: F.bold, fontSize: 19, color: C.t1, letterSpacing: -0.3 },
    hSub: { fontFamily: F.reg, fontSize: 12.5, color: C.t4, marginTop: 3 },
    closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.hair, alignItems: 'center', justifyContent: 'center' },

    body: { paddingHorizontal: 20, paddingTop: 14 },
    intro: { fontFamily: F.reg, fontSize: 13.5, lineHeight: 20, color: C.t3 },
    note: {
        marginTop: 14, backgroundColor: C.well, borderWidth: 1, borderColor: C.wellb,
        borderRadius: 14, padding: 14, color: C.t1, fontFamily: F.reg, fontSize: 14,
        lineHeight: 20, minHeight: 150, textAlignVertical: 'top',
    },
    promptRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 11 },
    pchip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.chip, borderWidth: 1, borderColor: C.chipb, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
    pchipTxt: { fontFamily: F.med, fontSize: 12, color: C.t3 },

    optrow: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: C.well, borderWidth: 1, borderColor: C.wellb, borderRadius: 13, padding: 13, marginTop: 14 },
    optIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.chip, borderWidth: 1, borderColor: C.chipb, alignItems: 'center', justifyContent: 'center' },
    optTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    optTitle: { fontFamily: F.semi, fontSize: 13.5, color: C.t2 },
    optHint: { fontFamily: F.reg, fontSize: 11.5, color: C.t5, marginTop: 2 },
    negTag: { fontFamily: F.semi, fontSize: 8, letterSpacing: 0.6, color: C.amber, borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)', backgroundColor: 'rgba(251,191,36,0.08)', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, overflow: 'hidden' },
    rupee: { fontFamily: F.bold, fontSize: 15, color: C.t3 },

    linkRow: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: C.well, borderWidth: 1, borderColor: C.wellb, borderRadius: 12, paddingHorizontal: 12, height: 44, marginBottom: 9 },
    linkField: { flex: 1, fontFamily: F.reg, fontSize: 13, color: C.t1 },
    addLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 44, borderWidth: 1, borderStyle: 'dashed', borderColor: C.orangeBorder, borderRadius: 12, backgroundColor: C.orangeSoft },
    addLinkTxt: { fontFamily: F.semi, fontSize: 13, color: C.orange },

    rateWell: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.well, borderWidth: 1, borderColor: C.wellb, borderRadius: 13, paddingHorizontal: 14, height: 52, marginTop: 10 },
    rupeeBig: { fontFamily: F.bold, fontSize: 18, color: C.t2 },
    rateField: { flex: 1, fontFamily: F.semi, fontSize: 17, color: C.t1 },
    rateUnit: { fontFamily: F.reg, fontSize: 12, color: C.t5 },

    terms: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
    termsTxt: { flex: 1, fontFamily: F.reg, fontSize: 11.5, lineHeight: 17, color: C.t4 },
    termsLink: { fontFamily: F.semi, color: C.orange },
    termsMore: { fontFamily: F.reg, fontSize: 11.5, color: C.t5, marginTop: 8, marginLeft: 21 },

    footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18, borderTopWidth: 1, borderTopColor: C.hair, backgroundColor: SHEET },
    ghostBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 52, borderRadius: 15, borderWidth: 1, borderColor: C.wellb, backgroundColor: C.well },
    ghostTxt: { fontFamily: F.semi, fontSize: 13.5, color: C.t2 },
    sendBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, height: 52, borderRadius: 15, backgroundColor: C.orange, shadowColor: C.orange, shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
    sendTxt: { fontFamily: F.bold, fontSize: 15, letterSpacing: 0.3, color: '#fff' },

    okWrap: { alignItems: 'center', paddingHorizontal: 30, paddingTop: 14, paddingBottom: 40 },
    okRing: { width: 74, height: 74, borderRadius: 37, backgroundColor: C.greenSoft, borderWidth: 1, borderColor: C.greenBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
    okTitle: { fontFamily: F.bold, fontSize: 19, color: C.t1, marginBottom: 9 },
    okBody: { fontFamily: F.reg, fontSize: 13, lineHeight: 20, color: C.t4, textAlign: 'center', marginBottom: 24 },
    okBtn: { backgroundColor: C.orange, borderRadius: 13, paddingVertical: 14, paddingHorizontal: 44 },
    okBtnTxt: { fontFamily: F.bold, fontSize: 14, color: '#fff' },
    okAuto: { fontFamily: F.reg, fontSize: 11, color: C.t5, marginTop: 15 },
});
