// src/features/hirer-hub/components/RemoveHireSheet.tsx
//
// Remove-hire confirm sheet — "Remove · what changes" (DOCS/04-design/mockups/
// applicant-card-D.html). Revoking a hire is a reversible CASCADE, not a delete:
// the slot reopens, counts update, and the artist drops back to the shortlist
// (never rejected). This sheet spells out exactly what happens before the owner
// commits. On confirm it fires status `hired -> shortlisted` (netsaa-backend
// B3), which recomputes the hire count, reopens a gig that had closed when it
// filled, and notifies the artist their booking was withdrawn.
//
// Payments are 0% built, so there is no refund/reversal today — the sheet says
// so plainly (the "No payment impact" row).

import React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { X, Plus, Undo2, Bell } from 'lucide-react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878', text3: '#3F3D4A',
    bg0: '#07070B', bg2: '#16161F',
    line2: 'rgba(255,255,255,0.09)',
    orange: '#FF6B35', red: '#EF4444', green: '#22C55E', blue: '#60A5FA',
};

type Props = {
    visible: boolean;
    application: any | null;
    /** Current hired total + the gig's slot count, for the "x → y of z" line. */
    hiredCount: number;
    slotsTotal: number;
    onClose: () => void;
    /** Fires the demote (hired -> shortlisted). */
    onConfirm: (applicationId: string) => void;
};

export function RemoveHireSheet({
    visible, application, hiredCount, slotsTotal, onClose, onConfirm,
}: Props) {
    if (!visible || !application) return null;

    const displayName = ((application.artistSnapshot?.displayName ?? '') as string).trim() || 'Artist';
    const firstName = displayName.split(/\s+/)[0] || displayName;
    const initials = displayName
        .split(/\s+/).map((s: string) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'A';
    const artistType = ((application.artistSnapshot?.artistType ?? '') as string).trim();
    const city = ((application.artistSnapshot?.primaryCity ?? application.artistSnapshot?.location ?? '') as string).trim();
    const sub = ['Hired', artistType, city].filter(Boolean).join(' · ');

    // Slot math mirrors the hub's "x / y": one hire comes off, one slot reopens.
    const hiredAfter = Math.max(0, hiredCount - 1);
    const openAfter = Math.max(0, slotsTotal - hiredAfter);
    const slotLine = slotsTotal > 0
        ? `Hired goes ${hiredCount} → ${hiredAfter} of ${slotsTotal} · ${openAfter} ${openAfter === 1 ? 'slot' : 'slots'} open again`
        : 'The slot reopens for applications';

    return (
        <Modal visible transparent animationType="slide" onRequestClose={onClose}>
            <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <Pressable onPress={(e) => e.stopPropagation()} style={{
                    backgroundColor: COLORS.bg0,
                    borderTopLeftRadius: 24, borderTopRightRadius: 24,
                    paddingTop: 12, paddingBottom: 32,
                }}>
                    {/* drag handle */}
                    <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', marginBottom: 16 }} />

                    {/* title + close */}
                    <View style={{ paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, color: COLORS.text0, letterSpacing: -0.3 }}>
                            Remove from the cast?
                        </Text>
                        <TouchableOpacity onPress={onClose} accessibilityLabel="Close" hitSlop={8}>
                            <X size={20} color={COLORS.text2} />
                        </TouchableOpacity>
                    </View>

                    {/* who */}
                    <View style={{ paddingHorizontal: 24, marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{
                            width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bg2,
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Text style={{ color: COLORS.text0, fontWeight: '700', fontSize: 13 }}>{initials}</Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={{ color: COLORS.text0, fontSize: 15, fontWeight: '700' }} numberOfLines={1}>{displayName}</Text>
                            <Text style={{ color: COLORS.text2, fontSize: 12, marginTop: 3 }} numberOfLines={1}>{sub}</Text>
                        </View>
                    </View>

                    {/* cascade — what changes */}
                    <View style={{ paddingHorizontal: 24, marginTop: 20, gap: 14 }}>
                        <CascadeItem
                            icon={Plus} tint={COLORS.green}
                            title="Reopens 1 slot"
                            body={slotLine}
                        />
                        <CascadeItem
                            icon={Undo2} tint={COLORS.blue}
                            title="Back to your shortlist"
                            body="Not a rejection — returns to your picks"
                        />
                        <CascadeItem
                            icon={Bell} tint={COLORS.orange}
                            title={`${firstName} is notified`}
                            body="Told the booking was withdrawn"
                        />
                        <CascadeItem
                            glyph="₹" tint={COLORS.text2} muted
                            title="No payment impact"
                            body="Payments aren't live yet"
                        />
                    </View>

                    {/* actions */}
                    <View style={{ paddingHorizontal: 24, marginTop: 24, flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                            onPress={onClose}
                            accessibilityLabel={`Keep ${displayName} hired`}
                            style={{
                                flex: 1, paddingVertical: 15, borderRadius: 13,
                                borderWidth: 1, borderColor: COLORS.line2, alignItems: 'center', justifyContent: 'center',
                            }}>
                            <Text style={{ color: COLORS.text1, fontSize: 14, fontWeight: '700' }}>Keep hired</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => onConfirm(application._id)}
                            accessibilityLabel={`Remove ${displayName} and reopen the slot`}
                            style={{
                                flex: 1.4, paddingVertical: 15, borderRadius: 13,
                                backgroundColor: COLORS.orange, alignItems: 'center', justifyContent: 'center',
                            }}>
                            <Text style={{ color: '#160A04', fontSize: 14, fontWeight: '700' }}>Remove &amp; reopen slot</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

function CascadeItem({
    icon: Icon, glyph, tint, title, body, muted,
}: {
    icon?: any; glyph?: string; tint: string; title: string; body: string; muted?: boolean;
}) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, opacity: muted ? 0.6 : 1 }}>
            <View style={{
                width: 30, height: 30, borderRadius: 9, marginTop: 1,
                backgroundColor: `${tint}1A`, borderWidth: 1, borderColor: `${tint}30`,
                alignItems: 'center', justifyContent: 'center',
            }}>
                {Icon ? <Icon size={15} color={tint} strokeWidth={2.2} />
                    : <Text style={{ color: tint, fontSize: 14, fontWeight: '700' }}>{glyph}</Text>}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: COLORS.text0, fontSize: 13.5, fontWeight: '700' }}>{title}</Text>
                <Text style={{ color: COLORS.text2, fontSize: 12, marginTop: 2, lineHeight: 16 }}>{body}</Text>
            </View>
        </View>
    );
}

export default RemoveHireSheet;
