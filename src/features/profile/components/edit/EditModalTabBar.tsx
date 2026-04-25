// src/features/profile/components/edit/EditModalTabBar.tsx
//
// Tab bar for the profile edit modal. Renders horizontally scrollable pills
// with an animated indicator that slides between tabs. Each tab has three
// possible status dots:
//   - dirty (orange): user has unsaved edits in this tab
//   - complete (green): tab passes its checkComplete predicate
//   - none
// 'optional' tabs render an additional 'OPTIONAL' microcopy badge.

import React, { useRef, useEffect, useState } from 'react';
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
    const [, force] = useState(0); // force a re-render once layouts arrive

    useEffect(() => {
        const l = layouts[active as string];
        if (!l) return;
        Animated.parallel([
            Animated.timing(indicatorX, { toValue: l.x, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
            Animated.timing(indicatorW, { toValue: l.w, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        ]).start();
    }, [active, layouts]);

    return (
        <View style={{ borderBottomWidth: 1, borderBottomColor: P.border }}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 6 }}>
                <View>
                    {/* Pill indicator — absolutely positioned over the tab row */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: indicatorW,
                            transform: [{ translateX: indicatorX }],
                            backgroundColor: `${P.orange}18`,
                            borderRadius: 999,
                        }}
                    />
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                        {tabs.map(tab => {
                            const Icon = tab.icon;
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
                                        force(n => n + 1);
                                    }}
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14 }}>
                                    <Icon size={14} color={isActive ? P.textPrimary : P.textMuted} />
                                    <Text style={{
                                        fontFamily: isActive ? 'Outfit-Bold' : 'Outfit-Medium',
                                        fontSize: 12,
                                        color: isActive ? P.textPrimary : P.textSecondary,
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
