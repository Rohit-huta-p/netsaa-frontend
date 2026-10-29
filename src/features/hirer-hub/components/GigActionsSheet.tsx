// src/features/hirer-hub/components/GigActionsSheet.tsx
//
// "Manage gig" bottom sheet — the ⋯ menu from applicant-card-D.html screen 7
// ("Gig actions · the ⋯ menu"). Opened from the HubOverview ⋯ button.
//
//   Edit gig              → reopens the create form in edit mode (pre-filled)
//   Share gig             → native share of the gig link
//   Pause applications    → toggle gig.applicationsPaused (off by default) —
//                           stops NEW applications, keeps the gig live + pipeline
//   Auto-close when filled→ toggle gig.autoCloseWhenFilled (on by default) —
//                           closes the gig once every slot is hired
//   Close gig (danger)    → inline-confirm, then status -> 'closed'
//
// The two toggles mutate the gig via useUpdateGig (wired in HirerGigHub); local
// state mirrors the toggle instantly while the PATCH round-trips. "Close gig"
// uses an inline confirm (works on web + native, unlike Alert.alert) and the
// copy stays truthful — closing stops new applications; it does not currently
// notify pending applicants (left as a follow-up).

import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pencil, Share2, Pause, Check, X, ChevronRight } from 'lucide-react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878', text3: '#5C5A66',
    sheet: '#17171E', sheetLine: 'rgba(255,255,255,0.08)', divider: 'rgba(255,255,255,0.055)',
    ico: '#1C1C23', icoLine: 'rgba(255,255,255,0.09)',
    orange: '#FF6B35', red: '#F0858A', redLine: 'rgba(240,101,107,0.3)',
    knobOff: '#2A2A35', grab: '#33333F',
};

type Props = {
    visible: boolean;
    /** Slot count — drives the "at N of N hired" auto-close subtitle. */
    slotsTotal: number;
    applicationsPaused: boolean;
    autoCloseWhenFilled: boolean;
    status?: string;
    onClose: () => void;
    onEdit: () => void;
    onShare: () => void;
    onTogglePause: (next: boolean) => void;
    onToggleAutoClose: (next: boolean) => void;
    onCloseGig: () => void;
};

