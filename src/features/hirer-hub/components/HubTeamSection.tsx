// src/features/hirer-hub/components/HubTeamSection.tsx
//
// "The cast" — the hired roster, shown as the body of the owner hub's "Hired"
// stage (DOCS/04-design/mockups/applicant-card-D.html, "Hired · the cast").
// Each hired artist renders as the SAME card D used across the pipeline, in its
// hired state (green "Hired" tag + Message · Remove footer). Every still-open
// slot gets its own dashed row with a Fill shortcut, and a "Fill from shortlist"
// button closes out the frame.
//
// The slot bar + "N of M" header that used to live here now sit in HubOverview
// (lifted so the stage tabs, bar and barnote read as one control); this section
// is just the cast body.
//
// Remove here is the B3 cascade: it opens the Remove-hire confirm sheet, then
// demotes hired -> shortlisted (slot reopens, artist back on the shortlist).
// Pay follows pay-as-fact — not on the card; it lives in the artist/team detail.
// HubTeamRowPayment is kept in the tree for the payments track to restore when
// on-platform Razorpay ships.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus, ArrowRight } from 'lucide-react-native';
import { HubApplicantRow } from './HubApplicantRow';
import type { TeamRowData } from '../hooks/useGigHubData';

const COLORS = {
    text1: '#B8B1A6', text2: '#6B6878', text3: '#3F3D4A',
    orange: '#FF6B35', line2: 'rgba(255,255,255,0.09)',
};

type Props = {
    teamRows: TeamRowData[];
    /** The gig's slot count (hub KPI slotsTotal) — drives the open rows. */
    slotsTotal: number;
    /** Venue city → the card's amber "out of town" pin. */
    venueCity?: string;
    /** Tap a cast card body — Hub opens the artist's profile. */
    onTapApplicant?: (applicationId: string) => void;
    /** Share a cast member — Hub opens the native share sheet. */
    onShare?: (applicationId: string) => void;
    /** Message a cast member — Hub opens the contact sheet. */
    onMessage?: (applicationId: string) => void;
    /** Remove a hire — Hub opens the Remove-hire confirm sheet. */
    onRemove?: (applicationId: string) => void;
    /** Fill an open slot — Hub jumps to the shortlist to hire. */
    onFillSlot?: () => void;
    /** Empty-state copy when nobody is hired yet. */
    emptyLabel?: string;
};

export function HubTeamSection({
    teamRows, slotsTotal, venueCity, onTapApplicant, onShare, onMessage, onRemove, onFillSlot,
    emptyLabel = 'No one hired yet — hire from your shortlist to fill the cast.',
}: Props) {
    const filled = teamRows.length;
    const total = Math.max(slotsTotal, filled);
    const openCount = Math.max(0, total - filled);

    return (
        <View style={{ paddingTop: 14, paddingBottom: 8, paddingHorizontal: 24 }}>
            {filled === 0 && openCount === 0 ? (
                <Text style={{ color: COLORS.text2, fontSize: 13, textAlign: 'center', paddingVertical: 28 }}>
                    {emptyLabel}
                </Text>
            ) : null}

            {/* the cast — card D, hired state (Message · Remove footer) */}
            {teamRows.map((row, i) => (
                <HubApplicantRow
                    key={row.application?._id ?? i}
                    application={row.application}
                    venueCity={venueCity}
                    onTap={onTapApplicant}
                    onShare={onShare}
                    onMessage={onMessage}
                    onRemove={onRemove}
                />
            ))}

            {/* open slots — one row each, with a Fill shortcut to the shortlist */}
            {Array.from({ length: openCount }).map((_, i) => (
                <OpenSlotRow key={`slot-${i}`} index={filled + i + 1} total={total} onFill={onFillSlot} />
            ))}

            {/* close the frame with a "Fill from shortlist →" button */}
            {openCount > 0 && onFillSlot ? (
                <TouchableOpacity
                    onPress={onFillSlot}
                    accessibilityLabel="Fill from shortlist"
                    style={{
                        marginTop: 4, height: 44, borderRadius: 12,
                        borderWidth: 1, borderColor: COLORS.line2,
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
                    }}>
                    <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 12.5, color: COLORS.text1 }}>
                        Fill from shortlist
                    </Text>
                    <ArrowRight size={14} color={COLORS.text1} strokeWidth={2} />
                </TouchableOpacity>
            ) : null}
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
