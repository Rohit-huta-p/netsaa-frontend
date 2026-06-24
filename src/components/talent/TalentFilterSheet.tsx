/**
 * TalentFilterSheet.tsx
 *
 * Multi-section filter panel for the Talent directory — the successor to the
 * single-craft CraftFilterSheet. Opened by the funnel button next to the
 * search bar.
 *
 * Reuses the proven, web-safe RN Modal bottom-sheet shell from
 * CraftFilterSheet/ContactActionSheet (transparent + animationType="fade" +
 * a backdrop TouchableOpacity that closes on press). Works on Expo web and
 * native.
 *
 * Sections (top → bottom): Sort by · Craft · City · Trust · Portfolio ·
 * Experience · Gender. Edits accumulate in a local `draft`; only the Apply
 * button commits (calls onApply). Dismissing via the backdrop or the X calls
 * ONLY onClose — the draft is discarded and reverts to `applied` on next open.
 *
 * A debounced live result-count drives the Apply button label.
 */

import { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Pressable,
    StyleSheet,
    Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
    TalentFilters,
    EMPTY_FILTERS,
    directoryService,
} from '@/services/directoryService';

interface TalentFilterSheetProps {
    visible: boolean;
    applied: TalentFilters; // current committed filters
    crafts: string[]; // CATEGORIES
    cities: string[]; // CITIES (curated, Pune-first)
    role: string | null; // inline role segment — so the preview count matches the list
    q: string; // current search — so the preview count matches
    onApply: (next: TalentFilters) => void;
    onClose: () => void;
}

type SortValue = TalentFilters['sort'];
type TrustValue = TalentFilters['trust'];

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'trust', label: 'Highest trust' },
    { value: 'experience', label: 'Most experienced' },
];

const TRUST_OPTIONS: { value: TrustValue; label: string }[] = [
    { value: 'any', label: 'Any' },
    { value: 'trusted', label: 'Trusted+' },
    { value: 'verified', label: 'Verified' },
];

const EXPERIENCE_OPTIONS: { value: string; label: string }[] = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'professional', label: 'Professional' },
];

