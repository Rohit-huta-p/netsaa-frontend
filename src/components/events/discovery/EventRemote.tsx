// EventRemote — the mobile refine surface (width < 768).
//
// Sits inline directly under the Ask bar, right-aligned: collapsed it's a
// compact trigger pill; tap → it expands downward (accordion, in the scroll
// flow) into a six-row tuner (Craft · City · Format · When · Price · Sort).
// Live-applies on every tap — the grid below reacts immediately.

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    UIManager,
    LayoutAnimation,
} from 'react-native';
import { SlidersHorizontal, ChevronUp, ChevronDown } from 'lucide-react-native';

import { EventFilterState } from '@/types/eventFilters';
import { countActiveEventFilters } from '@/lib/constants/eventFilters';
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
    describeFilters,
} from './eventFilterOptions';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
    filters: EventFilterState;
    onChange: (next: EventFilterState) => void;
}

const Pill = ({
    label,
    active,
    onPress,
}: {
    label: string;
    active: boolean;
    onPress: () => void;
}) => (
    <TouchableOpacity
        onPress={onPress}
        style={[styles.pill, active && { backgroundColor: ACTIVE_BG, borderColor: ACTIVE_BORDER }]}
    >
        <Text style={[styles.pillText, active && { color: ACTIVE_FG }]}>{label}</Text>
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
    <View style={{ marginBottom: 14 }}>
        <Text style={styles.groupLabel}>{label}</Text>
        <View style={styles.pillWrap}>
            {options.map((o) => (
                <Pill key={o.value} label={o.label} active={value === o.value} onPress={() => onSelect(o.value)} />
            ))}
        </View>
    </View>
);

export function EventRemote({ filters, onChange }: Props) {
    const [open, setOpen] = useState(false);

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpen((o) => !o);
    };

    const count = countActiveEventFilters(filters);
    const parts = describeFilters(filters);
    const sortLabel = SORT_OPTIONS.find((s) => s.value === sortValue(filters))?.label ?? 'Relevant';
    const lead = parts.length ? parts.slice(0, 2).join(' · ') : 'Filters';

    const Summary = ({ grow }: { grow?: boolean }) => (
        <Text style={[styles.sum, grow && { flex: 1 }]} numberOfLines={1}>
            {lead} · <Text style={{ color: '#fb923c', fontWeight: '600' }}>{sortLabel}</Text>
        </Text>
    );
    const Badge = () =>
        count > 0 ? (
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{count}</Text>
            </View>
        ) : null;

    if (!open) {
        // Collapsed — compact trigger pill, hugged to the right end.
        return (
            <View style={styles.collapsedRow}>
                <TouchableOpacity activeOpacity={0.85} onPress={toggle} style={styles.trigger}>
                    <SlidersHorizontal size={16} color="#fb923c" />
                    <Summary />
                    <Badge />
                    <ChevronDown size={14} color="#8C857B" />
                </TouchableOpacity>
            </View>
        );
    }

    // Expanded — full-width card, the trigger becomes its header.
    return (
        <View style={styles.card}>
            <TouchableOpacity activeOpacity={0.85} onPress={toggle} style={styles.header}>
                <SlidersHorizontal size={16} color="#fb923c" />
                <Summary grow />
                <Badge />
                <ChevronUp size={14} color="#8C857B" />
            </TouchableOpacity>
            <View style={styles.body}>
                <Group label="Craft" options={CRAFT_OPTIONS} value={craftValue(filters)} onSelect={(v) => onChange(setCraft(filters, v))} />
                <Group label="City" options={CITY_OPTIONS} value={cityValue(filters)} onSelect={(v) => onChange(setCity(filters, v))} />
                <Group label="Format" options={FORMAT_OPTIONS} value={formatValue(filters)} onSelect={(v) => onChange(setFormat(filters, v))} />
                <Group label="When" options={WHEN_OPTIONS} value={whenValue(filters)} onSelect={(v) => onChange(setWhen(filters, v))} />
                <Group label="Price" options={PRICE_OPTIONS} value={priceValue(filters)} onSelect={(v) => onChange(setPrice(filters, v))} />
                <View style={styles.divider} />
                <Group label="Sort by" options={SORT_OPTIONS} value={sortValue(filters)} onSelect={(v) => onChange(setSort(filters, v))} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    collapsedRow: { width: '100%', alignItems: 'flex-end' },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    card: {
        width: '100%',
        backgroundColor: '#0e0d13',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        borderRadius: 16,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    body: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
    sum: { color: '#F0ECE6', fontSize: 12 },
    badge: {
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: ACTIVE_FG,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
    },
    badgeText: { color: '#0a0a0a', fontSize: 10, fontWeight: '700' },
    groupLabel: {
        color: '#57524C',
        fontSize: 10,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 8,
    },
    pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    pill: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: '#0B0A0F',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
    },
    pillText: { color: '#C8C0B5', fontSize: 13 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 14 },
});
