// src/components/events/board/EventFilterSheet.tsx
//
// The events refine sheet, A·Minimal (DOCS/04-design/mockups/event-board-aminimal.html).
// Bottom sheet over a dimmed scrim; edits a local `draft`, commits on "Apply".
// Groups, top→bottom: Event type (searchable, data-driven multi-select) ·
// Location · When · Format · Price. Mirrors the gig board's GigFilterModal
// mechanics; every selection flows through the existing setX helpers so the
// emitted EventFilterState is unchanged. Sort lives on the board toolbar (not
// here), so clearAll preserves the active sort.
//
// "Near me" is shown but DISABLED: it needs device geolocation + lat/lng on
// events + a backend geo query ($near), none of which exist yet — a real
// device+backend follow-up (see memory netsa-events-board-redesign).

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Modal,
    Pressable,
    useWindowDimensions,
    StyleSheet,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
    interpolate,
    Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, MapPin } from 'lucide-react-native';

import { EventFilterState } from '@/types/eventFilters';
import {
    CITY_OPTIONS,
    WHEN_OPTIONS,
    FORMAT_OPTIONS,
    PRICE_OPTIONS,
    FilterOption,
    eventTypeValues,
    cityValue,
    whenValue,
    formatValue,
    priceValue,
    setEventType,
    setCity,
    setWhen,
    setFormat,
    setPrice,
    setSort,
    sortValue,
    countEventFacets,
    emptyEventFilters,
} from '@/components/events/discovery/eventFilterOptions';
import { SearchableMultiSelect } from '@/components/inputs/SearchableMultiSelect';
import { C, F, INK, SHEET } from './theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Location = Anywhere + a disabled "Near me" + the cities (mockup order).
const LOCATION_OPTIONS: FilterOption[] = [
    { value: 'any', label: 'Anywhere' },
    ...CITY_OPTIONS.filter((o) => o.value !== 'any'),
];

interface EventFilterSheetProps {
    visible: boolean;
    onClose: () => void;
    filters: EventFilterState;
    onApplyFilters: (filters: EventFilterState) => void;
    /** EVENT_TYPE_OPTIONS ∪ types present in the data (derived by the screen). */
    eventTypeOptions: FilterOption[];
}

const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
        <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
);

const Group = ({
    label,
    options,
    isActive,
    onSelect,
}: {
    label: string;
    options: FilterOption[];
    isActive: (v: string) => boolean;
    onSelect: (v: string) => void;
}) => (
    <View style={styles.group}>
        <Text style={styles.gLabel}>{label}</Text>
        <View style={styles.chips}>
            {options.map((o) => (
                <Chip key={o.value} label={o.label} active={isActive(o.value)} onPress={() => onSelect(o.value)} />
            ))}
        </View>
    </View>
);

