// src/features/hirer-hub/components/ApplicantFilterSheet.tsx
//
// The owner-hub applicant filter SHEET (bottom sheet) for the See-all screen.
// Design ref: DOCS/04-design/mockups/applicant-filters-MOCK.html (Frame B).
// Sections: Cities (multi-select) · Styles (multi-select + custom add) ·
// Experience (count chips) · Quality (toggles) · Sort (segmented). The name
// search was lifted OUT of this sheet into a visible field on the screen (so
// Search and Filters are distinct controls) — Frame B's in-sheet search is gone.
//
// Visual language (locked): selected/active = SOLID off-white-grey #DFDBD2 with
// dark #1A1A1F text — never orange, and (except the dropdown's own checkbox) no
// check icons; the fill is the cue. Orange appears ONLY on the "Show N results"
// CTA. Edits apply LIVE (the count updates as you toggle); the CTA just closes.
//
// Cities/Styles use a purpose-built row-list control (checkbox + name + count)
// to match the locked mock, rather than the shared SearchableMultiSelect whose
// pill-wrap / orange styling diverges from it. Styles adds a "create option" row.

import React, { useMemo, useState } from 'react';
import {
    View, Text, Pressable, TextInput, ScrollView, StyleSheet,
    Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Search, ChevronDown, X, Check, Plus } from 'lucide-react-native';
import {
    type ApplicantFilters, type ApplicantSort, type DerivedFilterOptions, type FilterOptionCount,
    toggleCity, toggleStyle, toggleExperience, togglePitch, togglePortfolio,
} from '../utils/applicantFilters';
import { SORT_CYCLE, SORT_LABELS } from './ApplicantFilterBar';

const C = {
    panel: '#141419', inputBg: '#101014', hair: '#1f1f27', line: '#2A2A35', rowLine: '#191921',
    card2: '#17171C', grab: '#3a3a46', ckBorder: '#3a3a46',
    t1: '#F3EFE8', t2: '#B8B1A6', t3: '#8B8B99', t4: '#6B6878', t5: '#3F3D4A',
    orange: '#FF6B35', onOrange: '#160A04',
    sel: '#DFDBD2', selTx: '#1A1A1F',
};

type Props = {
    visible: boolean;
    onClose: () => void;
    filters: ApplicantFilters;
    onChange: (next: ApplicantFilters) => void;
    sort: ApplicantSort;
    onSortChange: (s: ApplicantSort) => void;
    options: DerivedFilterOptions;
    resultCount: number;
    onClear: () => void;
};

