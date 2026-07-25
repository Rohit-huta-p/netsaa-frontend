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
import { X } from 'lucide-react-native';

import { EventFilterState } from '@/types/eventFilters';
import { INITIAL_EVENT_FILTERS, countActiveEventFilters } from '@/lib/constants/eventFilters';
import {
    ACTIVE_BG,
    ACTIVE_BORDER,
    ACTIVE_FG,
    CRAFT_OPTIONS,
    CITY_OPTIONS,
    FORMAT_OPTIONS,
    WHEN_OPTIONS,
    PRICE_OPTIONS,
    SORT_OPTIONS,
    FilterOption,
    craftValue,
    cityValue,
    formatValue,
    whenValue,
    priceValue,
    sortValue,
    setCraft,
    setCity,
    setFormat,
    setWhen,
    setPrice,
    setSort,
} from './discovery/eventFilterOptions';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface EventFilterModalProps {
    visible: boolean;
    onClose: () => void;
    filters: EventFilterState;
    onApplyFilters: (filters: EventFilterState | null) => void;
    activeFilterCount: number;
}

const Chip = ({
    label,
    active,
    onPress,
}: {
    label: string;
    active: boolean;
    onPress: () => void;
}) => (
    <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
        <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
);

const Group = ({
    label,
    options,
    value,
    onSelect,
}: {
    label: string;
    options: FilterOption[];
    value: string;
    onSelect: (v: string) => void;
}) => (
    <View style={styles.group}>
        <Text style={styles.gLabel}>{label}</Text>
        <View style={styles.chips}>
            {options.map((o) => (
                <Chip key={o.value} label={o.label} active={value === o.value} onPress={() => onSelect(o.value)} />
            ))}
        </View>
    </View>
);

/**
 * EventFilterModal — a bottom sheet that slides up from the bottom (rests ~30%
 * from the top / ≈72% tall) over a dimmed scrim. Sort lives inside (combined).
 * Draft-then-apply: edits a local copy, commits on "Apply filters".
 */
export const EventFilterModal: React.FC<EventFilterModalProps> = ({
    visible,
    onClose,
    filters,
    onApplyFilters,
}) => {
    const { height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const SHEET_H = Math.round(height * 0.72);

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

    const draftCount = countActiveEventFilters(draft);
    const apply = () => {
        onApplyFilters(draft);
        onClose();
    };
    const clearAll = () => setDraft(INITIAL_EVENT_FILTERS);

    return (
        <Modal visible={rendered} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
            <View style={{ flex: 1 }}>
                <AnimatedPressable style={[styles.backdrop, backdropStyle]} onPress={onClose} />

                <Animated.View style={[styles.sheet, { height: SHEET_H }, sheetStyle]}>
                    <View style={styles.grabber} />

                    <View style={styles.head}>
                        <Text style={styles.headTitle}>
                            Filters{draftCount > 0 ? `   ·   ${draftCount} active` : ''}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.x}>
                            <X size={18} color="#a1a1aa" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.body}
                        contentContainerStyle={{ paddingBottom: 24 }}
                        showsVerticalScrollIndicator={false}
                    >
                        <Group label="Craft" options={CRAFT_OPTIONS} value={craftValue(draft)} onSelect={(v) => setDraft(setCraft(draft, v))} />
                        <Group label="City" options={CITY_OPTIONS} value={cityValue(draft)} onSelect={(v) => setDraft(setCity(draft, v))} />
                        <Group label="Format" options={FORMAT_OPTIONS} value={formatValue(draft)} onSelect={(v) => setDraft(setFormat(draft, v))} />
                        <Group label="When" options={WHEN_OPTIONS} value={whenValue(draft)} onSelect={(v) => setDraft(setWhen(draft, v))} />
                        <Group label="Price" options={PRICE_OPTIONS} value={priceValue(draft)} onSelect={(v) => setDraft(setPrice(draft, v))} />
                        <Group label="Sort by" options={SORT_OPTIONS} value={sortValue(draft)} onSelect={(v) => setDraft(setSort(draft, v))} />
                    </ScrollView>

                    <View style={[styles.foot, { paddingBottom: 14 + insets.bottom }]}>
                        <TouchableOpacity onPress={clearAll} style={styles.clear}>
                            <Text style={styles.clearText}>Clear all</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={apply} style={styles.apply}>
                            <Text style={styles.applyText}>Apply filters</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.62)' },
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0d0a0d',
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
    },
    grabber: {
        width: 38,
        height: 4,
        borderRadius: 99,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 4,
    },
    head: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: 8,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    headTitle: { color: '#fafafa', fontSize: 19, fontWeight: '800', letterSpacing: -0.2 },
    x: {
        width: 32,
        height: 32,
        borderRadius: 99,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },
    group: { marginBottom: 22 },
    gLabel: {
        color: '#52525b',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 11,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        height: 36,
        paddingHorizontal: 15,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipOn: { backgroundColor: ACTIVE_BG, borderColor: ACTIVE_BORDER },
    chipText: { fontSize: 13, fontWeight: '600', color: '#a1a1aa' },
    chipTextOn: { color: ACTIVE_FG },
    foot: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 18,
        paddingTop: 14,
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: '#0d0a0d',
    },
    clear: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearText: { color: '#a1a1aa', fontSize: 13, fontWeight: '700' },
    apply: {
        flex: 2,
        height: 50,
        borderRadius: 14,
        backgroundColor: '#fafafa',
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyText: { color: '#0a0a0a', fontSize: 13, fontWeight: '800' },
});
