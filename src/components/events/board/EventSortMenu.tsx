// src/components/events/board/EventSortMenu.tsx
//
// Board-level sort for the events board: a 46×46 icon button + an anchored
// popover (Relevant / Soonest / Price ↑ / Popular). Mirrors the gig board's
// BoardSortMenu; options come from the events SORT_OPTIONS so the emitted
// EventFilterState (advanced.sorting.sortBy) is unchanged — 'soonest' is applied
// server-side, 'price_low'/'popular' client-side (handled by the screen).

import React, { useRef, useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, useWindowDimensions } from 'react-native';
import { ArrowUpDown, Check } from 'lucide-react-native';
import { SORT_OPTIONS } from '@/components/events/discovery/eventFilterOptions';
import { C, F } from './theme';

export function EventSortMenu({ value, onSelect }: { value: string; onSelect: (v: string) => void }) {
    const { width } = useWindowDimensions();
    const btnRef = useRef<View>(null);
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 72, right: 20 });
    const active = value !== 'relevance';

    const openMenu = () => {
        btnRef.current?.measureInWindow((x, y, w, h) => {
            setPos({ top: y + h + 8, right: Math.max(12, width - (x + w)) });
            setOpen(true);
        });
        setOpen(true); // fallback if measure is async/unavailable on web
    };

    return (
        <>
            <View ref={btnRef} collapsable={false}>
                <Pressable onPress={openMenu} style={[s.btn, active && s.btnOn]} hitSlop={4} accessibilityLabel="Sort">
                    <ArrowUpDown size={18} color={active ? C.orange : C.cream} />
                </Pressable>
            </View>

            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
                    <View style={[s.menu, { top: pos.top, right: pos.right }]}>
                        <Text style={s.label}>SORT BY</Text>
                        {SORT_OPTIONS.map((o) => {
                            const on = o.value === value;
                            return (
                                <Pressable
                                    key={o.value}
                                    style={s.opt}
                                    onPress={() => {
                                        onSelect(o.value);
                                        setOpen(false);
                                    }}
                                >
                                    <Text style={[s.optTxt, on && s.optTxtOn]}>{o.label}</Text>
                                    {on ? <Check size={13} color={C.orange} /> : null}
                                </Pressable>
                            );
                        })}
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}

const s = StyleSheet.create({
    btn: {
        width: 46,
        height: 46,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.hair,
        backgroundColor: C.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnOn: { borderColor: 'rgba(255,107,53,0.35)' },
    backdrop: { flex: 1 },
    menu: {
        position: 'absolute',
        minWidth: 168,
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.hair,
        borderRadius: 13,
        padding: 7,
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 18 },
        elevation: 12,
    },
    label: {
        fontFamily: F.mono,
        fontSize: 9,
        letterSpacing: 1.4,
        color: C.t4,
        paddingHorizontal: 10,
        paddingTop: 6,
        paddingBottom: 8,
    },
    opt: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 11,
        paddingVertical: 10,
        borderRadius: 9,
    },
    optTxt: { fontFamily: F.semi, fontSize: 13, color: C.t2 },
    optTxtOn: { color: C.orange },
});
