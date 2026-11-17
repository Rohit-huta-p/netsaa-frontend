// src/features/hirer-hub/components/ApplicantProfileModal.tsx
//
// Applicant profile modal — the in-place triage view that replaces the old
// "Applicant detail · opened" screen. Tapping a card's name / avatar / View
// profile icon opens the artist's profile as a solid card floating over the
// blurred hub, with a stage-aware decision bar. Swipe / chevrons page between
// applicants in the (frozen) stage list.
// Design: DOCS/04-design/mockups/manage-gig.html + applicant-profile-modal-PLAN.md
//
// WHOLE-CARD PAGING: the horizontal pager (a paged FlatList — web + native, the
// MediaViewer approach) IS the card layer. Each page is a COMPLETE card (its own
// ✕ header, scrollable body, pitch strip and decision bar), so the whole card
// slides as a unit when you move to the next applicant — not just the content
// inside a frozen frame. The side chevrons, the "N / total" counter and the
// blurred backdrop are the fixed chrome you swipe cards past. Each card's bar +
// pitch read THAT applicant (status / coverNote), so every card is self-contained.
//
// The applicant list is FROZEN at open (the hub snapshots it), so Pass/Shortlist
// mutations can't reindex the pager or drift the counter; the live list resumes
// on close. Pass/Shortlist auto-advance; Hire/Remove/Message and "Open full
// profile" close the modal so the hub can open its confirm sheet (no nested Modal).
//
// Gestures + haptics: drag a card's header (grabber) down to dismiss — the whole
// card slides down (the pager sits in an Animated wrapper that translates, so the
// drag isn't clipped) and the backdrop fades; failOffsetX lets a horizontal drag
// page instead. Haptics on open, page change and every decision. A Modal is its
// own view tree, so gestures inside need their own GestureHandlerRootView.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, FlatList, Modal, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, runOnJS, interpolate, Extrapolation } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { X, ChevronLeft, ChevronRight, Check, MessageSquare } from 'lucide-react-native';
import { useUiStore } from '@/stores/uiStore';
import { ApplicantProfileBody } from './ApplicantProfileBody';

const C = {
    card: '#16161D', tint: 'rgba(10,10,14,0.55)',
    t1: '#FFFFFF', t2: '#D4D4D8', t3: '#A1A1AA', t4: '#8B8B99', t5: '#5C5C66',
    orange: '#FF6B35', orangeTint: '#FFCBB2', onOrange: '#160A04', red: '#F0858A',
    passBorder: '#2E2E38', grabber: 'rgba(255,255,255,0.22)',
};

const GUT_H = 24;   // side gutter (chevrons live here)
const GUT_V = 54;   // top/bottom gutter (counter lives in the bottom one)
const HEADER_H = 50;
const BAR_H = 72;
const DISMISS_DISTANCE = 120;   // drag past this (or fling) to close
const DISMISS_VELOCITY = 850;

const statusOf = (a: any): string => (a?.status ?? 'applied');
const tap = () => { Haptics.selectionAsync().catch(() => {}); };
const bump = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };

type Props = {
    /** Frozen at open by the hub — the stage's applicant list. length 1 = single-item (Discussion). */
    applications: any[];
    initialIndex: number;
    venueCity?: string;
    /** Close; reports the last-viewed application id (for the hub's close-pulse in PR3). */
    onClose: (viewedApplicationId?: string) => void;
    onPass: (applicationId: string) => void;
    onShortlist: (applicationId: string) => void;
    onHire: (applicationId: string) => void;
    onMessage: (applicationId: string) => void;
    onRemove: (applicationId: string) => void;
    onOpenFullProfile: (artistId: string) => void;
};

