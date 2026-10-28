// src/features/hirer-hub/components/HubOverview.tsx
//
// Manage-Gig owner overview — the top block of the hub, a faithful port of the
// "ghead + stages + slotbar + barnote + lsec" from DOCS/04-design/mockups/
// applicant-card-D.html (screens 1–3, "Applied · the flood" / "Shortlisted ·
// your picks" / "Hired · the cast").
//
//   ghead   — gig title + status pill ("● Open") + ⋯ manage-gig button
//             (⋯ is inert until B4 wires the gig-actions sheet), then a
//             "{headcount} {craft} · {venue}, {city}" meta line.
//   stages  — three tappable boxes (Applied / Shortlisted / Hired). The active
//             one is the filter: tapping swaps the body below. Counts are the
//             per-stage bucket sizes, not the lifetime total.
//   slotbar — one cell per slot; the first {hired} cells are lit orange.
//   barnote — a mono caption whose copy changes per active stage.
//   lsec    — the body list header: a per-stage label + a sort toggle (Applied /
//             Shortlisted) or an "{open} OPEN" readout (Hired).
//
// The stage state is owned by HirerGigHub (lifted) so the sticky CTA, the
// "Fill slot" shortcuts and the overview all drive the same selection.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MoreHorizontal, ChevronDown } from 'lucide-react-native';
import type { HubStage } from '../hooks/useGigHubData';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878', text3: '#5C5A66', text4: '#3F3D4A',
    orange: '#FF6B35', orangeTint: '#FFCBB2', green: '#22C55E',
    card: '#0D0B12', cardLine: 'rgba(243,239,232,0.07)',
    stageOnBg: 'rgba(255,107,53,0.10)', stageOnLine: 'rgba(255,107,53,0.5)',
    slotOff: '#2A2A35',
    menuLine: 'rgba(255,255,255,0.12)',
};

const HORIZ = 24;

// Status pill — maps gig.status to the mockup's "● Open" treatment. A published
// gig is "Open" (accepting applications); the rest keep sensible labels.
const STATUS_PILL: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: '#6B6878' },
    published: { label: 'Open', color: '#22C55E' },
    closed: { label: 'Closed', color: '#EF4444' },
    paused: { label: 'Paused', color: '#F59E0B' },
    expired: { label: 'Expired', color: '#EF4444' },
};

type StageCounts = { applied: number; shortlisted: number; hired: number };

type Props = {
    title: string;
    statusKey?: string;
    /** "{headcount} {craft} · {venue}, {city}" — composed by the hub. */
    metaLine?: string;
    counts: StageCounts;
    slotsTotal: number;
    activeStage: HubStage;
    onSelectStage: (stage: HubStage) => void;
    /** Sort toggle for the Applied / Shortlisted lists ("RATING" | "RECENT"). */
    sortLabel?: string;
    onToggleSort?: () => void;
    /** ⋯ manage-gig menu. Inert (undefined) until B4. */
    onMenu?: () => void;
};

const STAGE_ORDER: { key: HubStage; label: string }[] = [
    { key: 'applied', label: 'Applied' },
    { key: 'shortlisted', label: 'Shortlisted' },
    { key: 'hired', label: 'Hired' },
];