const GENDER_OPTIONS: { value: string | null; label: string; key: string }[] = [
    { value: null, label: 'Any', key: 'any' },
    { value: 'female', label: 'Female', key: 'female' },
    { value: 'male', label: 'Male', key: 'male' },
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

export function TalentFilterSheet({
    visible,
    applied,
    crafts,
    cities,
    role,
    q,
    onApply,
    onClose,
}: TalentFilterSheetProps) {
    const [draft, setDraft] = useState<TalentFilters>(applied);
    const [citySearch, setCitySearch] = useState('');

    // Reset draft to the committed filters every time the sheet opens (decision 6).
    useEffect(() => {
        if (visible) {
            setDraft(applied);
            setCitySearch('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    // Live result-count preview, debounced so dragging through chips doesn't spam the API.
    const debounced = useDebouncedValue(draft, 300);
    const { data: count, isFetching } = useQuery({
        queryKey: ['directory-count', q, role, debounced],
        queryFn: () =>
            directoryService.list({ q, role, filters: debounced, pageSize: 1 }).then((r) => r.total),
        enabled: visible,
        placeholderData: (prev) => prev, // keep last count while refetching (no flash)
    });

    // RN Web's Modal doesn't reliably hide on visible=false — unmount the whole
    // sheet (Modal included) when closed so onClose actually dismisses it.
    if (!visible) return null;

    const toggleCraft = (craft: string) =>
        setDraft((d) => ({
            ...d,
            artTypes: d.artTypes.includes(craft)
                ? d.artTypes.filter((x) => x !== craft)
                : [...d.artTypes, craft],
        }));

    const toggleExperience = (level: string) =>
        setDraft((d) => ({
            ...d,
            experience: d.experience.includes(level)
                ? d.experience.filter((x) => x !== level)
                : [...d.experience, level],
        }));

    const toggleCity = (city: string) =>
        setDraft((d) => ({
            ...d,
            city: d.city.includes(city) ? d.city.filter((x) => x !== city) : [...d.city, city],
        }));

    const visibleCities = citySearch
        ? cities.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase()))
        : cities;

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
                            accessibilityLabel="close-talent-filter"
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
                                        accessibilityLabel={`sort-${o.value}`}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Craft */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Craft</Text>
                            <View style={styles.chipWrap}>
                                {crafts.map((craft) => (
                                    <Chip
                                        key={craft}
                                        label={craft}
                                        active={draft.artTypes.includes(craft)}
                                        onPress={() => toggleCraft(craft)}
                                        accessibilityLabel={`craft-${craft}`}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* City */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>City</Text>
                            <TextInput
                                value={citySearch}
                                onChangeText={setCitySearch}
                                placeholder="Search cities…"
                                placeholderTextColor="#52525b"
                                accessibilityLabel="city-search"
                                style={styles.cityInput}
                            />
                            <View style={styles.chipWrap}>
                                {visibleCities.map((city) => (
                                    <Chip
                                        key={city}
                                        label={city}
                                        active={draft.city.includes(city)}
                                        onPress={() => toggleCity(city)}
                                        accessibilityLabel={`city-${city}`}
                                    />
                                ))}
                                {visibleCities.length === 0 && (
                                    <Text style={styles.emptyHint}>No cities match “{citySearch}”.</Text>
                                )}
                            </View>
                        </View>

                        {/* Trust */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Trust</Text>
                            <View style={styles.chipWrap}>
                                {TRUST_OPTIONS.map((o) => (
                                    <Chip
                                        key={o.value}
                                        label={o.label}
                                        active={draft.trust === o.value}
                                        onPress={() => setDraft((d) => ({ ...d, trust: o.value }))}
                                        accessibilityLabel={`trust-${o.value}`}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Portfolio */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Portfolio</Text>
                            <Pressable
                                onPress={() => setDraft((d) => ({ ...d, hasMedia: !d.hasMedia }))}
                                accessibilityRole="switch"
                                accessibilityLabel="toggle-hasMedia"
                                accessibilityState={{ checked: draft.hasMedia }}
                                style={styles.toggleRow}
                            >
                                <Text style={styles.toggleLabel}>Has photos or video</Text>
                                <View style={[styles.track, draft.hasMedia && styles.trackOn]}>
                                    <View style={[styles.thumb, draft.hasMedia && styles.thumbOn]} />
                                </View>
                            </Pressable>
                        </View>

                        {/* Experience */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Experience</Text>
                            <View style={styles.chipWrap}>
                                {EXPERIENCE_OPTIONS.map((o) => (
                                    <Chip
                                        key={o.value}
                                        label={o.label}
                                        active={draft.experience.includes(o.value)}
                                        onPress={() => toggleExperience(o.value)}
                                        accessibilityLabel={`exp-${o.value}`}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Gender */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Gender</Text>
                            <View style={styles.chipWrap}>
                                {GENDER_OPTIONS.map((o) => (
                                    <Chip
                                        key={o.key}
                                        label={o.label}
                                        active={draft.gender === o.value}
                                        onPress={() => setDraft((d) => ({ ...d, gender: o.value }))}
                                        accessibilityLabel={`gender-${o.key}`}
                                    />
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer (sticky) */}
                    <View style={styles.footer}>
                        <Pressable
                            onPress={() => setDraft(EMPTY_FILTERS)}
                            accessibilityRole="button"
                            accessibilityLabel="clear-all-filters"
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
                            accessibilityLabel="apply-filters"
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

export default TalentFilterSheet;

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
    cityInput: {
        backgroundColor: '#15151C',
        borderWidth: 1,
        borderColor: '#20202A',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 10,
        fontFamily: 'Outfit-Regular',
        color: '#f4f4f5',
        fontSize: 13,
    },
    emptyHint: {
        fontFamily: 'Outfit-Regular',
        color: '#52525b',
        fontSize: 12,
        paddingVertical: 4,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#2A2A33',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    toggleLabel: {
        fontFamily: 'Outfit-Regular',
        color: '#C9C4BA',
        fontSize: 13,
    },
    track: {
        width: 42,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#2A2A33',
        padding: 3,
        justifyContent: 'center',
    },
    trackOn: {
        backgroundColor: '#FF6B35',
    },
    thumb: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#fff',
        alignSelf: 'flex-start',
    },
    thumbOn: {
        alignSelf: 'flex-end',
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