export function ApplicantFilterSheet({
    visible, onClose, filters, onChange, sort, onSortChange, options, resultCount, onClear,
}: Props) {
    if (!visible) return null;
    return (
        <Modal visible transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView style={s.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close filters" testID="filter-sheet-backdrop" />
                <View style={s.sheet}>
                    <View style={s.grab} />
                    <View style={s.shdr}>
                        <Text style={s.shdrTitle}>Filters</Text>
                        <Pressable onPress={onClear} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear all filters">
                            <Text style={s.clear}>Clear all</Text>
                        </Pressable>
                    </View>

                    <ScrollView style={s.sbody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        {/* Cities */}
                        <View style={s.block}>
                            <Text style={s.sec}>CITIES <Text style={s.hint}>· from your applicants</Text></Text>
                            <FilterMultiSelect
                                options={options.cities}
                                selected={filters.cities}
                                onToggle={(v) => onChange(toggleCity(filters, v))}
                                placeholder="Any city"
                                searchPlaceholder="Search cities"
                            />
                        </View>

                        {/* Styles (+ custom add) */}
                        <View style={s.block}>
                            <Text style={s.sec}>STYLES <Text style={s.hint}>· type to add your own</Text></Text>
                            <FilterMultiSelect
                                options={options.styles}
                                selected={filters.styles}
                                onToggle={(v) => onChange(toggleStyle(filters, v))}
                                placeholder="Any style"
                                searchPlaceholder="Search or add a style"
                                allowCustom
                            />
                        </View>

                        {/* Experience — count chips */}
                        {options.experience.length > 0 ? (
                            <View style={s.block}>
                                <Text style={s.sec}>EXPERIENCE</Text>
                                <View style={s.chipset}>
                                    {options.experience.map((o) => {
                                        const on = filters.experience.includes(o.value);
                                        return (
                                            <Pressable
                                                key={o.value}
                                                style={[s.cchip, on && s.cchipOn]}
                                                onPress={() => onChange(toggleExperience(filters, o.value))}
                                                accessibilityRole="checkbox"
                                                accessibilityState={{ checked: on }}
                                                accessibilityLabel={`${o.label}, ${o.count}`}
                                            >
                                                <Text style={[s.cchipTxt, on && s.cchipTxtOn]}>{o.label}</Text>
                                                <Text style={[s.cchipN, on && s.cchipNOn]}>{o.count}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>
                        ) : null}

                        {/* Quality — toggles */}
                        <View style={s.block}>
                            <Text style={s.sec}>QUALITY</Text>
                            <View style={s.tgls}>
                                <Pressable
                                    style={[s.tgl, filters.pitch && s.tglOn]}
                                    onPress={() => onChange(togglePitch(filters))}
                                    accessibilityRole="switch"
                                    accessibilityState={{ checked: filters.pitch }}
                                >
                                    <Text style={[s.tglTxt, filters.pitch && s.tglTxtOn]}>Wrote a pitch</Text>
                                </Pressable>
                                <Pressable
                                    style={[s.tgl, filters.portfolio && s.tglOn]}
                                    onPress={() => onChange(togglePortfolio(filters))}
                                    accessibilityRole="switch"
                                    accessibilityState={{ checked: filters.portfolio }}
                                >
                                    <Text style={[s.tglTxt, filters.portfolio && s.tglTxtOn]}>Has portfolio</Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Sort — segmented */}
                        <View style={s.block}>
                            <Text style={s.sec}>SORT</Text>
                            <View style={s.sortseg}>
                                {SORT_CYCLE.map((v) => {
                                    const on = sort === v;
                                    return (
                                        <Pressable
                                            key={v}
                                            style={[s.so, on && s.soOn]}
                                            onPress={() => onSortChange(v)}
                                            accessibilityRole="radio"
                                            accessibilityState={{ selected: on }}
                                        >
                                            <Text style={[s.soTxt, on && s.soTxtOn]}>{SORT_LABELS[v]}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    </ScrollView>

                    <View style={s.sfoot}>
                        <Pressable style={s.cta} onPress={onClose} accessibilityRole="button" accessibilityLabel={`Show ${resultCount} results`}>
                            <Text style={s.ctaTxt}>Show {resultCount} {resultCount === 1 ? 'result' : 'results'}</Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

/* ---- Cities / Styles: field of off-white pills + expandable row dropdown ---- */
function FilterMultiSelect({
    options, selected, onToggle, placeholder, searchPlaceholder, allowCustom = false,
}: {
    options: FilterOptionCount[];
    selected: string[];
    onToggle: (value: string) => void;
    placeholder: string;
    searchPlaceholder: string;
    allowCustom?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;

    const filtered = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return options;
        return options.filter((o) => o.label.toLowerCase().includes(t) || o.value.toLowerCase().includes(t));
    }, [q, options]);

    const customValue = q.trim();
    const exact = options.some(
        (o) => o.label.toLowerCase() === customValue.toLowerCase() || o.value.toLowerCase() === customValue.toLowerCase());
    const showAdd = allowCustom && customValue.length > 0 && !exact
        && !selected.some((v) => v.toLowerCase() === customValue.toLowerCase());

    return (
        <View>
            <Pressable
                style={[s.msfield, open && s.msfieldOpen]}
                onPress={() => setOpen((o) => !o)}
                accessibilityRole="button"
                accessibilityLabel={selected.length ? `${selected.length} selected` : placeholder}
            >
                {selected.length === 0 ? (
                    <Text style={s.ph}>{placeholder}</Text>
                ) : (
                    selected.map((v) => (
                        <Pressable key={v} style={s.pill} onPress={() => onToggle(v)} hitSlop={4} accessibilityLabel={`Remove ${labelOf(v)}`}>
                            <Text style={s.pillTxt}>{labelOf(v)}</Text>
                            <X size={11} color={C.selTx} strokeWidth={2.4} />
                        </Pressable>
                    ))
                )}
                <View style={[s.car, open && { transform: [{ rotate: '180deg' }] }]}>
                    <ChevronDown size={16} color={C.t4} />
                </View>
            </Pressable>

            {open ? (
                <View style={s.dd}>
                    <View style={s.ddSearch}>
                        <Search size={14} color={C.t4} />
                        <TextInput
                            value={q}
                            onChangeText={setQ}
                            placeholder={searchPlaceholder}
                            placeholderTextColor={C.t4}
                            style={s.ddSearchInput}
                        />
                    </View>
                    <ScrollView style={{ maxHeight: 240 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled showsVerticalScrollIndicator={false}>
                        {showAdd ? (
                            <Pressable style={s.opt} onPress={() => { onToggle(customValue); setQ(''); }} accessibilityLabel={`Add ${customValue}`}>
                                <View style={s.plusbox}><Plus size={12} color={C.t3} strokeWidth={2.5} /></View>
                                <Text style={s.onm}>Add “{customValue}”</Text>
                            </Pressable>
                        ) : null}
                        {filtered.length === 0 && !showAdd ? (
                            <Text style={s.ddEmpty}>No matches.</Text>
                        ) : (
                            filtered.map((o) => {
                                const on = selected.includes(o.value);
                                return (
                                    <Pressable
                                        key={o.value}
                                        style={s.opt}
                                        onPress={() => onToggle(o.value)}
                                        accessibilityRole="checkbox"
                                        accessibilityState={{ checked: on }}
                                        accessibilityLabel={`${o.label}, ${o.count}`}
                                    >
                                        <View style={[s.ck, on && s.ckOn]}>{on ? <Check size={12} color={C.selTx} strokeWidth={3} /> : null}</View>
                                        <Text style={[s.onm, on && s.onmOn]}>{o.label}</Text>
                                        <Text style={s.oc}>{o.count}</Text>
                                    </Pressable>
                                );
                            })
                        )}
                    </ScrollView>
                </View>
            ) : null}
        </View>
    );
}

const s = StyleSheet.create({
    wrap: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: {
        maxHeight: '92%', backgroundColor: C.panel,
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        borderTopWidth: 1, borderColor: C.line,
    },
    grab: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.grab, alignSelf: 'center', marginTop: 9, marginBottom: 2 },
    shdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 6, paddingBottom: 10 },
    shdrTitle: { fontFamily: 'Outfit-Bold', fontSize: 17, color: C.t1 },
    clear: { fontFamily: 'Outfit-SemiBold', fontSize: 12, color: C.orange },
    sbody: { paddingHorizontal: 18, paddingTop: 2 },

    block: { marginBottom: 17 },
    sec: { fontFamily: 'SpaceMono-Bold', fontSize: 9.5, letterSpacing: 1.3, color: C.t4, marginBottom: 9 },
    hint: { fontFamily: 'Outfit-Regular', fontSize: 10, letterSpacing: 0, color: C.t5 },

    // multiselect field
    msfield: {
        flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, minHeight: 42,
        paddingLeft: 10, paddingRight: 36, paddingVertical: 7,
        backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.line, borderRadius: 12, position: 'relative',
    },
    msfieldOpen: { borderColor: C.t5 },
    ph: { fontFamily: 'Outfit-Regular', fontSize: 12, color: C.t5 },
    pill: {
        flexDirection: 'row', alignItems: 'center', gap: 5, height: 26, paddingHorizontal: 9, borderRadius: 999,
        backgroundColor: C.sel, borderWidth: 1, borderColor: C.sel,
    },
    pillTxt: { fontFamily: 'Outfit-SemiBold', fontSize: 11, color: C.selTx },
    car: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },

    // dropdown
    dd: { marginTop: 7, backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.hair, borderRadius: 12, overflow: 'hidden' },
    ddSearch: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.rowLine },
    ddSearchInput: { flex: 1, color: C.t1, fontFamily: 'Outfit-Regular', fontSize: 13, padding: 0 },
    opt: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.rowLine },
    ck: { width: 17, height: 17, borderRadius: 5, borderWidth: 1.5, borderColor: C.ckBorder, alignItems: 'center', justifyContent: 'center' },
    ckOn: { backgroundColor: C.sel, borderColor: C.sel },
    plusbox: { width: 17, height: 17, borderRadius: 5, borderWidth: 1.5, borderColor: '#44444f', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
    onm: { flex: 1, fontFamily: 'Outfit-Regular', fontSize: 13, color: C.t2 },
    onmOn: { color: C.t1, fontFamily: 'Outfit-SemiBold' },
    oc: { fontFamily: 'SpaceMono-Regular', fontSize: 10, color: C.t4 },
    ddEmpty: { fontFamily: 'Outfit-Regular', fontSize: 12, color: C.t4, paddingHorizontal: 12, paddingVertical: 12 },

    // experience count chips
    chipset: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    cchip: {
        flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 999,
        backgroundColor: C.card2, borderWidth: 1, borderColor: C.hair,
    },
    cchipOn: { backgroundColor: C.sel, borderColor: C.sel },
    cchipTxt: { fontFamily: 'Outfit-SemiBold', fontSize: 12, color: C.t3 },
    cchipTxtOn: { color: C.selTx },
    cchipN: { fontFamily: 'SpaceMono-Regular', fontSize: 9.5, color: C.t5 },
    cchipNOn: { color: C.selTx, opacity: 0.6 },

    // quality toggles
    tgls: { flexDirection: 'row', gap: 9 },
    tgl: {
        flex: 1, alignItems: 'center', justifyContent: 'center', height: 42, paddingHorizontal: 13,
        backgroundColor: C.card2, borderWidth: 1, borderColor: C.hair, borderRadius: 12,
    },
    tglOn: { backgroundColor: C.sel, borderColor: C.sel },
    tglTxt: { fontFamily: 'Outfit-SemiBold', fontSize: 12.5, color: C.t3 },
    tglTxtOn: { color: C.selTx },

    // sort segmented
    sortseg: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    so: { height: 32, paddingHorizontal: 13, borderRadius: 999, justifyContent: 'center', backgroundColor: C.card2, borderWidth: 1, borderColor: C.hair },
    soOn: { backgroundColor: C.sel, borderColor: C.sel },
    soTxt: { fontFamily: 'Outfit-SemiBold', fontSize: 12, color: C.t3 },
    soTxtOn: { color: C.selTx, fontFamily: 'Outfit-Bold' },

    // footer CTA
    sfoot: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 22, borderTopWidth: 1, borderTopColor: '#1d1d25' },
    cta: { height: 48, borderRadius: 14, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' },
    ctaTxt: { fontFamily: 'Outfit-Bold', fontSize: 15, color: C.onOrange },
});

export default ApplicantFilterSheet;
