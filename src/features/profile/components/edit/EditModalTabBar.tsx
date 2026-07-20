// src/features/profile/components/edit/EditModalTabBar.tsx
//
// Tab bar for the profile edit modal. Renders horizontally scrollable pills
// with an animated indicator that slides between tabs. Each tab has three
// possible status dots:
//   - dirty (orange): user has unsaved edits in this tab
//   - complete (green): tab passes its checkComplete predicate
//   - none
// 'optional' tabs render an additional 'OPTIONAL' microcopy badge.

import React, { useRef, useEffect } from 'react';
import { Animated, Easing, Pressable, ScrollView, Text, View } from 'react-native';
import { P } from './EditModalPrimitives';

export type TabBarTab<K extends string> = {
    key: K;
    label: string;
    icon: any;
    optional?: boolean;
    isComplete: boolean;
    isDirty: boolean;
};

type Props<K extends string> = {
    tabs: TabBarTab<K>[];
    active: K;
    onChange: (k: K) => void;
};

export function EditModalTabBar<K extends string>({ tabs, active, onChange }: Props<K>) {
    const layouts = useRef<Record<string, { x: number; w: number }>>({}).current;
    const indicatorX = useRef(new Animated.Value(0)).current;
    const indicatorW = useRef(new Animated.Value(0)).current;
    const scrollRef = useRef<ScrollView>(null);

    // When `active` changes, animate the pill to the new tab's measured rect.
    // First-render initialization (when no animation is wanted) happens
    // synchronously inside the active tab's `onLayout` below.
    useEffect(() => {
        const l = layouts[active as string];
        if (!l) return;
        Animated.parallel([
            Animated.timing(indicatorX, { toValue: l.x, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
            Animated.timing(indicatorW, { toValue: l.w, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        ]).start();
        // Center the active tab horizontally in the scroll view.
        scrollRef.current?.scrollTo({ x: Math.max(0, l.x + l.w / 2 - 160), animated: true });
    }, [active]);

    return (
        <View style={{ borderBottomWidth: 1, borderBottomColor: P.border }}>
            <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 6 }}>
                <View>
                    {/* Editorial underline indicator — thin orange rule under the active tab */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            left: 0,
                            bottom: 0,
                            height: 2,
                            width: indicatorW,
                            transform: [{ translateX: indicatorX }],
                            backgroundColor: P.orange,
                            borderRadius: 1,
                        }}
                    />
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                        {tabs.map(tab => {
                            const isActive = active === tab.key;
                            return (
                                <Pressable
                                    key={tab.key}
                                    onPress={() => onChange(tab.key)}
                                    onLayout={(e) => {
                                        const { x, width } = e.nativeEvent.layout;
                                        layouts[tab.key as string] = { x, w: width };
                                        if (tab.key === active) {
                                            indicatorX.setValue(x);
                                            indicatorW.setValue(width);
                                        }
                                    }}
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14 }}>
                                    <Text style={{
                                        fontFamily: isActive ? 'Outfit-Bold' : 'Outfit-Medium',
                                        fontSize: 12,
                                        letterSpacing: 1.2,
                                        textTransform: 'uppercase',
                                        color: isActive ? P.textPrimary : P.textMuted,
                                    }}>
                                        {tab.label}
                                    </Text>
                                    {tab.optional && (
                                        <Text style={{
                                            fontFamily: 'Outfit-Bold',
                                            fontSize: 8,
                                            color: P.gold,
                                            letterSpacing: 1,
                                            textTransform: 'uppercase',
                                        }}>
                                            OPTIONAL
                                        </Text>
                                    )}
                                    {tab.isDirty
                                        ? <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: P.orange }} />
                                        : tab.isComplete
                                            ? <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: P.green }} />
                                            : null}
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
