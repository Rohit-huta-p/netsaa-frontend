/**
 * RequirementFilterSheet.tsx
 *
 * Multi-section filter panel for the "Find work" requirements feed (Creative
 * Leads + agency clients). The requirements-feed counterpart to
 * TalentFilterSheet — opened by the funnel button next to the feed search bar.
 *
 * Reuses the proven, web-safe RN Modal bottom-sheet shell (transparent +
 * animationType="fade" + a backdrop TouchableOpacity that closes on press) and
 * the critical `if (!visible) return null` unmount fix — RN Web's Modal doesn't
 * reliably hide on visible=false, so we unmount the whole sheet when closed.
 * Works on Expo web and native.
 *
 * Sections (top → bottom): Sort by · City · Occasion · Min budget. Edits
 * accumulate in a local `draft`; only Apply commits (calls onApply). Dismissing
 * via the backdrop or the X calls ONLY onClose — the draft reverts to `applied`
 * on next open. A debounced live result-count drives the Apply button label.
 */

import { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Pressable,
    StyleSheet,
    Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
    RequirementFilters,
    EMPTY_REQ_FILTERS,
    requirementService,
} from '@/services/requirementService';

interface RequirementFilterSheetProps {
    visible: boolean;
    applied: RequirementFilters; // current committed filters
    q: string; // current search — so the preview count matches the list
    onApply: (next: RequirementFilters) => void;
    onClose: () => void;
}

type SortValue = RequirementFilters['sort'];

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'event', label: 'Event soonest' },
    { value: 'budget', label: 'Top budget' },
];

// Curated, Pune-first list — mirrors the Talent directory CITIES.
const CITIES = [
    'Pune',
    'Mumbai',
    'Delhi',
    'Bengaluru',
    'Hyderabad',
    'Chennai',
    'Kolkata',
    'Ahmedabad',
    'Jaipur',
    'Chandigarh',
];

const OCCASIONS = ['Wedding', 'Sangeet', 'Haldi', 'Corporate', 'Birthday'];

const BUDGET_OPTIONS: { value: number | null; label: string; key: string }[] = [
    { value: null, label: 'Any', key: 'any' },
    { value: 10000, label: '₹10k+', key: '10000' },
    { value: 25000, label: '₹25k+', key: '25000' },
    { value: 50000, label: '₹50k+', key: '50000' },
    { value: 100000, label: '₹1L+', key: '100000' },
];

/** A single pill chip (matches the talent.tsx role/craft chip styling). */
function Chip({
    label,
    active,
    onPress,
    accessibilityLabel,
}: {
    label: string;
    active: boolean;
    onPress: () => void;
    accessibilityLabel: string;
}) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
        >
            <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                {label}
            </Text>
        </Pressable>
    );
}

