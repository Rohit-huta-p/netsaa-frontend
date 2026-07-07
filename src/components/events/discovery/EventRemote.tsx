// EventRemote — the mobile refine surface (width < 768).
//
// Collapsed: a compact pill hugged to the right end, under the Ask bar, sitting
// in a reserved-height row. Tap → a 66%-width panel scales in FROM THE PILL'S
// TOP-RIGHT CORNER and overlays the list as an absolute layer — the grid below
// does NOT move. Tap the header to close (reverses). Live-applies on every tap.
//
// Motion: react-native-reanimated. progress 0→1 drives opacity + scale (0.86→1)
// with transformOrigin 'top right', so the panel emanates from where the thumb
// tapped. The pill cross-fades out as the panel comes in.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';
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

interface Props {
    filters: EventFilterState;
    onChange: (next: EventFilterState) => void;
}

const PILL_ROW_H = 36; // reserved so the grid never shifts when the panel opens
const OPEN_MS = 260;
const CLOSE_MS = 190;

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
        <View style={styles.pillWrapRow}>
            {options.map((o) => (
                <Pill key={o.value} label={o.label} active={value === o.value} onPress={() => onSelect(o.value)} />
            ))}
        </View>
    </View>
);

export function EventRemote({ filters, onChange }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const progress = useSharedValue(0);

    const toggle = () => {
        const next = !isOpen;
        setIsOpen(next);
        progress.value = withTiming(next ? 1 : 0, {
            duration: next ? OPEN_MS : CLOSE_MS,
            easing: next ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        });
    };

    // Panel emanates from the top-right corner (where the pill is).
    const panelAnim = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [{ scale: 0.86 + progress.value * 0.14 }],
    }));
    // Pill cross-fades out as the panel comes in.
    const pillAnim = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));

    const count = countActiveEventFilters(filters);
    const parts = describeFilters(filters);
    const sortLabel = SORT_OPTIONS.find((s) => s.value === sortValue(filters))?.label ?? 'Relevant';
    const lead = parts.length ? parts.slice(0, 2).join(' · ') : 'Filters';

    const Badge = () =>
        count > 0 ? (
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{count}</Text>
            </View>
        ) : null;

    return (
        // zIndex is always on (harmless when closed — nothing overlaps); elevation
        // only while open so Android lifts the overlay above the grid without
        // casting a stray shadow line under the collapsed pill.
        <View style={[styles.wrap, { zIndex: 30, elevation: isOpen ? 24 : 0 }]}>
            {/* Open panel — absolute overlay, 66% width, scales from top-right. */}
            <Animated.View style={[styles.panel, panelAnim]} pointerEvents={isOpen ? 'auto' : 'none'}>
                <TouchableOpacity activeOpacity={0.85} onPress={toggle} style={styles.header}>
                    <SlidersHorizontal size={16} color="#fb923c" />
                    <Text style={[styles.sum, { flex: 1 }]} numberOfLines={1}>
                        {lead} · <Text style={{ color: '#fb923c', fontWeight: '600' }}>{sortLabel}</Text>
                    </Text>
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
            </Animated.View>

            {/* Collapsed trigger pill — absolute, hugged to the right end. */}
            <Animated.View style={[styles.pillDock, pillAnim]} pointerEvents={isOpen ? 'none' : 'auto'}>
                <TouchableOpacity activeOpacity={0.85} onPress={toggle} style={styles.trigger}>
                    <SlidersHorizontal size={16} color="#fb923c" />
                    <Text style={styles.triggerLabel}>Filters</Text>
                    <Badge />
                    <ChevronDown size={14} color="#8C857B" />
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { position: 'relative', minHeight: PILL_ROW_H, marginBottom: 20 },
    panel: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: '66%',
        transformOrigin: 'top right',
        backgroundColor: '#0e0d13',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        borderRadius: 16,
        overflow: 'hidden',
        zIndex: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.5,
        shadowRadius: 26,
        elevation: 16,
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
    pillDock: { position: 'absolute', top: 0, right: 0, zIndex: 1 },
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
    triggerLabel: { color: '#F0ECE6', fontSize: 12 },
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
    pillWrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
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