export function ApplicantProfileModal({
    applications, initialIndex, venueCity,
    onClose, onPass, onShortlist, onHire, onMessage, onRemove, onOpenFullProfile,
}: Props) {
    const insets = useSafeAreaInsets();
    const { width: winW, height: winH } = useWindowDimensions();
    const pagerRef = useRef<FlatList>(null);
    const [cur, setCur] = useState(initialIndex);

    const multi = applications.length > 1;

    // Hide the global bottom nav + a light haptic while open (matches MediaViewer).
    useEffect(() => {
        const { pushFullscreenOverlay, popFullscreenOverlay } = useUiStore.getState();
        pushFullscreenOverlay();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        return () => popFullscreenOverlay();
    }, []);

    // Card geometry — a centred window (the pager) with gutters for the chevrons
    // and counter; each page fills the window with a full card.
    const cardLeft = GUT_H;
    const cardW = Math.max(200, winW - GUT_H * 2);
    const cardTop = insets.top + GUT_V;
    const cardH = Math.max(320, winH - insets.top - insets.bottom - GUT_V * 2);

    // Reserve the pitch band iff some applicant has a note, so every card is the
    // same height and the pager snaps cleanly.
    const anyPitch = useMemo(
        () => applications.some((a) => (a?.coverNote ?? '').trim().length > 0),
        [applications]
    );
    const PITCH_H = anyPitch ? 70 : 0;
    const listH = Math.max(160, cardH - HEADER_H - PITCH_H - BAR_H);

    // Pages span the full screen (so the side gutters read as a gap between
    // cards while they slide); the card is centred within each page.
    const syncIndex = useCallback((x: number) => {
        const i = Math.round(x / winW);
        setCur((c) => {
            if (i !== c && i >= 0 && i < applications.length) { tap(); return i; }
            return c;
        });
    }, [winW, applications.length]);

    const goTo = useCallback((i: number) => {
        if (i < 0 || i >= applications.length) return;
        try { pagerRef.current?.scrollToIndex({ index: i, animated: true }); } catch { /* no layout yet */ }
        setCur((c) => (i !== c ? (tap(), i) : c));
    }, [applications.length]);

    // Pass / Shortlist keep the card in the frozen list, so advancing is safe;
    // the last one closes the run.
    const advanceFrom = useCallback((i: number) => {
        if (i < applications.length - 1) goTo(i + 1);
        else onClose(applications[i]?._id);
    }, [applications, goTo, onClose]);

    // ── Drag-to-dismiss: the pager lives in this Animated wrapper, so a header
    // drag slides the WHOLE card down without the pager clipping it. ──
    const dragY = useSharedValue(0);
    const wrapperAnimStyle = useAnimatedStyle(() => ({ transform: [{ translateY: dragY.value }] }));
    const backdropAnimStyle = useAnimatedStyle(() => ({
        opacity: interpolate(dragY.value, [0, cardH], [1, 0.35], Extrapolation.CLAMP),
    }));
    const buildDismiss = (item: any) => Gesture.Pan()
        .failOffsetX([-20, 20])
        .activeOffsetY(8)
        .onUpdate((e) => { dragY.value = Math.max(0, e.translationY); })
        .onEnd((e) => {
            if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY) {
                dragY.value = withTiming(winH, { duration: 190 }, (fin) => { if (fin) runOnJS(onClose)(item?._id); });
            } else {
                dragY.value = withSpring(0, { damping: 20, stiffness: 220 });
            }
        });

    if (!applications.length) return null;

    const renderCard = ({ item, index }: { item: any; index: number }) => {
        const st = statusOf(item);
        const pitchText = (item?.coverNote ?? '').trim();
        const onPassA = () => { bump(); onPass(item._id); advanceFrom(index); };
        const onShortlistA = () => { bump(); onShortlist(item._id); advanceFrom(index); };
        const onHireA = () => { bump(); onHire(item._id); };
        const onMessageA = () => { bump(); onMessage(item._id); };
        const onRemoveA = () => { bump(); onRemove(item._id); };

        return (
            <View style={{ width: winW, height: winH }}>
                {/* tap the page's gutter (outside the card) to close */}
                <Pressable style={StyleSheet.absoluteFill} onPress={() => onClose(item?._id)} accessibilityLabel="Close profile" />
                <View testID={String(item?._id ?? index)} style={{ position: 'absolute', left: cardLeft, top: cardTop, width: cardW, height: cardH, borderRadius: 24, backgroundColor: C.card, overflow: 'hidden' }}>
                {/* header — grabber + ✕ (right); this strip is the drag-to-dismiss zone */}
                <GestureDetector gesture={buildDismiss(item)}>
                    <View style={{ height: HEADER_H, justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 14 }}>
                        <View style={{ position: 'absolute', top: 7, left: 0, right: 0, alignItems: 'center' }}>
                            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.grabber }} />
                        </View>
                        <Pressable
                            onPress={() => onClose(item?._id)}
                            hitSlop={10}
                            accessibilityLabel="Close"
                            style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' }}>
                            <X size={16} color={C.t2} strokeWidth={2} />
                        </Pressable>
                    </View>
                </GestureDetector>

                {/* profile body — scrolls within the card */}
                <View style={{ height: listH }}>
                    <ApplicantProfileBody
                        application={item}
                        venueCity={venueCity}
                        width={cardW}
                        onOpenFullProfile={(artistId) => onOpenFullProfile(artistId)}
                    />
                </View>

                {/* pitch strip — this applicant's note, pinned above the bar */}
                {PITCH_H > 0 ? (
                    pitchText ? (
                        <View style={{ height: PITCH_H, justifyContent: 'center', paddingVertical: 10, paddingLeft: 18, paddingRight: 16, marginHorizontal: 16, borderLeftWidth: 2, borderLeftColor: C.orange, backgroundColor: 'rgba(255,107,53,0.06)', borderTopRightRadius: 12, borderBottomRightRadius: 12 }}>
                            <Text numberOfLines={2} style={{ fontSize: 12.5, lineHeight: 18, color: C.t2 }}>
                                <Text style={{ color: C.orangeTint }}>“</Text>{pitchText}<Text style={{ color: C.orangeTint }}>”</Text>
                            </Text>
                        </View>
                    ) : (
                        <View style={{ height: PITCH_H }} />
                    )
                ) : null}

                {/* decision bar — stage-aware, this applicant's status */}
                <View style={{ height: BAR_H, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 16, paddingBottom: 8 }}>
                    {st === 'hired' ? (
                        <>
                            <GhostBtn flex={1} label="Message" icon={MessageSquare} tint={C.t2} border={C.passBorder} onPress={onMessageA} />
                            <GhostBtn flex={1.3} label="Remove" icon={X} tint={C.red} border="rgba(240,101,107,0.3)" onPress={onRemoveA} />
                        </>
                    ) : st === 'rejected' ? (
                        <GhostBtn flex={1} label="Message" icon={MessageSquare} tint={C.t2} border={C.passBorder} onPress={onMessageA} />
                    ) : st === 'shortlisted' ? (
                        <>
                            <GhostBtn flex={1} label="Pass" icon={X} tint={C.t2} border={C.passBorder} onPress={onPassA} />
                            <PrimaryBtn flex={1.4} label="Hire" icon={Check} onPress={onHireA} />
                        </>
                    ) : (
                        <>
                            <GhostBtn flex={1} label="Pass" icon={X} tint={C.t2} border={C.passBorder} onPress={onPassA} />
                            <PrimaryBtn flex={1.4} label="Shortlist" onPress={onShortlistA} />
                        </>
                    )}
                </View>
                </View>
            </View>
        );
    };

    return (
        <Modal visible transparent statusBarTranslucent animationType="fade" onRequestClose={() => onClose(applications[cur]?._id)}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={StyleSheet.absoluteFill}>
                    <BlurView intensity={34} tint="dark" style={StyleSheet.absoluteFill} experimentalBlurMethod="dimezisBlurView">
                        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: C.tint }, backdropAnimStyle]} />
                    </BlurView>

                    {/* the pager spans the screen and each page centres a card with
                        gutters, so a clear gap shows between cards as they slide; the
                        wrapper translates for drag-to-dismiss. Each page carries its own
                        gutter tap-to-close. */}
                    <Animated.View style={[StyleSheet.absoluteFill, wrapperAnimStyle]}>
                        <FlatList
                            ref={pagerRef}
                            style={StyleSheet.absoluteFill}
                            data={applications}
                            horizontal
                            pagingEnabled
                            initialScrollIndex={initialIndex}
                            getItemLayout={(_, i) => ({ length: winW, offset: winW * i, index: i })}
                            onScrollToIndexFailed={() => {}}
                            onScroll={(e) => syncIndex(e.nativeEvent.contentOffset.x)}
                            scrollEventThrottle={16}
                            onMomentumScrollEnd={(e) => syncIndex(e.nativeEvent.contentOffset.x)}
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(it, i) => String(it?._id ?? i)}
                            scrollEnabled={multi}
                            renderItem={renderCard}
                        />
                    </Animated.View>

                    {/* side chevrons — fixed chrome, in the gutters, vertically centred */}
                    {multi ? (
                        <>
                            <SideChevron side="left" disabled={cur === 0} top={cardTop + cardH / 2 - 18} onPress={() => goTo(cur - 1)} />
                            <SideChevron side="right" disabled={cur === applications.length - 1} top={cardTop + cardH / 2 - 18} onPress={() => goTo(cur + 1)} />
                        </>
                    ) : null}

                    {/* floating page counter — fixed chrome, in the bottom gutter */}
                    {multi ? (
                        <View
                            pointerEvents="none"
                            style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
                            {applications.length <= 10 ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    {applications.map((_, i) => (
                                        <View key={i} style={{ width: i === cur ? 7 : 5, height: i === cur ? 7 : 5, borderRadius: 4, backgroundColor: i === cur ? C.orange : 'rgba(255,255,255,0.3)' }} />
                                    ))}
                                </View>
                            ) : null}
                            <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.6)' }}>
                                {cur + 1} / {applications.length}
                            </Text>
                        </View>
                    ) : null}
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
}

