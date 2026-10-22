// src/features/hirer-hub/components/HubTeamSection.tsx
//
// "The cast" — the hired roster on the owner's Manage-Gig hub (DOCS/04-design/
// mockups/applicant-card-D.html, "Hired · the cast" frame). Each hired artist
// renders as the SAME card D used across the pipeline, in its hired state
// (green "Hired" tag + Message · Remove footer). A slot bar frames how many of
// the gig's slots are filled, and every still-open slot gets its own row with a
// Fill shortcut back to the applicants list.
//
// Remove here is the B3 cascade: it opens the Remove-hire confirm sheet, then
// demotes hired -> shortlisted (slot reopens, artist back on the shortlist).
//
// Note: this replaces the interim payment-row roster (HubTeamRowPayment), which
// was a PAYMENTS-DISABLED placeholder. Pay follows pay-as-fact — it is not shown
// on the card; it lives in the artist/team detail. HubTeamRowPayment is kept in
// the tree for the payments track to restore when on-platform Razorpay ships.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { HubApplicantRow } from './HubApplicantRow';
import type { TeamRowData } from '../hooks/useGigHubData';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878', text3: '#3F3D4A',
    orange: '#FF6B35', line2: 'rgba(255,255,255,0.09)',
    slotOn: '#FF6B35', slotOff: '#2A2A35',
};

type Props = {
    teamRows: TeamRowData[];
    /** The gig's slot count (hub KPI slotsTotal) — drives the bar + open rows. */
    slotsTotal: number;
    /** Venue city → the card's amber "out of town" pin. */
    venueCity?: string;
    /** Tap a cast card body — Hub opens the artist's profile. */
    onTapApplicant?: (applicationId: string) => void;
    /** Message a cast member — Hub opens the contact sheet. */
    onMessage?: (applicationId: string) => void;
    /** Remove a hire — Hub opens the Remove-hire confirm sheet. */
    onRemove?: (applicationId: string) => void;
    /** Fill an open slot — Hub scrolls to the applicants list. */
    onFillSlot?: () => void;
};

export function HubTeamSection({
    teamRows, slotsTotal, venueCity, onTapApplicant, onMessage, onRemove, onFillSlot,
}: Props) {
    const filled = teamRows.length;
    const total = Math.max(slotsTotal, filled);
    const openCount = Math.max(0, total - filled);
    const barCells = Array.from({ length: total });

    return (
        <View style={{ paddingTop: 36, paddingBottom: 8, paddingHorizontal: 24 }}>
            <View style={{ marginBottom: 14, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 24, color: COLORS.text0, letterSpacing: -0.4 }}>
                    The cast
                </Text>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {filled} of {total}
                </Text>
            </View>

            {/* slot bar — filled slots in orange, open slots muted */}
            {total > 0 ? (
                <>
                    <View style={{ flexDirection: 'row', gap: 3, height: 6, marginBottom: 8 }}>
                        {barCells.map((_, i) => (
                            <View key={i} style={{ flex: 1, borderRadius: 3, backgroundColor: i < filled ? COLORS.slotOn : COLORS.slotOff }} />
                        ))}
                    </View>
                    <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 8.5, letterSpacing: 1, color: COLORS.text3, textTransform: 'uppercase', marginBottom: 18 }}>
                        {filled} of {total} slots filled{openCount > 0 ? ` · ${openCount} open` : ''}
                    </Text>
                </>
            ) : null}

            {/* the cast — card D, hired state (Message · Remove footer) */}
            {teamRows.map((row, i) => (
                <HubApplicantRow
                    key={row.application?._id ?? i}
                    application={row.application}
                    venueCity={venueCity}
                    onTap={onTapApplicant}
                    onMessage={onMessage}
                    onRemove={onRemove}
                />
            ))}

            {/* open slots — one row each, with a Fill shortcut to the applicants */}
            {Array.from({ length: openCount }).map((_, i) => (
                <OpenSlotRow key={`slot-${i}`} index={filled + i + 1} total={total} onFill={onFillSlot} />
            ))}
        </View>
    );
}

function OpenSlotRow({ index, total, onFill }: { index: number; total: number; onFill?: () => void }) {
    return (
        <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 11,
            padding: 14, marginBottom: 10, borderRadius: 16,
            borderWidth: 1, borderColor: COLORS.line2, borderStyle: 'dashed',
        }}>
            <View style={{
                width: 44, height: 44, borderRadius: 14,
                borderWidth: 1, borderColor: COLORS.line2, borderStyle: 'dashed',
                alignItems: 'center', justifyContent: 'center',
            }}>
                <Plus size={18} color={COLORS.text3} strokeWidth={2} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 14, color: COLORS.text1 }}>Open slot</Text>
                <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 8, letterSpacing: 0.8, color: COLORS.text3, textTransform: 'uppercase', marginTop: 3 }}>
                    Slot {index} of {total}
                </Text>
            </View>
            {onFill ? (
                <TouchableOpacity
                    onPress={onFill}
                    accessibilityLabel={`Fill slot ${index}`}
                    hitSlop={6}
                    style={{
                        height: 31, paddingHorizontal: 14, borderRadius: 9,
                        backgroundColor: COLORS.orange, alignItems: 'center', justifyContent: 'center',
                    }}>
                    <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 12.5, color: '#160A04', letterSpacing: 0.2 }}>Fill</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}
