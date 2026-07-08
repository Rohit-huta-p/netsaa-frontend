// GigFacetRail — the desktop / wide refine surface (width ≥ 768).
//
// A persistent left rail holding the gig filter facets as grouped chips with a
// live result count. Nothing ever opens over the board — filtering reads as
// browsing. Collapses to a 62px icon dock (active groups get a dot) to give the
// board room. Sort is NOT here; it rides the board header as lenses (see screen).
// Live-applies on every tap. Mirrors EventFacetRail; gig accent is purple.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ChevronsLeft, ChevronsRight, Users, IndianRupee, MapPin, Award } from 'lucide-react-native';

import { FilterState } from '@/types/filters';
import {
    ACCENT,
    ACTIVE_BG,
    ACTIVE_BORDER,
    ACTIVE_FG,
    ARTIST_OPTIONS,
    PAY_OPTIONS,
    CITY_OPTIONS,
    EXPERIENCE_OPTIONS,
    FilterOption,
    artistValues,
    payValue,
    cityValue,
    expValues,
    setArtist,
    setPay,
    setCity,
    setExperience,
    countGigFacets,
    emptyGigFilters,
} from './gigFilterOptions';

interface Props {
    filters: FilterState;
    onChange: (next: FilterState) => void;
    resultCount?: number;
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

// `isActive` is a predicate so a single Group renders both single-select groups
// (value === current) and multi-select groups (array.includes(value)).
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
    <View style={{ marginBottom: 20 }}>
        <Text style={styles.groupLabel}>{label}</Text>
        <View style={styles.pillWrap}>
            {options.map((o) => (
                <Pill key={o.value} label={o.label} active={isActive(o.value)} onPress={() => onSelect(o.value)} />
            ))}
        </View>
    </View>
);

export function GigFacetRail({ filters, onChange, resultCount }: Props) {
    const [collapsed, setCollapsed] = useState(false);
    const count = countGigFacets(filters);

    // Collapsed icon dock — each group's icon lights an accent dot when active.
    const groupIcons = [
        { key: 'artist', Icon: Users, active: artistValues(filters).length > 0 },
        { key: 'pay', Icon: IndianRupee, active: payValue(filters) !== '0' },
        { key: 'city', Icon: MapPin, active: cityValue(filters) !== 'any' },
        { key: 'experience', Icon: Award, active: expValues(filters).length > 0 },
    ];

    if (collapsed) {
        return (
            <View style={[styles.rail, { width: 62, paddingHorizontal: 11 }]}>
                <TouchableOpacity onPress={() => setCollapsed(false)} style={[styles.toggle, { alignSelf: 'center', marginBottom: 18 }]}>
                    <ChevronsRight size={15} color="#8C857B" />
                </TouchableOpacity>
                {groupIcons.map(({ key, Icon, active }) => (
                    <TouchableOpacity key={key} onPress={() => setCollapsed(false)} style={styles.iconBtn}>
                        <Icon size={17} color={active ? ACTIVE_FG : '#8C857B'} />
                        {active && <View style={styles.iconDot} />}
                    </TouchableOpacity>
                ))}
            </View>
        );
    }

    return (
        <View style={[styles.rail, { width: 262 }]}>
            <View style={styles.top}>
                <Text style={styles.rt}>Refine{count > 0 ? ` · ${count}` : ''}</Text>
                <TouchableOpacity onPress={() => setCollapsed(true)} style={styles.toggle}>
                    <ChevronsLeft size={15} color="#8C857B" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
            >
                <Group
                    label="Artist type"
                    options={ARTIST_OPTIONS}
                    isActive={(v) => artistValues(filters).includes(v)}
                    onSelect={(v) => onChange(setArtist(filters, v))}
                />
                <Group
                    label="Minimum pay"
                    options={PAY_OPTIONS}
                    isActive={(v) => payValue(filters) === v}
                    onSelect={(v) => onChange(setPay(filters, v))}
                />
                <Group
                    label="City"
                    options={CITY_OPTIONS}
                    isActive={(v) => cityValue(filters) === v}
                    onSelect={(v) => onChange(setCity(filters, v))}
                />
                <Group
                    label="Experience"
                    options={EXPERIENCE_OPTIONS}
                    isActive={(v) => expValues(filters).includes(v)}
                    onSelect={(v) => onChange(setExperience(filters, v))}
                />
            </ScrollView>

            <View style={styles.footer}>
                <Text style={styles.count}>
                    {typeof resultCount === 'number' ? `${resultCount} gig${resultCount === 1 ? '' : 's'}` : ' '}
                </Text>
                {count > 0 ? (
                    <TouchableOpacity onPress={() => onChange(emptyGigFilters())}>
                        <Text style={styles.clear}>Clear all</Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    rail: {
        borderRightWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: '#0e0d13',
        paddingTop: 20,
    },
    top: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 14,
    },
    rt: {
        color: '#57524C',
        fontSize: 10,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    toggle: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        borderRadius: 8,
        paddingHorizontal: 7,
        paddingVertical: 5,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 11,
        backgroundColor: '#131218',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 10,
    },
    iconDot: {
        position: 'absolute',
        top: -3,
        right: -3,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: ACCENT,
    },
    groupLabel: {
        color: '#57524C',
        fontSize: 10,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 9,
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
    footer: {
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    count: { color: '#8C857B', fontSize: 11 },
    clear: { color: '#57524C', fontSize: 11 },
});