export const EventFilterSheet: React.FC<EventFilterSheetProps> = ({
    visible,
    onClose,
    filters,
    onApplyFilters,
    eventTypeOptions,
}) => {
    const { height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const SHEET_H = Math.round(height * 0.84);

    const [rendered, setRendered] = useState(visible);
    const [draft, setDraft] = useState<EventFilterState>(filters);
    const progress = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            setDraft(filters); // resync the draft each time the sheet opens
            setRendered(true);
            progress.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
        } else if (rendered) {
            progress.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) }, (fin) => {
                if (fin) runOnJS(setRendered)(false);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: interpolate(progress.value, [0, 1], [SHEET_H, 0]) }],
    }));

    const draftCount = countEventFacets(draft);
    const apply = () => {
        onApplyFilters(draft);
        onClose();
    };
    // Clear the facets but keep whatever sort is active (sort is board-owned).
    const clearAll = () => setDraft(setSort(emptyEventFilters(), sortValue(draft)));

    return (
        <Modal visible={rendered} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
            <View style={{ flex: 1 }}>
                <AnimatedPressable style={[styles.backdrop, backdropStyle]} onPress={onClose} />

                <Animated.View style={[styles.sheet, { height: SHEET_H }, sheetStyle]}>
                    <View style={styles.grabber} />

                    <View style={styles.head}>
                        <View style={styles.headTitleRow}>
                            <Text style={styles.headTitle}>Filters</Text>
                            {draftCount > 0 ? <Text style={styles.headCount}>· {draftCount} active</Text> : null}
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.x}>
                            <X size={18} color={C.t2} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.body}
                        contentContainerStyle={{ paddingBottom: 24 }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Event type — searchable, data-driven multi-select (one facet) */}
                        <View style={styles.group}>
                            <Text style={styles.gLabel}>
                                Event type <Text style={styles.hint}>· search &amp; pick</Text>
                            </Text>
                            <SearchableMultiSelect
                                selected={eventTypeValues(draft)}
                                options={eventTypeOptions}
                                onToggle={(v) => setDraft(setEventType(draft, v))}
                                placeholder="Select event types"
                                searchPlaceholder="Search event types…"
                                emptyText="No event types match."
                            />
                        </View>

                        {/* Location — Anywhere · (Near me, disabled) · cities */}
                        <View style={styles.group}>
                            <Text style={styles.gLabel}>Location</Text>
                            <View style={styles.chips}>
                                <Chip
                                    label="Anywhere"
                                    active={cityValue(draft) === 'any'}
                                    onPress={() => setDraft(setCity(draft, 'any'))}
                                />
                                {/* Near me — mocked + disabled until geolocation + a backend geo query exist. */}
                                <View style={[styles.chip, styles.chipDisabled]}>
                                    <MapPin size={12} color={C.t3} />
                                    <Text style={[styles.chipText, { color: C.t3 }]}>Near me</Text>
                                    <View style={styles.soon}><Text style={styles.soonTxt}>SOON</Text></View>
                                </View>
                                {LOCATION_OPTIONS.filter((o) => o.value !== 'any').map((o) => (
                                    <Chip
                                        key={o.value}
                                        label={o.label}
                                        active={cityValue(draft) === o.value}
                                        onPress={() => setDraft(setCity(draft, o.value))}
                                    />
                                ))}
                            </View>
                        </View>

                        <Group
                            label="When"
                            options={WHEN_OPTIONS}
                            isActive={(v) => whenValue(draft) === v}
                            onSelect={(v) => setDraft(setWhen(draft, v))}
                        />
                        <Group
                            label="Format"
                            options={FORMAT_OPTIONS}
                            isActive={(v) => formatValue(draft) === v}
                            onSelect={(v) => setDraft(setFormat(draft, v))}
                        />
                        <Group
                            label="Price"
                            options={PRICE_OPTIONS}
                            isActive={(v) => priceValue(draft) === v}
                            onSelect={(v) => setDraft(setPrice(draft, v))}
                        />
                    </ScrollView>

                    <View style={[styles.foot, { paddingBottom: 14 + insets.bottom }]}>
                        <TouchableOpacity onPress={clearAll} style={styles.clear}>
                            <Text style={styles.clearText}>CLEAR ALL</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={apply} style={styles.apply}>
                            <Text style={styles.applyText}>
                                {draftCount > 0 ? `Apply · ${draftCount} filter${draftCount > 1 ? 's' : ''}` : 'Apply filters'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,6,9,0.66)' },
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: SHEET,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        borderColor: C.hair,
    },
    grabber: {
        width: 40,
        height: 4,
        borderRadius: 99,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 2,
    },
    head: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: 10,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderColor: C.hairSoft,
    },
    headTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 9 },
    headTitle: { fontFamily: F.serif, fontSize: 21, letterSpacing: -0.3, color: C.cream },
    headCount: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1, color: C.orange },
    x: {
        width: 32,
        height: 32,
        borderRadius: 99,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: C.hair,
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },
    group: { marginBottom: 22 },
    gLabel: {
        fontFamily: F.mono,
        fontSize: 10,
        letterSpacing: 1.6,
        color: C.t4,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    hint: { fontFamily: F.body, fontSize: 9, color: C.t4, letterSpacing: 0 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        minHeight: 36,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 15,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: C.hair,
        backgroundColor: 'transparent',
        justifyContent: 'center',
    },
    chipOn: { backgroundColor: C.orange, borderColor: C.orange },
    chipText: { fontFamily: F.semi, fontSize: 13, color: C.t2 },
    chipTextOn: { color: INK, fontFamily: F.bold },
    chipDisabled: { opacity: 0.5, paddingHorizontal: 12 },
    soon: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 5,
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    soonTxt: { fontFamily: F.mono, fontSize: 7.5, letterSpacing: 1, color: C.t3 },
    foot: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 18,
        paddingTop: 14,
        borderTopWidth: 1,
        borderColor: C.hairSoft,
        backgroundColor: SHEET,
    },
    clear: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.hair,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearText: { fontFamily: F.mono, fontSize: 11, letterSpacing: 1, color: C.t2 },
    apply: {
        flex: 2,
        height: 52,
        borderRadius: 14,
        backgroundColor: C.orange,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyText: { fontFamily: F.bold, fontSize: 14, color: INK },
});