export function RequirementFilterSheet({
    visible,
    applied,
    q,
    onApply,
    onClose,
}: RequirementFilterSheetProps) {
    const [draft, setDraft] = useState<RequirementFilters>(applied);

    // Reset draft to the committed filters every time the sheet opens.
    useEffect(() => {
        if (visible) setDraft(applied);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    // Live result-count preview, debounced so dragging through chips doesn't spam the API.
    const debounced = useDebouncedValue(draft, 300);
    const { data: count, isFetching } = useQuery({
        queryKey: ['requirements', 'count', q, debounced],
        queryFn: () =>
            requirementService.feed({ q, filters: debounced, pageSize: 1 }).then((r) => r.total),
        enabled: visible,
        placeholderData: (prev) => prev, // keep last count while refetching (no flash)
    });

    // RN Web's Modal doesn't reliably hide on visible=false — unmount the whole
    // sheet (Modal included) when closed so onClose actually dismisses it.
    if (!visible) return null;

    const toggleCity = (city: string) =>
        setDraft((d) => ({
            ...d,
            cities: d.cities.includes(city)
                ? d.cities.filter((x) => x !== city)
                : [...d.cities, city],
        }));

    const toggleOccasion = (occ: string) =>
        setDraft((d) => ({
            ...d,
            occasions: d.occasions.includes(occ)
                ? d.occasions.filter((x) => x !== occ)
                : [...d.occasions, occ],
        }));

    const applyLabel = isFetching
        ? 'Updating…'
        : count === 0
          ? 'No matches'
          : `Show ${count ?? ''} result${count === 1 ? '' : 's'}`;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
                <View style={styles.sheet}>
                    <View style={styles.handleWrap}>
                        <View style={styles.handle} />
                    </View>

                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.eyebrow}>Filter</Text>
                            <Text style={styles.title}>Filters</Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            accessibilityLabel="close-req-filter"
                            style={styles.closeBtn}
                        >
                            <X size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                        {/* Sort by */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Sort by</Text>
                            <View style={styles.chipWrap}>
                                {SORT_OPTIONS.map((o) => (
                                    <Chip
                                        key={o.value}
                                        label={o.label}
                                        active={draft.sort === o.value}
                                        onPress={() => setDraft((d) => ({ ...d, sort: o.value }))}
                                        accessibilityLabel={`req-sort-${o.value}`}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* City */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>City</Text>
                            <View style={styles.chipWrap}>
                                {CITIES.map((city) => (
                                    <Chip
                                        key={city}
                                        label={city}
                                        active={draft.cities.includes(city)}
                                        onPress={() => toggleCity(city)}
                                        accessibilityLabel={`req-city-${city}`}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Occasion */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Occasion</Text>
                            <View style={styles.chipWrap}>
                                {OCCASIONS.map((occ) => (
                                    <Chip
                                        key={occ}
                                        label={occ}
                                        active={draft.occasions.includes(occ)}
                                        onPress={() => toggleOccasion(occ)}
                                        accessibilityLabel={`req-occasion-${occ}`}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Min budget */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Min budget</Text>
                            <View style={styles.chipWrap}>
                                {BUDGET_OPTIONS.map((o) => (
                                    <Chip
                                        key={o.key}
                                        label={o.label}
                                        active={draft.minBudget === o.value}
                                        onPress={() => setDraft((d) => ({ ...d, minBudget: o.value }))}
                                        accessibilityLabel={`req-budget-${o.key}`}
                                    />
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer (sticky) */}
                    <View style={styles.footer}>
                        <Pressable
                            onPress={() => setDraft(EMPTY_REQ_FILTERS)}
                            accessibilityRole="button"
                            accessibilityLabel="req-clear"
                            style={styles.clearBtn}
                        >
                            <Text style={styles.clearText}>Clear all</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                onApply(draft);
                                onClose();
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="req-apply"
                            style={styles.applyBtn}
                        >
                            <Text style={styles.applyText}>{applyLabel}</Text>
                        </Pressable>
                    </View>

                    {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
                </View>
            </View>
        </Modal>
    );
}

export default RequirementFilterSheet;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#0A0A0E',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        paddingBottom: 12,
    },
    handleWrap: { width: '100%', alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    eyebrow: {
        fontFamily: 'Outfit-SemiBold',
        color: '#FF6B35',
        fontSize: 10,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
    },
    title: {
        fontFamily: 'Outfit-SemiBold',
        color: '#f4f4f5',
        fontSize: 17,
        marginTop: 3,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    section: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    sectionLabel: {
        fontFamily: 'Outfit-SemiBold',
        color: '#71717a',
        fontSize: 11,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    chipWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        borderWidth: 1,
        borderRadius: 99,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    chipActive: {
        borderColor: '#FF6B35',
        backgroundColor: 'rgba(255,107,53,0.08)',
    },
    chipInactive: {
        borderColor: '#2A2A33',
        backgroundColor: 'transparent',
    },
    chipText: {
        fontSize: 12,
    },
    chipTextActive: {
        fontFamily: 'Outfit-SemiBold',
        color: '#FF6B35',
    },
    chipTextInactive: {
        fontFamily: 'Outfit-Regular',
        color: '#C9C4BA',
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    clearBtn: {
        borderWidth: 1,
        borderColor: '#2A2A33',
        borderRadius: 12,
        paddingHorizontal: 18,
        paddingVertical: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearText: {
        fontFamily: 'Outfit-SemiBold',
        color: '#C9C4BA',
        fontSize: 14,
    },
    applyBtn: {
        flex: 1,
        backgroundColor: '#FF6B35',
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyText: {
        fontFamily: 'Outfit-SemiBold',
        color: '#fff',
        fontSize: 14,
    },
});