export function HubOverview({
    title, statusKey, metaLine, counts, slotsTotal,
    activeStage, onSelectStage, sortLabel = 'RATING', onToggleSort, onMenu,
}: Props) {
    const pill = STATUS_PILL[statusKey ?? ''] ?? STATUS_PILL.published;
    const filled = counts.hired;
    const total = Math.max(slotsTotal, filled);
    const open = Math.max(0, total - filled);

    // barnote copy per stage (mockup screens 1 / 2 / 3).
    const barnote =
        activeStage === 'shortlisted'
            ? (open > 0
                ? `FILL ${open} MORE FROM THESE ${counts.shortlisted}`
                : `${filled} OF ${total} SLOTS FILLED`)
            : `${filled} OF ${total} SLOTS FILLED${open > 0 ? (activeStage === 'hired' ? ` · ${open} OPEN` : ` · ${open} MORE TO HIRE`) : ''}`;

    // lsec label per stage.
    const lsecLabel =
        activeStage === 'applied' ? `New applicants · ${counts.applied}`
        : activeStage === 'shortlisted' ? `Your picks · ${counts.shortlisted}`
        : `The cast · ${filled} of ${total}`;

    return (
        <View>
            {/* ghead — title + status pill + ⋯, then the meta line */}
            <View style={{ paddingHorizontal: HORIZ, paddingTop: 12, paddingBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text
                        style={{ flex: 1, fontFamily: 'Outfit-Bold', fontSize: 19, color: COLORS.text0, letterSpacing: -0.3 }}
                        numberOfLines={1}>
                        {title}
                    </Text>
                    <View
                        style={{
                            flexDirection: 'row', alignItems: 'center', gap: 5,
                            paddingVertical: 4, paddingHorizontal: 9, borderRadius: 999,
                            backgroundColor: `${pill.color}1A`, borderWidth: 1, borderColor: `${pill.color}48`,
                        }}>
                        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: pill.color }} />
                        <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 8.5, letterSpacing: 1, color: pill.color, textTransform: 'uppercase' }}>
                            {pill.label}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={onMenu}
                        disabled={!onMenu}
                        accessibilityLabel="Manage gig"
                        hitSlop={8}
                        style={{
                            width: 32, height: 32, borderRadius: 9,
                            borderWidth: 1, borderColor: COLORS.menuLine,
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                        <MoreHorizontal size={18} color={COLORS.text1} />
                    </TouchableOpacity>
                </View>
                {metaLine ? (
                    <Text style={{ fontSize: 11.5, color: COLORS.text2, marginTop: 6 }} numberOfLines={1}>
                        {metaLine}
                    </Text>
                ) : null}
            </View>

            {/* stages — the segmented filter; active box = the body shown below */}
            <View style={{ flexDirection: 'row', gap: 7, paddingHorizontal: HORIZ }}>
                {STAGE_ORDER.map(({ key, label }) => {
                    const on = key === activeStage;
                    return (
                        <TouchableOpacity
                            key={key}
                            onPress={() => onSelectStage(key)}
                            accessibilityLabel={`${label} stage`}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: on }}
                            activeOpacity={0.8}
                            style={{
                                flex: 1, paddingVertical: 9, paddingHorizontal: 8, borderRadius: 12,
                                alignItems: 'center',
                                backgroundColor: on ? COLORS.stageOnBg : COLORS.card,
                                borderWidth: 1, borderColor: on ? COLORS.stageOnLine : COLORS.cardLine,
                            }}>
                            <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 17, color: COLORS.text0 }}>
                                {counts[key]}
                            </Text>
                            <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 7.5, letterSpacing: 0.7, textTransform: 'uppercase', marginTop: 3, color: on ? COLORS.orangeTint : COLORS.text2 }}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* slot bar — filled cells lit orange */}
            {total > 0 ? (
                <View style={{ flexDirection: 'row', gap: 3, height: 5, marginTop: 12, paddingHorizontal: HORIZ }}>
                    {Array.from({ length: total }).map((_, i) => (
                        <View key={i} style={{ flex: 1, borderRadius: 3, backgroundColor: i < filled ? COLORS.orange : COLORS.slotOff }} />
                    ))}
                </View>
            ) : null}

            <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 8, letterSpacing: 1, color: COLORS.text3, textTransform: 'uppercase', marginTop: 8, paddingHorizontal: HORIZ }}>
                {barnote}
            </Text>

            {/* lsec — the body list header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: HORIZ, paddingTop: 16, paddingBottom: 2 }}>
                <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', color: COLORS.text2 }}>
                    {lsecLabel}
                </Text>
                {activeStage === 'hired' ? (
                    <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: open > 0 ? COLORS.orangeTint : COLORS.text3 }}>
                        {open > 0 ? `${open} Open` : 'Full'}
                    </Text>
                ) : (
                    <TouchableOpacity
                        onPress={onToggleSort}
                        disabled={!onToggleSort}
                        accessibilityLabel={`Sort by ${sortLabel.toLowerCase()}`}
                        hitSlop={8}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 9, letterSpacing: 0.6, color: COLORS.orangeTint }}>
                            SORT
                        </Text>
                        <ChevronDown size={11} color={COLORS.orangeTint} strokeWidth={2.2} />
                        <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 9, letterSpacing: 0.6, color: COLORS.orangeTint }}>
                            {sortLabel}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
