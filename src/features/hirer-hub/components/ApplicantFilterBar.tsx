// src/features/hirer-hub/components/ApplicantFilterBar.tsx
//
// The filter bar under the stage tabs on the owner-hub See-all screen
// (GigApplicantsAllScreen): a quick Sort control + a Filters button that opens
// the sheet + the applied filters as removable chips + a live "Showing N of M".
// Design ref: DOCS/04-design/mockups/applicant-filters-MOCK.html (Frame A).
//
// Visual language (locked): selected/active = SOLID off-white-grey #DFDBD2 with
// dark text (NOT orange, no check icons); orange appears ONLY on the Filters
// count badge. Tokens inlined so the bar is self-contained.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react-native';
import type { ApplicantSort, FilterChip } from '../utils/applicantFilters';

const C = {
    card2: '#17171C', hair: '#1f1f27', line: '#2A2A35',
    t1: '#F3EFE8', t3: '#8B8B99', t4: '#6B6878',
    orange: '#FF6B35', onOrange: '#160A04',
    sel: '#DFDBD2', selTx: '#1A1A1F',
};

export const SORT_LABELS: Record<ApplicantSort, string> = {
    recency: 'Recency', rating: 'Rating', experience: 'Experience', local: 'Local first',
};
// Tap-to-cycle order for the quick Sort pill (the sheet has the full picker).
export const SORT_CYCLE: ApplicantSort[] = ['recency', 'rating', 'experience', 'local'];
export const nextSort = (s: ApplicantSort): ApplicantSort =>
    SORT_CYCLE[(SORT_CYCLE.indexOf(s) + 1) % SORT_CYCLE.length];

type Props = {
    sort: ApplicantSort;
    activeCount: number;
    chips: FilterChip[];
    shown: number;
    total: number;
    onCycleSort: () => void;
    onOpenSheet: () => void;
    onRemoveChip: (chip: FilterChip) => void;
};

export function ApplicantFilterBar({
    sort, activeCount, chips, shown, total, onCycleSort, onOpenSheet, onRemoveChip,
}: Props) {
    return (
        <View>
            <View style={s.fbar}>
                {/* Quick Sort — tap cycles; the sheet carries the full 4-way picker. */}
                <TouchableOpacity
                    style={s.fseg}
                    onPress={onCycleSort}
                    accessibilityRole="button"
                    accessibilityLabel={`Sort: ${SORT_LABELS[sort]}. Tap to change.`}
                    hitSlop={6}
                >
                    <Text style={s.fsegLbl}>SORT</Text>
                    <ChevronDown size={12} color={C.t4} strokeWidth={2.2} />
                    <Text style={s.fsegVal}>{SORT_LABELS[sort]}</Text>
                </TouchableOpacity>

                {/* Filters — opens the sheet. Count badge (orange) shows active values. */}
                <TouchableOpacity
                    style={s.fbtn}
                    onPress={onOpenSheet}
                    accessibilityRole="button"
                    accessibilityLabel={activeCount > 0 ? `Filters, ${activeCount} active` : 'Filters'}
                    testID="applicant-filters-button"
                    hitSlop={6}
                >
                    <SlidersHorizontal size={14} color={C.t1} strokeWidth={2} />
                    <Text style={s.fbtnTxt}>Filters</Text>
                    {activeCount > 0 ? (
                        <View style={s.cnt}><Text style={s.cntTxt}>{activeCount}</Text></View>
                    ) : null}
                </TouchableOpacity>
            </View>

            {/* Applied filters as removable off-white chips. */}
            {chips.length > 0 ? (
                <View style={s.chips}>
                    {chips.map((chip) => (
                        <TouchableOpacity
                            key={`${chip.kind}:${chip.value}`}
                            style={s.ac}
                            onPress={() => onRemoveChip(chip)}
                            accessibilityRole="button"
                            accessibilityLabel={`Remove filter ${chip.label}`}
                            hitSlop={6}
                        >
                            <Text style={s.acTxt}>{chip.label}</Text>
                            <X size={12} color={C.selTx} strokeWidth={2.4} />
                        </TouchableOpacity>
                    ))}
                </View>
            ) : null}

            {/* Live result count. */}
            <View style={s.resline} accessibilityLabel={`Showing ${shown} of ${total}`}>
                <Text style={s.resTxt}>
                    Showing <Text style={s.resB}>{shown}</Text> of <Text style={s.resB}>{total}</Text>
                </Text>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    fbar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4, gap: 10,
    },
    fseg: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        height: 34, paddingHorizontal: 12, borderRadius: 10,
        backgroundColor: C.card2, borderWidth: 1, borderColor: C.hair,
    },
    fsegLbl: { fontFamily: 'SpaceMono-Bold', fontSize: 8.5, letterSpacing: 1, color: C.t4 },
    fsegVal: { fontFamily: 'Outfit-SemiBold', fontSize: 12, color: C.t1 },
    fbtn: {
        flexDirection: 'row', alignItems: 'center', gap: 7,
        height: 34, paddingHorizontal: 14, borderRadius: 10,
        backgroundColor: C.card2, borderWidth: 1, borderColor: C.line,
    },
    fbtnTxt: { fontFamily: 'Outfit-Bold', fontSize: 12.5, color: C.t1 },
    cnt: {
        minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9,
        backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center',
    },
    cntTxt: { fontFamily: 'Outfit-Bold', fontSize: 10.5, color: C.onOrange },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 20, paddingTop: 8 },
    ac: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        height: 26, paddingHorizontal: 9, borderRadius: 999,
        backgroundColor: C.sel, borderWidth: 1, borderColor: C.sel,
    },
    acTxt: { fontFamily: 'Outfit-SemiBold', fontSize: 11, color: C.selTx },
    resline: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 2 },
    resTxt: { fontFamily: 'SpaceMono-Regular', fontSize: 10, letterSpacing: 0.4, color: C.t3 },
    resB: { color: C.t1, fontFamily: 'SpaceMono-Bold' },
});

export default ApplicantFilterBar;