export function GigActionsSheet({
    visible, slotsTotal, applicationsPaused, autoCloseWhenFilled, status,
    onClose, onEdit, onShare, onTogglePause, onToggleAutoClose, onCloseGig,
}: Props) {
    const insets = useSafeAreaInsets();
    const [paused, setPaused] = useState(applicationsPaused);
    const [autoClose, setAutoClose] = useState(autoCloseWhenFilled);
    const [confirmClose, setConfirmClose] = useState(false);

    // Re-sync local toggle mirrors to the gig each time the sheet opens.
    useEffect(() => {
        if (visible) {
            setPaused(applicationsPaused);
            setAutoClose(autoCloseWhenFilled);
            setConfirmClose(false);
        }
    }, [visible, applicationsPaused, autoCloseWhenFilled]);

    if (!visible) return null;

    const togglePause = () => { const n = !paused; setPaused(n); onTogglePause(n); };
    const toggleAutoClose = () => { const n = !autoClose; setAutoClose(n); onToggleAutoClose(n); };
    const isClosed = status === 'closed';

    return (
        <Modal visible transparent animationType="slide" onRequestClose={onClose}>
            <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(5,5,8,0.55)', justifyContent: 'flex-end' }}>
                <Pressable
                    onPress={(e) => e.stopPropagation()}
                    style={{ backgroundColor: COLORS.sheet, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: COLORS.sheetLine }}>
                    <View style={{ alignSelf: 'center', width: 38, height: 4, borderRadius: 4, backgroundColor: COLORS.grab, marginTop: 10, marginBottom: 8 }} />
                    <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 17, color: COLORS.text0, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 }}>
                        Manage gig
                    </Text>

                    <MenuItem icon={Pencil} title="Edit gig" subtitle="Dates, pay, slots, description" onPress={onEdit} chevron />
                    <MenuItem icon={Share2} title="Share gig" subtitle="Send the link to artists" onPress={onShare} chevron />

                    <View style={{ height: 1, backgroundColor: COLORS.divider, marginHorizontal: 20, marginVertical: 6 }} />

                    <MenuItem icon={Pause} title="Pause applications" subtitle="No new applicants while paused" toggleOn={paused} onToggle={togglePause} />
                    <MenuItem
                        icon={Check}
                        title="Auto-close when filled"
                        subtitle={slotsTotal > 0 ? `Stop automatically at ${slotsTotal} of ${slotsTotal} hired` : 'Stop automatically once every slot is hired'}
                        toggleOn={autoClose}
                        onToggle={toggleAutoClose}
                    />

                    <View style={{ height: 1, backgroundColor: COLORS.divider, marginHorizontal: 20, marginVertical: 6 }} />

                    {isClosed ? (
                        <MenuItem icon={X} title="Gig closed" subtitle="No longer accepting applications" danger disabled />
                    ) : confirmClose ? (
                        <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
                            <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 13.5, color: COLORS.text0 }}>Close this gig?</Text>
                            <Text style={{ fontSize: 12, color: COLORS.text2, marginTop: 3, lineHeight: 17 }}>
                                It stops taking new applications. Your shortlist and hires stay.
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                                <TouchableOpacity
                                    onPress={() => setConfirmClose(false)}
                                    accessibilityLabel="Cancel closing the gig"
                                    style={{ flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: COLORS.icoLine, alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 13, color: COLORS.text1 }}>Keep open</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={onCloseGig}
                                    accessibilityLabel="Confirm close gig"
                                    style={{ flex: 1.3, height: 44, borderRadius: 12, backgroundColor: '#F0656B', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 13, color: '#160A04' }}>Close gig</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <MenuItem icon={X} title="Close gig" subtitle="No longer accepting applications" danger onPress={() => setConfirmClose(true)} />
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

function MenuItem({
    icon: Icon, title, subtitle, onPress, chevron, toggleOn, onToggle, danger, disabled,
}: {
    icon: any; title: string; subtitle: string;
    onPress?: () => void; chevron?: boolean;
    toggleOn?: boolean; onToggle?: () => void;
    danger?: boolean; disabled?: boolean;
}) {
    const isToggle = typeof toggleOn === 'boolean';
    const press = isToggle ? onToggle : onPress;
    const accent = danger ? COLORS.red : COLORS.orange;
    return (
        <TouchableOpacity
            onPress={press}
            disabled={disabled}
            activeOpacity={0.7}
            accessibilityLabel={title}
            accessibilityRole={isToggle ? 'switch' : 'button'}
            accessibilityState={isToggle ? { checked: !!toggleOn } : undefined}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 13, opacity: disabled ? 0.5 : 1 }}>
            <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: COLORS.ico, borderWidth: 1, borderColor: danger ? COLORS.redLine : COLORS.icoLine, alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={accent} strokeWidth={1.9} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 14, color: danger ? '#F0858A' : COLORS.text0 }}>{title}</Text>
                <Text style={{ fontSize: 11.5, color: COLORS.text2, marginTop: 1 }}>{subtitle}</Text>
            </View>
            {isToggle ? (
                <Toggle on={!!toggleOn} />
            ) : chevron ? (
                <ChevronRight size={16} color={COLORS.text3} strokeWidth={1.8} />
            ) : null}
        </TouchableOpacity>
    );
}

// Custom pill toggle matching the mockup .sw / .sw.on (RN Switch styles
// inconsistently across web + native; this keeps it on-brand everywhere).
function Toggle({ on }: { on: boolean }) {
    return (
        <View style={{ width: 42, height: 24, borderRadius: 999, backgroundColor: on ? COLORS.orange : COLORS.knobOff, justifyContent: 'center' }}>
            <View style={{ position: 'absolute', top: 2, left: on ? 20 : 2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' }} />
        </View>
    );
}
