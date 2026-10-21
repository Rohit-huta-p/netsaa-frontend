// src/components/events/board/EventMarqueeCard.tsx
//
// Marquee poster card for the A·Minimal events board
// (DOCS/04-design/mockups/event-board-aminimal.html — locked card = Marquee).
// Cover-led: a gradient/photo cover band with the event-type chip (top-left),
// a save bookmark (top-right) and a pay-as-fact price pill (bottom-right,
// Free = green / ₹X = cream), then a serif title (2-line clamp), a mono
// date · city line and a going/applied count. Covers fall back to a branded
// gradient + monogram (Devanagari shows naturally) — never a fake stock photo.
// Pay is a plain fact: Free / ₹X, no fee or take-home math (pay-as-fact rule).

import React, { useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark, Calendar, Users } from 'lucide-react-native';
import useAuthStore from '@/stores/authStore';
import eventService, { EventDoc } from '@/services/eventService';
import {
    C,
    F,
    INK,
    fmtEventPrice,
    fmtMarqueeDate,
    eventTypeChipLabel,
    cityOf,
    goingLabel,
    eventGradient,
    monogramOf,
} from './theme';

// Bottom scrim colors — a ≥2 tuple so expo-linear-gradient's `colors` prop types.
const SCRIM = ['transparent', 'rgba(12,12,16,0.78)'] as const;

export function EventMarqueeCard({ event, onPress }: { event: EventDoc; onPress: () => void }) {
    const user = useAuthStore((s) => s.user);
    const [saved, setSaved] = useState<boolean>(!!(event as any)?.viewerContext?.saved);

    // Mirrors GigBoardCard.toggleSave: auth-gate → optimistic → reconcile/revert.
    const toggleSave = async () => {
        if (!user) return; // guests can't save
        const next = !saved;
        setSaved(next);
        try {
            const res = await eventService.saveEvent(event._id);
            if (res?.saved !== undefined) setSaved(res.saved);
        } catch {
            setSaved(!next);
        }
    };

    const price = fmtEventPrice(event);
    const chip = eventTypeChipLabel(event);
    const hero = event.media?.find((m) => m.kind === 'photo' && m.isHero) || event.media?.find((m) => m.kind === 'photo');
    const imageUri = hero?.thumbnailUrl || hero?.url;
    const grad = eventGradient(event._id || event.title);

    return (
        <Pressable onPress={onPress} style={s.card}>
            {/* Cover */}
            <View style={s.cover}>
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                    <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}>
                        <View style={s.monoWrap}>
                            <Text style={s.mono}>{monogramOf(event.title)}</Text>
                        </View>
                    </LinearGradient>
                )}

                {/* Bottom scrim — keeps the price pill legible over any cover. */}
                <LinearGradient
                    colors={SCRIM}
                    style={s.scrim}
                    pointerEvents="none"
                />

                {/* Event-type chip (top-left) */}
                <View style={[s.cc, s.chip]}>
                    <Text style={s.chipTxt} numberOfLines={1}>{chip.toUpperCase()}</Text>
                </View>

                {/* Save bookmark (top-right) — nested Pressable wins the touch, card stays tappable */}
                <Pressable onPress={toggleSave} hitSlop={8} style={[s.cc, s.save, saved && s.saveOn]} accessibilityLabel={saved ? 'Saved' : 'Save event'}>
                    <Bookmark size={13} color={saved ? C.orange : '#fff'} fill={saved ? C.orange : 'transparent'} />
                </Pressable>

                {/* Pay-as-fact price pill (bottom-right) */}
                <View style={[s.cc, s.price, price.free && s.priceFree]}>
                    <Text style={[s.priceTxt, price.free && s.priceTxtFree]}>{price.label}</Text>
                </View>
            </View>

            {/* Body */}
            <View style={s.body}>
                <Text style={s.title} numberOfLines={2}>{event.title}</Text>
                <View style={s.meta}>
                    <Calendar size={10} color={C.t3} />
                    <Text style={s.metaTxt} numberOfLines={1}>
                        {fmtMarqueeDate(event.startsAt)} · {cityOf(event)}
                    </Text>
                </View>
                <View style={s.going}>
                    <Users size={10} color={C.t3} />
                    <Text style={s.metaTxt}>{goingLabel(event)}</Text>
                </View>
            </View>
        </Pressable>
    );
}

const s = StyleSheet.create({
    card: {
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.hair,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
    },
    cover: { width: '100%', aspectRatio: 1.5, backgroundColor: C.well, position: 'relative' },
    monoWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    mono: { fontFamily: F.serif, fontSize: 30, color: 'rgba(255,255,255,0.28)' },
    scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%' },

    cc: { position: 'absolute' },
    chip: {
        top: 9,
        left: 9,
        maxWidth: '72%',
        backgroundColor: 'rgba(0,0,0,0.44)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 3,
    },
    chipTxt: { fontFamily: F.mono, fontSize: 7.5, letterSpacing: 1.2, color: '#fff' },
    save: {
        top: 8,
        right: 8,
        width: 26,
        height: 26,
        borderRadius: 999,
        backgroundColor: 'rgba(0,0,0,0.44)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveOn: { borderColor: 'rgba(255,107,53,0.6)' },
    price: {
        bottom: 8,
        right: 8,
        backgroundColor: C.cream,
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 4,
    },
    priceFree: { backgroundColor: C.green },
    priceTxt: { fontFamily: F.bold, fontSize: 11, color: INK },
    priceTxtFree: { color: '#06230F' },

    body: { padding: 12 },
    title: {
        fontFamily: F.serif,
        fontSize: 15,
        lineHeight: 18,
        letterSpacing: -0.2,
        color: C.cream,
        minHeight: 36, // keeps 1- and 2-line titles on an even grid baseline
    },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
    going: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
    metaTxt: { fontFamily: F.mono, fontSize: 8.5, letterSpacing: 0.2, color: C.t3, flexShrink: 1 },
});