function SideChevron({ side, top, disabled, onPress }: { side: 'left' | 'right'; top: number; disabled?: boolean; onPress: () => void }) {
    const Icon = side === 'left' ? ChevronLeft : ChevronRight;
    return (
        <Pressable
            onPress={disabled ? undefined : onPress}
            hitSlop={10}
            accessibilityLabel={side === 'left' ? 'Previous applicant' : 'Next applicant'}
            accessibilityState={{ disabled: !!disabled }}
            style={{
                position: 'absolute', top, [side]: Math.max(2, (GUT_H - 24) / 2), width: 24, height: 36,
                alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.25 : 1,
            }}>
            <Icon size={20} color="rgba(255,255,255,0.7)" strokeWidth={2.4} />
        </Pressable>
    );
}

function PrimaryBtn({ flex, label, icon: Icon, onPress }: { flex: number; label: string; icon?: any; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityLabel={label}
            style={{ flex, height: 46, borderRadius: 12, backgroundColor: C.orange, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            {Icon ? <Icon size={15} color={C.onOrange} strokeWidth={2.4} /> : null}
            <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 13.5, color: C.onOrange }}>{label}</Text>
        </Pressable>
    );
}

function GhostBtn({ flex, label, icon: Icon, tint, border, onPress }: { flex: number; label: string; icon?: any; tint: string; border: string; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityLabel={label}
            style={{ flex, height: 46, borderRadius: 12, borderWidth: 1, borderColor: border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            {Icon ? <Icon size={15} color={tint} strokeWidth={2.2} /> : null}
            <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 13.5, color: tint }}>{label}</Text>
        </Pressable>
    );
}
